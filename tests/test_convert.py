import pytest
import pandas as pd
import io
import azure.functions as func
from azure.storage.blob import BlobServiceClient
from unittest.mock import Mock, patch, MagicMock
from BlobTriggerFunction.convert import assign_division, process_billed, process_budget_tracker, main
 
@pytest.mark.parametrize("campaign, expected_division", [
    ("Travel Retail Europe", "Travel Retail"),
    ("Skincare Promotion", "F&B"),
    ("Fashion Week Event", "FSH&EW"),
    ("Fine Jewellery Showcase", "Watches & Fine Jewellery"),
    ("PPC Advertising", "PPC"),
    ("Unknown Campaign", "Other"),
    (None, "Other")
])
 
def test_assign_division(campaign, expected_division):
    assert assign_division(campaign) == expected_division
 
def create_mock_blob(data):
    """Creates a mock blob response."""
    return io.BytesIO(data)
 
@patch("BlobTriggerFunction.convert.BlobServiceClient")
def test_process_billed(mock_blob_service_client):
    # Mock blob client
    mock_blob_client = Mock()
    mock_blob_service_client.get_blob_client.return_value = mock_blob_client
 
    # Create a sample Excel file in-memory
    excel_data = io.BytesIO()
    sample_data = {
            "F_B": pd.DataFrame({"Col1": [None, "A", "B"], "Col2": [None, "X", "Y"]}),
            "WFJ": pd.DataFrame({"Col1": [None, "C", "D"], "Col2": [None, "Z", "W"]}),
            "FASHION": pd.DataFrame({"Col1": [None, "E", "F"], "Col2": [None, "M", "N"]}),
            "PAID SEARCH": pd.DataFrame({"Col1": [None, "G", "H"], "Col2": [None, "P", "Q"]}),
        }
    excel_data = io.BytesIO()
    with pd.ExcelWriter(excel_data, engine="xlsxwriter") as writer:
        for sheet_name, df in sample_data.items():
            df.to_excel(writer, sheet_name=sheet_name, index=False)
    excel_data.seek(0)
 
    # Mock the blob download response
    mock_blob_client.download_blob().readall.return_value = excel_data.getvalue()
 
    # Call function
    process_billed("Billed.xlsx", mock_blob_service_client)
 
    # Check that upload_blob was called
    mock_blob_service_client.get_blob_client.assert_called_with("csv-conversion", "billed_report.csv")
    mock_blob_client.upload_blob.assert_called_once()
 
@patch("BlobTriggerFunction.convert.BlobServiceClient")
def test_process_budget_tracker(mock_blob_service_client):
    # Mock blob client
    mock_blob_client = Mock()
    mock_blob_service_client.get_blob_client.return_value = mock_blob_client
 
    # Create a sample Excel file for budget tracker
    excel_data = io.BytesIO()
    with pd.ExcelWriter(excel_data, engine="openpyxl") as writer:
        df = pd.DataFrame({
            "Campaign (UK)": ["No. 5", "Coco Melle", "Skincare", "Campaign (UK)", "Travel Retail", "PPC", "Eyewear", "Campaign (ROI)", "Fashion", "Campaign (UK)", "Fine Jewellery"],
            "CHANEL Budget": ["100000", "50000", "320000", "1250000", "1350000", "25000", "2350", "3000", "25000", "5000", "12000"]
        })
        df.to_excel(writer, sheet_name="Budget tracker 16.12.24", index=False)
    excel_data.seek(0)
 
    # Mock the blob download response
    mock_blob_client.download_blob().readall.return_value = excel_data.getvalue()
 
    # Call function
    process_budget_tracker("Budget.xlsx", mock_blob_service_client)
 
    # Ensure the upload function was called
    mock_blob_service_client.get_blob_client.assert_called_with("csv-conversion", "budgettracker.csv")
    mock_blob_client.upload_blob.assert_called_once()
 