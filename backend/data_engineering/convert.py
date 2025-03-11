import os
import pandas as pd
import io
import logging
from azure.storage.blob import BlobServiceClient
import azure.functions as func

# Azure Blob Storage details
CONNECTION_STRING = "DefaultEndpointsProtocol=https;AccountName=systemsteam17storage;AccountKey=Wr7IgB+c6ghclYn9rcwRgNpYv16cVKe/0hUWtS1GD/wCcosZcVfFQ0UshCwir6QAykXqfFkcpBVN+AStgDyYYQ==;EndpointSuffix=core.windows.net"
INPUT_CONTAINER = "subcontractor-documents"
OUTPUT_CONTAINER = "csv-conversion"

# Define a function to categorize the "Division" based on Campaign names
def assign_division(campaign):
    if isinstance(campaign, str):
        if "Travel Retail" in campaign:
            return "Travel Retail"
        elif "Skincare" in campaign or "Make Up" in campaign or "Bleu" in campaign or "Chance" in campaign or "Coco Melle" in campaign or "No. 5" in campaign:
            return "F&B"
        elif "Fashion" in campaign or "Eyewear" in campaign:
            return "FSH&EW"
        elif "Fine Jewellery" in campaign or "Watches" in campaign or "High Jewellery" in campaign:
            return "Watches & Fine Jewellery"
        elif "PPC" in campaign:
            return "PPC"
        return "Other"

def process_unbilled(blob_name, blob_service_client):
    """Process the 'Chanel UK Unbilled.xlsx' file and save a cleaned CSV."""

    blob_client = blob_service_client.get_blob_client(INPUT_CONTAINER, blob_name)
    
    # Download file
    downloaded_blob = blob_client.download_blob().readall()

    # Read specific sheets
    sheets = {
        "F_B": "F&B",
        "WFJ": "W&FJ",
        "FASHION": "FSH&EW",
        "PAID SEARCH": "Paid Search"
    }
    
    dfs = []
    
    for sheet, division in sheets.items():
        df = pd.read_excel(io.BytesIO(downloaded_blob), sheet_name=sheet)

        # Remove header row
        df = df.iloc[1:]

        # Add division column
        df['Division'] = division

        # Remove total row
        df = df.drop(df.index[-1])

        dfs.append(df)

    # Merge all sheets into one DataFrame
    unbilled = pd.concat(dfs, ignore_index=True)

    # Convert to CSV
    csv_data = unbilled.to_csv(header=None, index=False, encoding="utf-8")

    # Upload to Blob Storage
    output_blob_client = blob_service_client.get_blob_client(OUTPUT_CONTAINER, "unbilled.csv")
    output_blob_client.upload_blob(csv_data, overwrite=True)

    logging.info("Unbilled file processed and uploaded successfully.")
    
def process_budget_tracker(blob_name, blob_service_client):
    blob_client = blob_service_client.get_blob_client(INPUT_CONTAINER, blob_name)
    downloaded_blob = blob_client.download_blob().readall()
    
    # read Excel file into pandas
    df = pd.read_excel(io.BytesIO(downloaded_blob), sheet_name="Budget tracker 16.12.24")
    
    # remove fully empty rows and columns
    df.dropna(how="all", inplace=True)
    df.dropna(how='all',axis=1, inplace=True)
    
    # ensure the first column is a string before using .str.contains()
    df.iloc[:, 0] = df.iloc[:, 0].astype(str)
    
    # find the first occurrence of "Campaign (UK)" and remove rows before it
    header_row_index = df[df.iloc[:, 0].str.contains("Campaign \(UK\)", na=False)].index[0]
    df = df.iloc[header_row_index:]  # Keep everything from this row onwards
    
    # reset index after trimming
    df.reset_index(drop=True, inplace=True)
    
    # set first row as the new header
    df.columns = df.iloc[0]  # Assign the correct headers
    df = df.iloc[1:]  # Remove the header row from the dataset
    
    # reset index again
    df.reset_index(drop=True, inplace=True)
    
    # Apply division assignment
    df["Division"] = df["Campaign (UK)"].apply(assign_division)
    
    # Create a new column 'Category' and initialize with None
    df['Category'] = None
    
    # Iterate over rows to mark rows based on "Campaign (ROI)" and "Campaign (UK)"
    roi_flag = False
    for i, row in df.iterrows():
        # Mark rows below "Campaign (ROI)" as ROI until we encounter "Campaign (UK)" or another "Campaign (ROI)"
        if 'Campaign (ROI)' in str(row.iloc[0]):
            roi_flag = True  # Start marking "ROI"
        elif 'Campaign (UK)' in str(row.iloc[0]) or 'Campaign (ROI)' in str(row.iloc[0]):
            roi_flag = False  # Stop marking "ROI"
            
    # Assign "ROI" or None based on the flag
    df.at[i, 'Category'] = 'ROI' if roi_flag else None
    
    # Create a new column to check if the row is a header
    df['Is_Header'] = df.iloc[:, 1].apply(lambda x: "CHANEL Budget (Last Update: v14)" if x == "CHANEL Budget (Last Update: v14)" else None)
    
    # Only take non ROI values
    df = df[df['Category'] != 'ROI']
    
    # Remove rows where Division = "Other"
    df = df[df['Division'] != 'Other']
    
    # Remove remaining header rows
    df = df[df['Is_Header'].isna()]
    
    # Remove Category and Is_Header
    df = df.drop(columns=['Category', 'Is_Header'])
    
    # Remove duplicate rows
    df = df.drop_duplicates()
    
    # Reset indexes for both tables
    df.reset_index(drop=True, inplace=True)
    
    # Convert DataFrame to CSV
    df_csv = df.to_csv(header=None, index=False, encoding="utf-8")
    
    # Upload CSV back to Blob Storage
    blob_client_output = blob_service_client.get_blob_client(OUTPUT_CONTAINER, "budget_tracker.csv")
    blob_client_output.upload_blob(df_csv, overwrite=True)
    
def process_annual_budget_sheet(blob_name, blob_service_client):
    
    blob_client = blob_service_client.get_blob_client(INPUT_CONTAINER, blob_name)
    
    # Download file
    downloaded_blob = blob_client.download_blob().readall()
    
    # Read the Excel file
    df = pd.read_excel(io.BytesIO(downloaded_blob), header=None)
    
    # Extracting headers assuming the first 6 rows are header rows
    header_rows = df.iloc[0:6]
    df = df.drop(index=range(0, 6))  # Drop the header rows from the DataFrame
    
    # Build headers from these rows
    headers = ["ADVERTISING AND MEDIA EXPENDITURES"]  # Explicitly set the first column header
    current_prefix = "PREVIOUS YEARS"
    for i in range(1, header_rows.shape[1]):  # Iterate column-wise
        column_headers = header_rows.iloc[:, i].dropna().unique()  # Unique non-NA values
        header_label = ', '.join(map(str, column_headers))  # Join with comma for clarity
        print(header_label)
        # Rename "FORECAST, 2024.0" to "FORECAST, YTD % 2024"
        if header_label == "2024.0":
            header_label = "YTD % 2024"
        if header_label == "2025 BUDGET       , 2025, Year, Budget":
            header_label = "Year 2025 Budget"
        if header_label == "FORECAST, 2024 CURRENT FORECAST, 2024, Year, Q3F":
            header_label = "2024 CURRENT FORECAST, Q3F"
        if header_label == "YTD VS PY, YTD 23, 2023, Nov YTD, Actual":
            header_label = "YTD 23, 2023, Nov YTD, Actual"
        if 'PERIOD' in header_label or 'FORECAST' in header_label or 'YTD VS PY' in header_label:
            current_prefix = header_label.split(',')[0]  # New prefix starts with these sections
        
        headers.append(f"{current_prefix}, {header_label}" if 'PREVIOUS YEARS' not in header_label else header_label)
        df.columns = headers  # Set the headers to DataFrame
        
        # Remove unwanted empty columns
        columns_to_remove = ["PREVIOUS YEARS", "PERIOD", "YTD VS PY"]
        
        # Remove fully empty columns that were marked as None
        df = df.dropna(axis=1, how="all")
        
        # Saving and uploading the cleaned data
        clean_csv = df.to_csv(header=None, index=False)
        blob_client_output = blob_service_client.get_blob_client(OUTPUT_CONTAINER, "annual_budget_sheet.csv")
        blob_client_output.upload_blob(clean_csv, overwrite=True)
    
def process_coupa_report(blob_name, blob_service_client):
    blob_client = blob_service_client.get_blob_client(INPUT_CONTAINER, blob_name)
    
    # Download file
    downloaded_blob = blob_client.download_blob().readall()
    
    # Read Excel sheet into pandas
    po_values = pd.read_excel(io.BytesIO(downloaded_blob))
    
    # Convert DataFrame to CSV
    po_values_csv = po_values.to_csv(header=None, index=False, encoding="utf-8")
    
    # Upload CSV back to Blob Storage
    blob_client_output = blob_service_client.get_blob_client(OUTPUT_CONTAINER, "po_values.csv")
    blob_client_output.upload_blob(po_values_csv, overwrite=True)

# Azure Function Trigger
def main(myblob: func.InputStream):
    """Triggered when a new file is uploaded."""
    blob_service_client = BlobServiceClient.from_connection_string(CONNECTION_STRING)
    
    # Check if the uploaded file is the Unbilled file
    if "Unbilled" in myblob.name:
        process_unbilled(myblob.name, blob_service_client)
    elif "Annual" in myblob.name and "Budget" in myblob.name:
        process_annual_budget_sheet(myblob.name, blob_service_client)
    elif "Tracker" in myblob.name:
        process_budget_tracker(myblob.name, blob_service_client)
    elif "COUPA" in myblob.name:
        process_coupa_report(myblob.name, blob_service_client)
