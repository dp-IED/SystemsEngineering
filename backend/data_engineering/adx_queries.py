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
files_to_ingest = {
    "https://systemsteam17storage.blob.core.windows.net/csv-conversion/unbilled.csv": "unbilled",
    "https://systemsteam17storage.blob.core.windows.net/csv-conversion/budget_tracker_roi.csv": "roi",
    "https://systemsteam17storage.blob.core.windows.net/csv-conversion/budget_tracker.csv": "budget_tracker",
    "https://systemsteam17storage.blob.core.windows.net/csv-conversion/po_values.csv": "coupa_report"
    
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
