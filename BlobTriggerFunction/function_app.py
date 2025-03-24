import azure.functions as func
import logging
from convert import process_billed, process_budget_tracker
from azure.storage.blob import BlobServiceClient

# Azure Blob Storage connection
CONNECTION_STRING = "DefaultEndpointsProtocol=https;AccountName=systemsteam17storage;AccountKey=Wr7IgB+c6ghclYn9rcwRgNpYv16cVKe/0hUWtS1GD/wCcosZcVfFQ0UshCwir6QAykXqfFkcpBVN+AStgDyYYQ==;EndpointSuffix=core.windows.net"

app = func.FunctionApp()

@app.blob_trigger(arg_name="myblob", path="subcontractor-documents/{name}",
                  connection="AzureWebJobsStorage")
def BlobTriggerFunction(myblob: func.InputStream):
    """Triggered when a new file is uploaded to the 'subcontractor-documents' container."""
    logging.info(f"Processing file: {myblob.name}")

    blob_service_client = BlobServiceClient.from_connection_string(CONNECTION_STRING)

    # Call `convert.py` functions
    if "Chanel UK Billed.xlsx" in myblob.name:
        process_billed(myblob.name, blob_service_client)
    elif "Budget Tracker.xlsx" in myblob.name:
        process_budget_tracker(myblob.name, blob_service_client)
    