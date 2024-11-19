import os
import fastapi
import pandas as pd
from fastapi import UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pytesseract
from PIL import Image
import ollama
import json
from pdf2image import convert_from_bytes
from typing import List, Dict, Optional
from io import StringIO
from datetime import datetime

app = fastapi.FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def extract_invoice_data(pdf_bytes: bytes) -> Dict:
    """Extract data from PDF using OCR and LLM processing."""
    try:
        # Convert PDF to image with higher DPI for better quality
        doc = convert_from_bytes(pdf_bytes, 600)  # Increased DPI for better text recognition
        
        # Configure tesseract parameters for better table structure recognition
        custom_config = r'--oem 3 --psm 6 -c preserve_interword_spaces=1'
        text = pytesseract.image_to_string(doc[0], config=custom_config)
        
        # Process with LLM with more specific prompt
        prompt = """
        You are given the OCR result of an invoice with the following text:

        {text}

        Please carefully analyze the text and return a JSON object with the following fields:
        - vendor (str): The company or person who issued the invoice (look for company name at top)
        - date (str): The invoice date in YYYY-MM-DD format (convert from any format found)
        - amount (float): The total amount due (look for "TOTAL DUE", "TOTAL", or sum at bottom)
        - description (str): A concatenated description of the services/items
        - subtotal (float): The subtotal before tax and fees
        - tax (float): Any sales tax amount
        - service_fee (float): Any service fee amount

        Be especially careful to:
        1. Look for numerical values near labels like "TOTAL DUE", "SALES TAX", etc.
        2. Parse dates in format like "17/10/2024" to "2024-10-17"
        3. Combine line items into the description
        4. Extract the invoice number after 'INVOICE #'
        
        If any field cannot be determined, use null for that field.
        """
        
        # Get LLM response
        response = ollama.chat(
            model='llama3.2',
            stream=False,
            format='json',
            messages=[{
                'role': 'user',
                'content': prompt.format(text=text)
            }]
        )
        
        # Extract content from response
        response_content = json.loads(response.get('message', {}).get('content', '{}'))
        
        # Add raw text for debugging
        response_content['raw_text'] = text
        print("Response content:", response_content)  # Debug print
        
        # Add fallback amount extraction logic
        if not response_content.get('amount'):
            # Look for specific patterns
            import re
            total_patterns = [
                r'TOTAL DUE[^\d]*(\d+\.?\d*)',
                r'TOTAL[^\d]*(\d+\.?\d*)',
                r'DUE[^\d]*(\d+\.?\d*)'
            ]
            for pattern in total_patterns:
                match = re.search(pattern, text)
                if match:
                    try:
                        response_content['amount'] = float(match.group(1))
                        break
                    except (ValueError, IndexError):
                        continue
        
        return response_content
    except Exception as e:
        print(f"Error in extract_invoice_data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")
    except Exception as e:
        print(f"Error in extract_invoice_data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

def find_matches(expenses_df: pd.DataFrame, invoice_data: Dict) -> List[Dict]:
    """Find matching expense entries for an invoice."""
    try:
        matches = []
        
        # Convert invoice date to datetime for comparison
        if invoice_data.get('date'):
            invoice_date = datetime.strptime(invoice_data['date'], '%Y-%m-%d')
        else:
            return matches

        # Define matching criteria
        for _, expense in expenses_df.iterrows():
            score = 0
            max_score = 4  # Maximum possible score
            
            # Date matching (within 3 days)
            expense_date = pd.to_datetime(expense['date'])
            if abs((expense_date - invoice_date).days) <= 3:
                score += 1
                
            # Amount matching (exact match)
            # Only check amount if both values are available
            if invoice_data.get('amount') and pd.notna(expense['amount']):
                try:
                    if abs(float(expense['amount']) - float(invoice_data['amount'])) < 0.01:
                        score += 1
                except (ValueError, TypeError):
                    # Skip amount comparison if conversion fails
                    pass
                
            # Vendor matching
            if invoice_data.get('vendor') and invoice_data['vendor'].lower() in str(expense['vendor']).lower():
                score += 1
                
            # Description matching (if available)
            if invoice_data.get('description') and any(word.lower() in str(expense['description']).lower() 
                                                     for word in invoice_data['description'].split()):
                score += 1
                
            # Calculate confidence score
            confidence = (score / max_score) * 100
            
            if confidence >= 50:  # Only include matches with >50% confidence
                matches.append({
                    'expense_row': expense.to_dict(),
                    'confidence': confidence,
                    'matched_fields': {
                        'date': abs((expense_date - invoice_date).days) <= 3,
                        'amount': invoice_data.get('amount') and abs(float(expense['amount']) - float(invoice_data['amount'])) < 0.01,
                        'vendor': invoice_data.get('vendor') and invoice_data['vendor'].lower() in str(expense['vendor']).lower(),
                        'description': invoice_data.get('description') and any(word.lower() in str(expense['description']).lower() 
                                                                             for word in invoice_data['description'].split())
                    }
                })
        
        return sorted(matches, key=lambda x: x['confidence'], reverse=True)
    except Exception as e:
        print(f"Error in find_matches: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error finding matches: {str(e)}")

@app.post("/reconciliate")
async def reconciliate(
    csvFile: UploadFile = File(...),  # Changed from files to individual parameters
    pdfFile: UploadFile = File(...)
) -> Dict:
    """
    Match expense entries from a CSV file with invoice data from a PDF.
    
    Args:
        csvFile: CSV file containing expense entries
        pdfFile: PDF file containing the invoice
        
    Returns:
        Dictionary containing:
        - invoice_data: Extracted invoice information
        - matches: List of matching expense entries with confidence scores
    """
    try:
        # Verify file types
        if not csvFile.filename.endswith('.csv'):
            raise HTTPException(
                status_code=400,
                detail="First file must be a CSV file"
            )
            
        if not pdfFile.filename.endswith('.pdf'):
            raise HTTPException(
                status_code=400,
                detail="Second file must be a PDF file"
            )
        
        # Read CSV file
        csv_content = await csvFile.read()
        try:
            # Read CSV with more robust parsing
            expenses_df = pd.read_csv(
                StringIO(csv_content.decode('utf-8')),
                skipinitialspace=True,  # Skip spaces after delimiter
                encoding='utf-8'
            )
            
            # Clean column names - strip whitespace
            expenses_df.columns = [col.strip() for col in expenses_df.columns]
            
            # Convert date format from DD-MM-YYYY to YYYY-MM-DD
            try:
                expenses_df['date'] = pd.to_datetime(expenses_df['date'], format='%d-%m-%Y').dt.strftime('%Y-%m-%d')
            except Exception as e:
                print(f"Warning: Date conversion failed: {str(e)}")
                # If conversion fails, keep original dates
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Error reading CSV file: {str(e)}"
            )
        
        # Clean column names - strip whitespace
        expenses_df.columns = [col.strip() for col in expenses_df.columns]
        
        print("Found columns:", list(expenses_df.columns))  # Debug print
        
        # Add amount column if missing with placeholder
        if 'amount' not in expenses_df.columns:
            expenses_df['amount'] = None  # We'll handle this in matching logic
        
        # Process PDF file
        pdf_content = await pdfFile.read()
        invoice_data = extract_invoice_data(pdf_content)
        
        # Find matches
        matches = find_matches(expenses_df, invoice_data)
        
        return {
            "invoice_data": invoice_data,
            "number_of_rows": len(expenses_df),
            "matches": matches
        }
    except Exception as e:
        print(f"Error in reconciliate: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8080)