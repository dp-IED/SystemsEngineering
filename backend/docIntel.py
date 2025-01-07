import os
import fastapi
from fastapi import UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from azure.core.credentials import AzureKeyCredential
from azure.ai.documentintelligence import DocumentIntelligenceClient
from typing import Dict

# Set up Azure credentials and endpoint
AZURE_ENDPOINT = "https://group17.cognitiveservices.azure.com/"
AZURE_KEY = "839ENE97EpZtKJH0uzVgZmVZvo4o1KZiL5AFASL0Y8Nsh1WCubG0JQQJ99ALACmepeSXJ3w3AAALACOGDskG"

# Initialize the FastAPI app
app = fastapi.FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def extract_invoice_data(file: UploadFile) -> Dict:
    """Extract invoice data using Azure Document Intelligence SDK."""
    try:
        # Initialize the Document Intelligence client
        client = DocumentIntelligenceClient(endpoint=AZURE_ENDPOINT, credential=AzureKeyCredential(AZURE_KEY))
        
        # Read the uploaded file as binary
        pdf_bytes = file.file.read()
        
        # Send the document for analysis using the prebuilt-invoice model
        poller = client.begin_analyze_document(
            model_id="prebuilt-invoice",
            document=pdf_bytes,
        )
        result = poller.result()

        # Extract and organize key invoice data
        invoice_data = {}
        for document in result.documents:
            invoice_data["vendor"] = document.fields.get("VendorName", {}).value
            invoice_data["date"] = document.fields.get("InvoiceDate", {}).value
            invoice_data["amount"] = document.fields.get("InvoiceTotal", {}).value
            invoice_data["description"] = " | ".join(
                [item.value.get("Description", {}).value for item in document.fields.get("Items", {}).value] if document.fields.get("Items") else []
            )
            invoice_data["subtotal"] = document.fields.get("SubTotal", {}).value
            invoice_data["tax"] = document.fields.get("TotalTax", {}).value
            invoice_data["service_fee"] = None  # If there's no specific service fee field

        return invoice_data or {"message": "No data extracted from the invoice."}

    except Exception as e:
        print(f"Error in extract_invoice_data_using_sdk: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")
