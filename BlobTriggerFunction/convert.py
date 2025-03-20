import os
import pandas as pd
import io
import logging
from azure.storage.blob import BlobServiceClient
import azure.functions as func

# Azure Blob Storage details
CONNECTION_STRING = "DefaultEndpointsProtocol=https;AccountName=systemsteam17storage;AccountKey=Wr7IgB+c6ghclYn9rcwRgNpYv16cVKe/0hUWtS1GD/wCcosZcVfFQ0UshCwir6QAykXqfFkcpBVN+AStgDyYYQ==;EndpointSuffix=core.windows.net"
INPUT_CONTAINER = "subcontractor-documents"
OUTPUT_CONTAINER = "csv-conversion"

def process_unbilled(blob_name, blob_service_client):
    """Process the 'Chanel UK Billed.xlsx' file and save a cleaned CSV."""
    blob_client = blob_service_client.get_blob_client(container=INPUT_CONTAINER, blob=blob_name.replace(f"{INPUT_CONTAINER}/", ""))

    downloaded_blob = blob_client.download_blob().readall()
    
    df = pd.read_excel(io.BytesIO(downloaded_blob), sheet_name="F_B")
    df.to_csv("chanel_uk_billed.csv", index=False)

    output_blob_client = blob_service_client.get_blob_client(OUTPUT_CONTAINER, "chanel_uk_billed.csv")
    output_blob_client.upload_blob(df.to_csv(index=False), overwrite=True)
    logging.info("Chanel UK Billed file processed.")

def process_annual_budget_sheet(blob_name, blob_service_client):
    """Process the 'Annual Budget Sheet.xlsx' file."""
    blob_client = blob_service_client.get_blob_client(container=INPUT_CONTAINER, blob=blob_name.replace(f"{INPUT_CONTAINER}/", ""))

    downloaded_blob = blob_client.download_blob().readall()

    df = pd.read_excel(io.BytesIO(downloaded_blob))
    df.to_csv("annual_budget.csv", index=False)

    blob_client_output = blob_service_client.get_blob_client(OUTPUT_CONTAINER, "annual_budget.csv")
    blob_client_output.upload_blob(df.to_csv(index=False), overwrite=True)

def process_budget_tracker(blob_name, blob_service_client):
    """Process the 'Budget Tracker.xlsx' file."""
    blob_client = blob_service_client.get_blob_client(container=INPUT_CONTAINER, blob=blob_name.replace(f"{INPUT_CONTAINER}/", ""))

    downloaded_blob = blob_client.download_blob().readall()

    df = pd.read_excel(io.BytesIO(downloaded_blob))
    df.to_csv("budget_tracker.csv", index=False)

    blob_client_output = blob_service_client.get_blob_client(OUTPUT_CONTAINER, "budget_tracker.csv")
    blob_client_output.upload_blob(df.to_csv(index=False), overwrite=True)

def process_coupa_report(blob_name, blob_service_client):
    """Process the 'PO values COUPA report.xlsx' file."""
    blob_client = blob_service_client.get_blob_client(container=INPUT_CONTAINER, blob=blob_name.replace(f"{INPUT_CONTAINER}/", ""))

    downloaded_blob = blob_client.download_blob().readall()

    df = pd.read_excel(io.BytesIO(downloaded_blob))
    df.to_csv("po_values_coupa_report.csv", index=False)

    blob_client_output = blob_service_client.get_blob_client(OUTPUT_CONTAINER, "po_values_coupa_report.csv")
    blob_client_output.upload_blob(df.to_csv(index=False), overwrite=True)

# Azure Function Trigger
def main(myblob: func.InputStream):
    """Triggered when a new file is uploaded."""
    blob_client = blob_service_client.get_blob_client(container=INPUT_CONTAINER, blob=blob_name.replace(f"{INPUT_CONTAINER}/", ""))


    # Match correct filenames
    if "Chanel UK Billed.xlsx" in myblob.name:
        process_unbilled(myblob.name, blob_service_client)
    elif "Annual Budget Sheet.xlsx" in myblob.name:
        process_annual_budget_sheet(myblob.name, blob_service_client)
    elif "Budget Tracker.xlsx" in myblob.name:
        process_budget_tracker(myblob.name, blob_service_client)
    elif "PO values COUPA report.xlsx" in myblob.name:
        process_coupa_report(myblob.name, blob_service_client)
