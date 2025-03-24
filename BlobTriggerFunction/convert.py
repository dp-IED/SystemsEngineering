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
 
def assign_division(campaign):
    if isinstance(campaign, str):
        if "Travel Retail" in campaign:
            return "Travel Retail"
        elif any(x in campaign for x in ["Skincare", "Make Up", "Bleu", "Chance", "Coco Melle", "No. 5"]):
            return "F&B"
        elif any(x in campaign for x in ["Fashion", "Eyewear"]):
            return "FSH&EW"
        elif any(x in campaign for x in ["Fine Jewellery", "Watches", "High Jewellery"]):
            return "Watches & Fine Jewellery"
        elif "PPC" in campaign:
            return "PPC"
    return "Other"
 
def process_billed(blob_name, blob_service_client):
    cleaned_blob_name = blob_name.replace(f"{INPUT_CONTAINER}/", "")
    blob_client = blob_service_client.get_blob_client(INPUT_CONTAINER, cleaned_blob_name)
    downloaded_blob = blob_client.download_blob().readall()
    
    sheets = {
        "F_B": "F&B",
        "WFJ": "W&FJ",
        "FASHION": "FSH&EW",
        "PAID SEARCH": "Paid Search"
    }
    dfs = []
    for sheet, division in sheets.items():
        df = pd.read_excel(io.BytesIO(downloaded_blob), sheet_name=sheet)
        df = df.iloc[1:]
        df['Division'] = division
        df = df.drop(df.index[-1])
        dfs.append(df)
    billed = pd.concat(dfs, ignore_index=True)
    print(billed)
    csv_data = billed.to_csv(header=None, index=False, encoding="utf-8")
    output_blob_client = blob_service_client.get_blob_client(OUTPUT_CONTAINER, "billed_report.csv")
    output_blob_client.upload_blob(csv_data, overwrite=True)
    logging.info("Billed file processed and uploaded successfully.")
 
def process_budget_tracker(blob_name, blob_service_client):
    cleaned_blob_name = blob_name.replace(f"{INPUT_CONTAINER}/", "")
    blob_client = blob_service_client.get_blob_client(INPUT_CONTAINER, cleaned_blob_name)
    downloaded_blob = blob_client.download_blob().readall()
    
    df = pd.read_excel(io.BytesIO(downloaded_blob), sheet_name="Budget tracker 16.12.24")
    # remove fully empty rows and columns
    df.dropna(how="all", inplace=True)
    df.dropna(how='all',axis=1, inplace=True)
    # ensure the first column is a string before using .str.contains()
    df.iloc[:, 0] = df.iloc[:, 0].astype(str)
    # find the first occurrence of "Campaign (UK)" and remove rows before it
    header_row_index = df[df.iloc[:, 0].str.contains("Campaign \(UK\)", na=False)].index[0]
    df = df.iloc[header_row_index:]  # Keep everything from this row onwards
    df.reset_index(drop=True, inplace=True)
    # set first row as the new header
    df.columns = df.iloc[0]  # Assign the correct headers
    df = df.iloc[1:]  # Remove the header row from the dataset
    df.reset_index(drop=True, inplace=True)
 
    # Apply division assignment
    df["Division"] = df["Campaign (UK)"].apply(assign_division)
    # Create a new column 'Market' and initialize with None
    df['Market'] = None
 
    # Iterate over rows to mark rows based on "Campaign (ROI)" and "Campaign (UK)"
    roi_flag = False
    for i, row in df.iterrows():
        # Mark rows below "Campaign (ROI)" as ROI until we encounter "Campaign (UK)" or another "Campaign (ROI)"
        if 'Campaign (ROI)' in str(row.iloc[0]):
            roi_flag = True  # Start marking "ROI"
        elif 'Campaign (UK)' in str(row.iloc[0]) or 'Campaign (ROI)' in str(row.iloc[0]):
            roi_flag = False  # Stop marking "ROI"
    
        # Assign "ROI" or None based on the flag
        df.at[i, 'Market'] = 'IRE' if roi_flag else 'UK'
 
    # Create a new column to check if the row is a header
    df['Is_Header'] = df.iloc[:, 1].apply(lambda x: "CHANEL Budget (Last Update: v14)" if x == "CHANEL Budget (Last Update: v14)" else None)
    # Remove rows where Division = "Other"
    df = df[df['Division'] != 'Other']
    # Remove remaining header rows
    df = df[df['Is_Header'].isna()]
    # Remove Is_Header
    df = df.drop(columns=['Is_Header', 'Division'])
    df.reset_index(drop=True, inplace=True)
 
    # Rename campaign column
    df.rename(columns={df.columns[0]: 'Campaign'}, inplace=True)
    df_csv = df.to_csv(header=None, index=False, encoding="utf-8")
    blob_client_output = blob_service_client.get_blob_client(OUTPUT_CONTAINER, "budgettracker.csv")
    blob_client_output.upload_blob(df_csv, overwrite=True)
 
def main(myblob: func.InputStream):
    cleaned_blob_name = blob_name.replace(f"{INPUT_CONTAINER}/", "")
    blob_client = blob_service_client.get_blob_client(INPUT_CONTAINER, cleaned_blob_name)
    downloaded_blob = blob_client.download_blob().readall()
    
    if "Billed" in myblob.name:
        process_billed(myblob.name, blob_service_client)
    elif "Tracker" in myblob.name:
        process_budget_tracker(myblob.name, blob_service_client)