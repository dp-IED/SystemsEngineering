import pandas as pd
import io
from azure.storage.blob import BlobServiceClient

# Azure Blob Storage details
CONNECTION_STRING = "DefaultEndpointsProtocol=https;AccountName=systemsteam17storage;AccountKey=Wr7IgB+c6ghclYn9rcwRgNpYv16cVKe/0hUWtS1GD/wCcosZcVfFQ0UshCwir6QAykXqfFkcpBVN+AStgDyYYQ==;EndpointSuffix=core.windows.net"
CONTAINER_NAME = "subcontractor-documents"
INPUT_FILE = "Budget Actuals & Forecast.xlsx"
OUTPUT_FILE = "budget_forecast.csv"
OUTPUT_CONTAINER_NAME = "csv-conversion"

# Initialize Blob Service Client
blob_service_client = BlobServiceClient.from_connection_string(CONNECTION_STRING)
blob_client = blob_service_client.get_blob_client(container=CONTAINER_NAME, blob=INPUT_FILE)
downloaded_blob = blob_client.download_blob().readall()

# Read the Excel file
df = pd.read_excel(io.BytesIO(downloaded_blob), sheet_name="JAN REVIEW ", header=None)
pd.set_option('display.max_rows', None)

# remove first 9 rows, last 10 rows, unnecessary columns
df = df.iloc[9:,:]
df.drop(df.tail(11).index, inplace = True)
columns_to_keep = [0,1,16]
df = df[columns_to_keep]

# remove non PHD related media channels, remove total rows
valid_channels = [
    "AC 5042 Social", "AC 5046 Search", "AC 5047 Digital Display", "AC 5044 VOD",
    "AC 5019 Press Space Magazines", "AC 5002 Cinema", "AC 5001 Tv",
    "AC 5015 Media Fees", "AC 5030 Outdoor space"
]
normalised_channels = [
    "Social", "Search", "Display", "VOD", "Print", "Cinema", "TV", "Retainer Fee", "OOH"
]

value_to_remove = "Fragrance & Beaute"

# Filter the DataFrame
df_filtered = df[df.iloc[:, 0].isin(valid_channels)]
df_filtered = df_filtered[df.iloc[:, 1] != value_to_remove]
df_filtered = df_filtered[~df.iloc[:, 1].str.contains("Total", na=False, case=False)]

# Mapping valid_channels to normalised_channels
mapping = dict(zip(valid_channels, normalised_channels))

# Replace values in the 'Channel' column
df_filtered[0] = df_filtered[0].replace(mapping)

# Reset index (optional)
df_filtered = df_filtered.reset_index(drop=True)
print(df_filtered)

"""
clean_csv = df.to_csv(header=None, index=False)
blob_client_output = blob_service_client.get_blob_client(OUTPUT_CONTAINER_NAME, OUTPUT_FILE)
blob_client_output.upload_blob(clean_csv, overwrite=True)

print("Cleaned Excel data converted to CSV and uploaded successfully!")
print(df_filtered)

"""