import pandas as pd
import io
from azure.storage.blob import BlobServiceClient

# Azure Blob Storage details
CONNECTION_STRING = "DefaultEndpointsProtocol=https;AccountName=systemsteam17storage;AccountKey=SFr+0S1aVgKxqNpA0v6gnFdwV1zFZYOagMzRpvN0yH00otwtovRz0c7et9TdYE5BzHWKqPPWl59N+AStXSS9+g==;EndpointSuffix=core.windows.net"
CONTAINER_NAME = "subcontractor-documents"
INPUT_FILE = "Chanel UK Unbilled.xlsx"  
OUTPUT_FILE = "unbilled.csv"
OUTPUT_CONTAINER_NAME = "csv-conversion"

# Connect to Blob Storage
blob_service_client = BlobServiceClient.from_connection_string(CONNECTION_STRING)
blob_client = blob_service_client.get_blob_client(CONTAINER_NAME, INPUT_FILE)

# Download file as a Bytes object
downloaded_blob = blob_client.download_blob().readall()

# Read Excel sheets into pandas
fb = pd.read_excel(io.BytesIO(downloaded_blob), sheet_name="F_B")
wfj = pd.read_excel(io.BytesIO(downloaded_blob), sheet_name="WFJ")
fashion = pd.read_excel(io.BytesIO(downloaded_blob), sheet_name="FASHION")
paid_search = pd.read_excel(io.BytesIO(downloaded_blob), sheet_name="PAID SEARCH")

# Add division column to each dataframe
fb['Division'] = "F&B"
wfj['Division'] = "W&FJ"
fashion['Division'] = "FSH&EW"
paid_search['Division'] = "Paid Search"

# Remove total rows
fb = fb.drop(fb.index[-1])
wfj = wfj.drop(wfj.index[-1])
fashion = fashion.drop(fashion.index[-1])
paid_search = paid_search.drop(paid_search.index[-1])

# Merge tables from each sheet into one dataframe
unbilled = pd.concat([fb, wfj, fashion, paid_search], ignore_index=True)

# Convert DataFrame to CSV
unbilled_csv = unbilled.to_csv(index=False, encoding="utf-8")

# Upload CSV back to Blob Storage
blob_client_output = blob_service_client.get_blob_client(OUTPUT_CONTAINER_NAME, OUTPUT_FILE)
blob_client_output.upload_blob(unbilled_csv, overwrite=True)

print("Excel file converted to CSV, cleaned and uploaded successfully!")