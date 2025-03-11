import pandas as pd
import io
from azure.storage.blob import BlobServiceClient

# Azure Blob Storage details
CONNECTION_STRING = "DefaultEndpointsProtocol=https;AccountName=systemsteam17storage;AccountKey=Wr7IgB+c6ghclYn9rcwRgNpYv16cVKe/0hUWtS1GD/wCcosZcVfFQ0UshCwir6QAykXqfFkcpBVN+AStgDyYYQ==;EndpointSuffix=core.windows.net"
CONTAINER_NAME = "subcontractor-documents"
INPUT_FILE = "Budget Tracker.xlsx"  
OUTPUT_FILE = "budget_tracker.csv"
OUTPUT_CONTAINER_NAME = "csv-conversion"
OUTPUT_CONTAINER_NAME_ROI = "csv-conversion"

# connect to Blob Storage
blob_service_client = BlobServiceClient.from_connection_string(CONNECTION_STRING)
blob_client = blob_service_client.get_blob_client(CONTAINER_NAME, INPUT_FILE)

# download file as a bytes object
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

# Apply division assignment
df["Division"] = df["Campaign (UK)"].apply(assign_division)

# Create a new column 'Category' and initialize with None
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

# Reset index
df.reset_index(drop=True, inplace=True)

# Rename campaign column
df.rename(columns={df.columns[0]: 'Campaign'}, inplace=True)

pd.set_option('display.max_columns', 30)

# Convert DataFrame to CSV
budget_csv = df.to_csv(header=None, index=False, encoding="utf-8")

# Upload CSV back to Blob Storage
blob_client_output = blob_service_client.get_blob_client(OUTPUT_CONTAINER_NAME, OUTPUT_FILE)
blob_client_output.upload_blob(budget_csv, overwrite=True)

print("Excel file converted to CSV, cleaned and uploaded successfully!")