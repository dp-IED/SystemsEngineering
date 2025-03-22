import os
import logging
import azure.functions as func
from azure.storage.blob import BlobClient
from azure.kusto.data import KustoConnectionStringBuilder
from azure.kusto.ingest import QueuedIngestClient, IngestionProperties
from azure.kusto.ingest.ingestion_properties import DataFormat
from azure.kusto.ingest import BlobDescriptor
from azure.identity import DefaultAzureCredential
from azure.kusto.data import KustoConnectionStringBuilder
from azure.kusto.ingest import QueuedIngestClient
from azure.identity import DefaultAzureCredential
from azure.kusto.ingest import ReportLevel, ReportMethod
import io
import pandas as pd
import tempfile
from excel_generator import generate_excel_report
from azure.storage.blob import BlobServiceClient



app = func.FunctionApp()

@app.function_name(name="BlobIngestTrigger")
@app.blob_trigger(arg_name="myblob", path="csv-conversion/{name}", connection="AzureWebJobsStorage")
def blob_ingest_function(myblob: func.InputStream):
    try:
        logging.info(f"New CSV detected: {myblob.name}")
        
        file_name = os.path.basename(myblob.name)
        table_name = file_name.replace(".csv", "").replace(" ", "_")

        sas_token = "sp=r&st=2025-03-22T15:53:10Z&se=2025-05-31T22:53:10Z&spr=https&sv=2024-11-04&sr=c&sig=lwtYU4JPNsCYUoDYSZieePh1RP9pJROoASrWPDc%2BbLM%3D"
        blob_url_with_sas = f"https://systemsteam17storage.blob.core.windows.net/csv-conversion/{file_name}?{sas_token}"

        blob_client = BlobClient.from_blob_url(blob_url_with_sas)
        data = blob_client.download_blob().readall()
        blob_size = len(data)
        
        df = pd.read_csv(io.BytesIO(data))


        cluster_uri = os.environ["ADX_CLUSTER_URI"]
        database = os.environ["ADX_DATABASE"]

        credential = DefaultAzureCredential()
        token = credential.get_token("https://kusto.kusto.windows.net/.default").token
        kcsb = KustoConnectionStringBuilder.with_aad_application_token_authentication(cluster_uri, token)
        ingest_client = QueuedIngestClient(kcsb)

        descriptor = BlobDescriptor(blob_url_with_sas, blob_size)

        ingestion_props = IngestionProperties(
            database=database,
            table=table_name,
            data_format=DataFormat.CSV,
            report_level=ReportLevel.FailuresOnly,
            report_method=ReportMethod.Queue,
            additional_properties={"createTable": True},
            flush_immediately=True
        )

        ingest_client.ingest_from_blob(descriptor, ingestion_properties=ingestion_props)
        logging.info(f"Ingestion for table {table_name} started.")
        
        # Generate Excel report locally
        temp_dir = tempfile.gettempdir()
        excel_path = os.path.join(temp_dir, "FormattedAnnualBudget.xlsx")
        generate_excel_report(excel_path)

        # Upload to 'summary' container
        blob_service_client = BlobServiceClient.from_connection_string(os.environ["AzureWebJobsStorage"])
        summary_container = blob_service_client.get_container_client("summary")

        with open(excel_path, "rb") as excel_file:
            summary_container.upload_blob(
                name="FormattedAnnualBudget.xlsx", 
                data=excel_file, 
                overwrite=True
            )

        logging.info(f"Excel summary uploaded to 'summary/{table_name}_summary.xlsx'")

    except Exception as e:
        logging.error(f"ERROR during ingestion: {e}", exc_info=True)
