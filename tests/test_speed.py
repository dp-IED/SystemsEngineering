import pytest
import io
import pandas as pd
import sys
import os
from unittest.mock import Mock, patch
# Add the root directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from azure.storage.blob import BlobServiceClient, BlobClient
import azure.functions as func
from azure.identity import DefaultAzureCredential
from azure.kusto.data import KustoConnectionStringBuilder, DataFormat
from azure.kusto.ingest import QueuedIngestClient, BlobDescriptor, IngestionProperties, ReportLevel, ReportMethod
from pytest_benchmark.fixture import BenchmarkFixture
import logging
import tempfile
from BlobTriggerFunction.convert import process_billed, process_budget_tracker
from AdxIngestFunction.function_app import blob_ingest_function
from AdxIngestFunction.excel_generator import generate_excel_report
import time

# Mock function to simulate the blob ingest function
@pytest.fixture
def mock_blob_service_client():
    mock_client = Mock(spec=BlobServiceClient)
    mock_blob_client = Mock(spec=BlobClient)
    mock_client.get_blob_client.return_value = mock_blob_client
    return mock_client

@pytest.fixture
def blob_trigger_input_stream():
    """Mock InputStream for blob trigger."""
    mock_stream = Mock()
    mock_stream.name = "example.csv"
    mock_stream.readall.return_value = b"Campaign (UK),CHANEL Budget\nNo. 5,100000\nCoco Melle,50000"
    return mock_stream

# Function to create a sample Excel blob based on type (billed or budget tracker)
def create_sample_excel_blob(file_type="billed"):
    """Generates a mock Excel file for testing, depending on file_type."""
    
    excel_data = io.BytesIO()
    
    if file_type == "billed":
        # Billed file data
        sample_data = {
            "F_B": pd.DataFrame({"Col1": [None, "A", "B"], "Col2": [None, "X", "Y"]}),
            "WFJ": pd.DataFrame({"Col1": [None, "C", "D"], "Col2": [None, "Z", "W"]}),
            "FASHION": pd.DataFrame({"Col1": [None, "E", "F"], "Col2": [None, "M", "N"]}),
            "PAID SEARCH": pd.DataFrame({"Col1": [None, "G", "H"], "Col2": [None, "P", "Q"]}),
        }
        with pd.ExcelWriter(excel_data, engine="xlsxwriter") as writer:
            for sheet_name, df in sample_data.items():
                df.to_excel(writer, sheet_name=sheet_name, index=False)
    
    elif file_type == "budget_tracker":
        # Budget Tracker data
        df = pd.DataFrame({
            "Campaign (UK)": ["No. 5", "Coco Melle", "Skincare", "Campaign (UK)", "Travel Retail", "PPC", "Eyewear", "Campaign (ROI)", "Fashion", "Campaign (UK)", "Fine Jewellery"],
            "CHANEL Budget": ["100000", "50000", "320000", "1250000", "1350000", "25000", "2350", "3000", "25000", "5000", "12000"]
        })
        with pd.ExcelWriter(excel_data, engine="openpyxl") as writer:
            df.to_excel(writer, sheet_name="Budget tracker 16.12.24", index=False)
    
    excel_data.seek(0)
    return excel_data.getvalue()

@pytest.fixture
def billed_excel_blob():
    """Fixture for billed file type"""
    return create_sample_excel_blob(file_type="billed")

@pytest.fixture
def budget_tracker_excel_blob():
    """Fixture for budget tracker file type"""
    return create_sample_excel_blob(file_type="budget_tracker")

# Benchmarking process_billed performance
@patch("BlobTriggerFunction.convert.BlobServiceClient")
def test_process_billed_performance(mock_blob_service_client, billed_excel_blob, benchmark: BenchmarkFixture):
    # Mock blob client
    mock_blob_client = Mock()
    mock_blob_service_client.get_blob_client.return_value = mock_blob_client

    # Mock the blob download response for billed data
    mock_blob_client.download_blob().readall.return_value = billed_excel_blob

    # Benchmark the process_billed function
    benchmark(lambda: process_billed("Billed.xlsx", mock_blob_service_client))
    
# Benchmarking process_budget_tracker performance
@patch("BlobTriggerFunction.convert.BlobServiceClient")
def test_process_budget_tracker_performance(mock_blob_service_client, budget_tracker_excel_blob, benchmark: BenchmarkFixture):
    # Mock blob client
    mock_blob_client = Mock()
    mock_blob_service_client.get_blob_client.return_value = mock_blob_client

    # Mock the blob download response for budget tracker data
    mock_blob_client.download_blob().readall.return_value = budget_tracker_excel_blob

    # Benchmark the process_budget_tracker function
    benchmark(lambda: process_budget_tracker("Budget.xlsx", mock_blob_service_client))

# Benchmarking function_app performance
@patch("AdxIngestFunction.function_app.BlobServiceClient")
@patch("AdxIngestFunction.function_app.BlobClient")
@patch("AdxIngestFunction.function_app.DefaultAzureCredential")
@patch("AdxIngestFunction.function_app.QueuedIngestClient")
def test_blob_ingest_function_performance(
    mock_queued_ingest_client, 
    mock_default_azure_credential, 
    mock_blob_client, 
    mock_blob_service_client, 
    blob_trigger_input_stream, 
    benchmark: BenchmarkFixture
):
    # Mock BlobClient behavior
    mock_blob_client.download_blob().readall.return_value = blob_trigger_input_stream.readall()

    # Mock Azure services and environment variables
    mock_default_azure_credential.return_value.get_token.return_value.token = "mock_token"
    
    # Mock the ingestion client behavior
    mock_ingest_client = Mock()
    mock_queued_ingest_client.return_value = mock_ingest_client

    # Set environment variables for ADX connection string, database, and storage account
    os.environ["ADX_CLUSTER_URI"] = "https://mockcluster.kusto.windows.net"
    os.environ["ADX_DATABASE"] = "mock_database"
    os.environ["AzureWebJobsStorage"] = "mock_connection_string"

    # Benchmark the blob ingest function
    benchmark(lambda: blob_ingest_function(blob_trigger_input_stream))
