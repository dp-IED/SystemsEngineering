import pandas as pd
import io
from azure.storage.blob import BlobServiceClient

# Azure Blob Storage details
CONNECTION_STRING = "DefaultEndpointsProtocol=https;AccountName=systemsteam17storage;AccountKey=Wr7IgB+c6ghclYn9rcwRgNpYv16cVKe/0hUWtS1GD/wCcosZcVfFQ0UshCwir6QAykXqfFkcpBVN+AStgDyYYQ==;EndpointSuffix=core.windows.net"
CONTAINER_NAME = "subcontractor-documents"
INPUT_FILE = "Annual Budget Sheet.xlsx"  # Change to your Excel file
OUTPUT_FILE = "annual_budget_sheet.csv"
OUTPUT_CONTAINER_NAME = "csv-conversion"

# Initialize Blob Service Client
blob_service_client = BlobServiceClient.from_connection_string(CONNECTION_STRING)
blob_client = blob_service_client.get_blob_client(container=CONTAINER_NAME, blob=INPUT_FILE)
downloaded_blob = blob_client.download_blob().readall()

# Read the Excel file
df = pd.read_excel(io.BytesIO(downloaded_blob), header=None)
pd.set_option('display.max_columns', None)  # None means unlimited

print(df)



# Now df has clear, repeated headers for each column
# Example of saving and uploading the cleaned data
"""
clean_csv = df.to_csv(header=None, index=False)
blob_client_output = blob_service_client.get_blob_client(container="csv-conversion", blob="clean_annual_budget_sheet.csv")
blob_client_output.upload_blob(clean_csv, overwrite=True)

print("Cleaned Excel data converted to CSV and uploaded successfully!")
print(df)
"""
