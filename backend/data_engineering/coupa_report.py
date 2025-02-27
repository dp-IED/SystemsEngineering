import pandas as pd
import io
from azure.storage.blob import BlobServiceClient

# Azure Blob Storage details
CONNECTION_STRING = "DefaultEndpointsProtocol=https;AccountName=systemsteam17storage;AccountKey=SFr+0S1aVgKxqNpA0v6gnFdwV1zFZYOagMzRpvN0yH00otwtovRz0c7et9TdYE5BzHWKqPPWl59N+AStXSS9+g==;EndpointSuffix=core.windows.net"
CONTAINER_NAME = "subcontractor-documents"
INPUT_FILE = "PO values COUPA report.xlsx"
OUTPUT_FILE = "po_values.csv"
OUTPUT_CONTAINER_NAME = "csv-conversion"

# Connect to Blob Storage
blob_service_client = BlobServiceClient.from_connection_string(CONNECTION_STRING)
blob_client = blob_service_client.get_blob_client(CONTAINER_NAME, INPUT_FILE)

# Download file as a Bytes object
downloaded_blob = blob_client.download_blob().readall()

# Read Excel sheet into pandas
po_values = pd.read_excel(io.BytesIO(downloaded_blob))

# Convert DataFrame to CSV
po_values_csv = po_values.to_csv(index=False, encoding="utf-8")

# Upload CSV back to Blob Storage
blob_client_output = blob_service_client.get_blob_client(OUTPUT_CONTAINER_NAME, OUTPUT_FILE)
blob_client_output.upload_blob(po_values_csv, overwrite=True)

print("Excel file converted to CSV, cleaned and uploaded successfully!")