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

def process_unbilled(blob_name, blob_service_client):
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
    unbilled = pd.concat(dfs, ignore_index=True)
    csv_data = unbilled.to_csv(header=None, index=False, encoding="utf-8")
    output_blob_client = blob_service_client.get_blob_client(OUTPUT_CONTAINER, "unbilled.csv")
    output_blob_client.upload_blob(csv_data, overwrite=True)
    logging.info("Unbilled file processed and uploaded successfully.")

def process_budget_tracker(blob_name, blob_service_client):
    cleaned_blob_name = blob_name.replace(f"{INPUT_CONTAINER}/", "")
    blob_client = blob_service_client.get_blob_client(INPUT_CONTAINER, cleaned_blob_name)
    downloaded_blob = blob_client.download_blob().readall()
    
    df = pd.read_excel(io.BytesIO(downloaded_blob), sheet_name="Budget tracker 16.12.24")
    df.dropna(how="all", inplace=True)
    df.dropna(how='all', axis=1, inplace=True)
    df.iloc[:, 0] = df.iloc[:, 0].astype(str)
    header_row_index = df[df.iloc[:, 0].str.contains("Campaign \(UK\)", na=False)].index[0]
    df = df.iloc[header_row_index:]
    df.reset_index(drop=True, inplace=True)
    df.columns = df.iloc[0]
    df = df.iloc[1:].reset_index(drop=True)
    df["Division"] = df["Campaign (UK)"].apply(assign_division)
    df['Category'] = None
    roi_flag = False
    for i, row in df.iterrows():
        if 'Campaign (ROI)' in str(row.iloc[0]):
            roi_flag = True
        elif 'Campaign (UK)' in str(row.iloc[0]):
            roi_flag = False
        df.at[i, 'Category'] = 'ROI' if roi_flag else None
    df['Is_Header'] = df.iloc[:, 1].apply(lambda x: "CHANEL Budget (Last Update: v14)" if x == "CHANEL Budget (Last Update: v14)" else None)
    df = df[df['Category'] != 'ROI']
    df = df[df['Division'] != 'Other']
    df = df[df['Is_Header'].isna()]
    df = df.drop(columns=['Category', 'Is_Header'])
    df = df.drop_duplicates().reset_index(drop=True)
    df_csv = df.to_csv(header=None, index=False, encoding="utf-8")
    blob_client_output = blob_service_client.get_blob_client(OUTPUT_CONTAINER, "budget_tracker.csv")
    blob_client_output.upload_blob(df_csv, overwrite=True)

def process_annual_budget_sheet(blob_name, blob_service_client):
    cleaned_blob_name = blob_name.replace(f"{INPUT_CONTAINER}/", "")
    blob_client = blob_service_client.get_blob_client(INPUT_CONTAINER, cleaned_blob_name)
    downloaded_blob = blob_client.download_blob().readall()
    
    df = pd.read_excel(io.BytesIO(downloaded_blob), header=None)
    header_rows = df.iloc[0:6]
    df = df.drop(index=range(0, 6))
    headers = ["ADVERTISING AND MEDIA EXPENDITURES"]
    current_prefix = "PREVIOUS YEARS"
    for i in range(1, header_rows.shape[1]):
        column_headers = header_rows.iloc[:, i].dropna().unique()
        header_label = ', '.join(map(str, column_headers))
        if header_label == "2024.0":
            header_label = "YTD % 2024"
        elif header_label == "2025 BUDGET       , 2025, Year, Budget":
            header_label = "Year 2025 Budget"
        elif header_label == "FORECAST, 2024 CURRENT FORECAST, 2024, Year, Q3F":
            header_label = "2024 CURRENT FORECAST, Q3F"
        elif header_label == "YTD VS PY, YTD 23, 2023, Nov YTD, Actual":
            header_label = "YTD 23, 2023, Nov YTD, Actual"
        if any(prefix in header_label for prefix in ["PERIOD", "FORECAST", "YTD VS PY"]):
            current_prefix = header_label.split(',')[0]
        headers.append(f"{current_prefix}, {header_label}" if 'PREVIOUS YEARS' not in header_label else header_label)
    df.columns = headers
    df = df.dropna(axis=1, how="all")
    clean_csv = df.to_csv(header=None, index=False, encoding="utf-8")
    blob_client_output = blob_service_client.get_blob_client(OUTPUT_CONTAINER, "annual_budget_sheet.csv")
    blob_client_output.upload_blob(clean_csv, overwrite=True)

def process_coupa_report(blob_name, blob_service_client):
    cleaned_blob_name = blob_name.replace(f"{INPUT_CONTAINER}/", "")
    blob_client = blob_service_client.get_blob_client(INPUT_CONTAINER, cleaned_blob_name)
    downloaded_blob = blob_client.download_blob().readall() 
    
    po_values = pd.read_excel(io.BytesIO(downloaded_blob))
    po_values_csv = po_values.to_csv(header=None, index=False, encoding="utf-8")
    blob_client_output = blob_service_client.get_blob_client(OUTPUT_CONTAINER, "po_values.csv")
    blob_client_output.upload_blob(po_values_csv, overwrite=True)

def main(myblob: func.InputStream):
    cleaned_blob_name = blob_name.replace(f"{INPUT_CONTAINER}/", "")
    blob_client = blob_service_client.get_blob_client(INPUT_CONTAINER, cleaned_blob_name)
    downloaded_blob = blob_client.download_blob().readall()
    
    if "Unbilled" in myblob.name:
        process_unbilled(myblob.name, blob_service_client)
    elif "Annual" in myblob.name and "Budget" in myblob.name:
        process_annual_budget_sheet(myblob.name, blob_service_client)
    elif "Tracker" in myblob.name:
        process_budget_tracker(myblob.name, blob_service_client)
    elif "COUPA" in myblob.name:
        process_coupa_report(myblob.name, blob_service_client)
