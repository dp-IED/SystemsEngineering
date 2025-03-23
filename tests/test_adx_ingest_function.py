import unittest
from unittest.mock import patch, MagicMock, mock_open
from AdxIngestFunction.function_app import blob_ingest_function
import azure.functions as func
import io
import os

class TestBlobIngestFunction(unittest.TestCase):

    @patch.dict(os.environ, {
        'ADX_CLUSTER_URI': 'https://mock.kusto.windows.net',
        'ADX_DATABASE': 'mock_db',
        'AzureWebJobsStorage': 'UseDevelopmentStorage=true'
    })
    @patch("AdxIngestFunction.function_app.generate_excel_report")
    @patch("AdxIngestFunction.function_app.BlobServiceClient.from_connection_string")
    @patch("AdxIngestFunction.function_app.BlobClient.from_blob_url")
    @patch("AdxIngestFunction.function_app.QueuedIngestClient")  # ✅ PATCH THE CORRECT ONE!
    @patch("AdxIngestFunction.function_app.DefaultAzureCredential")
    def test_blob_function_runs_without_crashing(
        self,
        mock_default_cred,
        mock_ingest_client_class,
        mock_blob_client_from_url,
        mock_blob_service_client,
        mock_generate_excel_report,
    ):
        # Blob download mock
        mock_blob_client = MagicMock()
        mock_blob_client.download_blob.return_value.readall.return_value = b"col1,col2\n1,2\n3,4"
        mock_blob_client_from_url.return_value = mock_blob_client

        # ADX ingest client mock
        mock_ingest_instance = MagicMock()
        mock_ingest_client_class.return_value = mock_ingest_instance

        # Token
        mock_cred = MagicMock()
        mock_cred.get_token.return_value.token = "fake_token"
        mock_default_cred.return_value = mock_cred

        # Upload blob mock
        mock_container_client = MagicMock()
        mock_blob_service_instance = MagicMock()
        mock_blob_service_instance.get_container_client.return_value = mock_container_client
        mock_blob_service_client.return_value = mock_blob_service_instance

        # Dummy Excel generation
        def dummy_generate_excel_report(path):
            with open(path, "wb") as f:
                f.write(b"dummy excel")
        mock_generate_excel_report.side_effect = dummy_generate_excel_report

        # Simulate open
        with patch("builtins.open", mock_open(read_data=b"dummy excel")):
            # Simulate blob trigger
            myblob = MagicMock(spec=func.InputStream)
            myblob.name = "csv-conversion/test_blob.csv"

            # Call
            blob_ingest_function(myblob)

            # ✅ Assertions
            print("mock calls:", mock_ingest_instance.mock_calls)  # DEBUG LINE
            mock_ingest_instance.ingest_from_blob.assert_called_once()
            mock_container_client.upload_blob.assert_called_once()
    def test_blob_function_handles_exception(self):
        myblob = MagicMock(spec=func.InputStream)
        myblob.name = "csv-conversion/test_blob.csv"

        with patch("AdxIngestFunction.function_app.generate_excel_report", side_effect=Exception("Boom!")), \
            patch("azure.storage.blob.BlobClient.from_blob_url") as mock_blob_client, \
            patch("azure.kusto.ingest.QueuedIngestClient") as mock_ingest_client_class, \
            patch("azure.identity.DefaultAzureCredential") as mock_cred, \
            patch("AdxIngestFunction.function_app.logging") as mock_logging:

            # Setup mocks as before
            mock_blob_client.return_value.download_blob.return_value.readall.return_value = b"col1,col2\n1,2\n3,4"
            mock_ingest_client_class.return_value = MagicMock()
            mock_cred.return_value.get_token.return_value.token = "fake_token"

            # Run function (should trigger the exception)
            blob_ingest_function(myblob)

            # ✅ Assert error log was triggered
            mock_logging.error.assert_called()
            error_args = mock_logging.error.call_args[0][0]
            assert "ERROR during ingestion" in error_args


if __name__ == "__main__":
    unittest.main()
