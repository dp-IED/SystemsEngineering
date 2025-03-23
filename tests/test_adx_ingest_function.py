import unittest
from unittest.mock import patch, MagicMock
from AdxIngestFunction.function_app import blob_ingest_function
import azure.functions as func
import io
import os

class TestBlobIngestFunction(unittest.TestCase):
    @patch('azure.identity.DefaultAzureCredential')
    @patch('azure.kusto.ingest.QueuedIngestClient')
    @patch('azure.storage.blob.BlobClient.from_blob_url')
    @patch('azure.storage.blob.BlobServiceClient')
    @patch('AdxIngestFunction.function_app.generate_excel_report')
    @patch.dict('os.environ', {
        'ADX_CLUSTER_URI': 'https://mock.kusto.windows.net',
        'ADX_DATABASE': 'mock_database',
        'AzureWebJobsStorage': 'UseDevelopmentStorage=true'
    })
    def test_upload_blob_called(
        self,
        mock_generate_excel_report,
        mock_blob_service_client,
        mock_blob_client_from_url,
        mock_ingest_client,
        mock_default_cred,
    ):
        # Arrange blob download
        mock_blob_client = MagicMock()
        mock_blob_client.download_blob.return_value.readall.return_value = b"col1,col2\n1,2\n3,4"
        mock_blob_client_from_url.return_value = mock_blob_client

        # Mock ADX client
        mock_ingest_instance = MagicMock()
        mock_ingest_client.return_value = mock_ingest_instance

        # Mock token
        mock_cred_instance = MagicMock()
        mock_default_cred.return_value = mock_cred_instance
        mock_cred_instance.get_token.return_value.token = "fake_token"

        # Mock upload_blob
        mock_container_client = MagicMock()
        mock_container_client.upload_blob = MagicMock()
        mock_blob_service_instance = MagicMock()
        mock_blob_service_instance.get_container_client.return_value = mock_container_client
        mock_blob_service_client.return_value = mock_blob_service_instance

        # Patch Excel generation to write dummy file
        def dummy_generate_excel_report(filepath):
            with open(filepath, "wb") as f:
                f.write(b"dummy excel")
        mock_generate_excel_report.side_effect = dummy_generate_excel_report

        # Simulate blob trigger input
        myblob = MagicMock(spec=func.InputStream)
        myblob.name = "test_blob.csv"

        # Act
        blob_ingest_function(myblob)

        # ✅ Assert upload_blob called
        mock_container_client.upload_blob.assert_called_once()
        kwargs = mock_container_client.upload_blob.call_args.kwargs
        assert kwargs["name"] == "FormattedAnnualBudget.xlsx"
        assert kwargs["overwrite"] is True

if __name__ == '__main__':
    unittest.main()
