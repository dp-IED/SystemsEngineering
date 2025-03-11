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
    "https://systemsteam17storage.blob.core.windows.net/csv-conversion/budget_tracker.csv?sp=r&st=2025-03-11T10:00:23Z&se=2025-04-01T17:00:23Z&spr=https&sv=2022-11-02&sr=b&sig=tdbuRt9EShYu5gJTZEIchDmPfvEy0d%2FTU2Azy9Yra7s%3D": "budgettracker",
    "https://systemsteam17storage.blob.core.windows.net/csv-conversion/billed.csv?sp=r&st=2025-03-11T10:05:29Z&se=2025-04-01T17:05:29Z&spr=https&sv=2022-11-02&sr=b&sig=RI0Ff31rP9hlyPolkLAODLux5yr%2FoeqWBiLRlncTopQ%3D": "billed_report",
    "https://systemsteam17storage.blob.core.windows.net/csv-conversion/clean_annual_budget_sheet.csv?se=2025-03-07T00%3A00%3A00Z&sp=r&spr=https&sv=2022-11-02&sr=b&sig=84coq2UdSMhKaoIvUJyOKi3M07sW4ELAjNyS1sFKi%2Fs%3D": "annual_budget_sheet",
    "https://systemsteam17storage.blob.core.windows.net/csv-conversion/po_values.csv?se=2025-03-07T00%3A00%3A00Z&sp=r&spr=https&sv=2022-11-02&sr=b&sig=qkX5lzotCEBKWnacEbYcsagT4LeAtaktuBh7HiJfrlk%3D": "coupa_report",
}

# Ingest files into the respective tables

for file_url, table_name in files_to_ingest.items():
    # Wrap the URL inside a BlobDescriptor
    blob_descriptor = BlobDescriptor(file_url, size=0)
    
    ingestion_properties = IngestionProperties(
        database=DATABASE,
        table=table_name,
        data_format=DataFormat.CSV,
        flush_immediately=True
    )
    
    ingest_client.ingest_from_blob(blob_descriptor, ingestion_properties)
    print(f"File {file_url} ingested into {table_name}")
