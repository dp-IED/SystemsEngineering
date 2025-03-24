from tests.test_speed import billed_excel_blob, budget_tracker_excel_blob
import pytest
from memory_profiler import memory_usage
from unittest.mock import Mock, patch
from BlobTriggerFunction.convert import process_billed, process_budget_tracker

# Memory profiling wrapper function
def profile_memory(func, *args, **kwargs):
    mem_usage = memory_usage((func, args, kwargs), interval=0.1)
    return max(mem_usage)  # Get peak memory usage

@patch("BlobTriggerFunction.convert.BlobServiceClient")  # Mock BlobServiceClient
def test_memory_usage_process_billed(mock_blob_service_client, billed_excel_blob):
    """Test memory usage of process_billed"""
    
    # Mock blob client
    mock_blob_client = Mock()
    mock_blob_service_client.get_blob_client.return_value = mock_blob_client

    # Mock the blob download response for billed data
    mock_blob_client.download_blob().readall.return_value = billed_excel_blob

    # Profile the memory usage of process_billed
    peak_mem = profile_memory(process_billed, "Billed.xlsx", mock_blob_service_client)
    print(f"Peak Memory Usage for process_billed: {peak_mem:.2f} MB")

@patch("BlobTriggerFunction.convert.BlobServiceClient")  # Mock BlobServiceClient
def test_memory_usage_process_budget_tracker(mock_blob_service_client, budget_tracker_excel_blob):
    """Test memory usage of process_budget_tracker"""
    
    # Mock blob client
    mock_blob_client = Mock()
    mock_blob_service_client.get_blob_client.return_value = mock_blob_client

    # Mock the blob download response for budget tracker data
    mock_blob_client.download_blob().readall.return_value = budget_tracker_excel_blob

    # Profile the memory usage of process_budget_tracker
    peak_mem = profile_memory(process_budget_tracker, "Budget.xlsx", mock_blob_service_client)
    print(f"Peak Memory Usage for process_budget_tracker: {peak_mem:.2f} MB")
