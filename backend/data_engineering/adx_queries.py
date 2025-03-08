from azure.kusto.data import KustoClient, KustoConnectionStringBuilder, DataFormat
from azure.kusto.ingest import QueuedIngestClient, IngestionProperties
from azure.kusto.ingest import BlobDescriptor

# Define ADX cluster and database details
ADX_CLUSTER = "https://chanelmediacluster.uksouth.kusto.windows.net"
DATABASE = "financial-database-1"

# Authenticate with ADX
kcsb = KustoConnectionStringBuilder.with_az_cli_authentication(ADX_CLUSTER)
ingest_client = QueuedIngestClient(kcsb)

# Define Blob Storage files and their respective tables
# Use SAS token for secure access
files_to_ingest = {
    "https://systemsteam17storage.blob.core.windows.net/csv-conversion/budget_tracker.csv?se=2025-03-07T00%3A00%3A00Z&sp=r&spr=https&sv=2022-11-02&sr=b&sig=YMcuzz2mrij47cWmwYB46DhJvV8IdpJ6CKu3nNbcRic%3D": "budget_tracker",
    "https://systemsteam17storage.blob.core.windows.net/csv-conversion/unbilled.csv?se=2025-03-07T00%3A00%3A00Z&sp=r&spr=https&sv=2022-11-02&sr=b&sig=uN775OuH%2Fbd9Tn093LB0IB6YXlG%2BQeZ6ftnf%2BVApWS8%3D": "unbilled_report",
    "https://systemsteam17storage.blob.core.windows.net/csv-conversion/clean_annual_budget_sheet.csv?se=2025-03-07T00%3A00%3A00Z&sp=r&spr=https&sv=2022-11-02&sr=b&sig=84coq2UdSMhKaoIvUJyOKi3M07sW4ELAjNyS1sFKi%2Fs%3D": "annual_budget_sheet",
    "https://systemsteam17storage.blob.core.windows.net/csv-conversion/po_values.csv?se=2025-03-07T00%3A00%3A00Z&sp=r&spr=https&sv=2022-11-02&sr=b&sig=qkX5lzotCEBKWnacEbYcsagT4LeAtaktuBh7HiJfrlk%3D": "coupa_report",
    "https://systemsteam17storage.blob.core.windows.net/csv-conversion/budget_tracker_roi.csv?se=2025-03-07T00%3A00%3A00Z&sp=r&spr=https&sv=2022-11-02&sr=b&sig=Yi6j2FBG4Tg%2FZeF4CVRKUncqMfWnfPuBvDaaRdRKmY8%3D": "roi"
}

# Ingest files into the respective tables

for file_url, table_name in files_to_ingest.items():
    # Wrap the URL inside a BlobDescriptor
    blob_descriptor = BlobDescriptor(file_url, size=0)
    
    ingestion_properties = IngestionProperties(
        database=DATABASE,
        table=table_name,
        data_format=DataFormat.CSV
    )
    
    ingest_client.ingest_from_blob(blob_descriptor, ingestion_properties)
    print(f"File {file_url} ingested into {table_name}")
