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

# Now df has clear, repeated headers for each column
# Example of saving and uploading the cleaned data
clean_csv = df.to_csv(index=False)
blob_client_output = blob_service_client.get_blob_client(container="csv-conversion", blob="clean_annual_budget_sheet.csv")
blob_client_output.upload_blob(clean_csv, overwrite=True)

print("Cleaned Excel data converted to CSV and uploaded successfully!")
print(df)