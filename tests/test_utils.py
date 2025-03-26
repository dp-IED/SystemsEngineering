import unittest
from unittest.mock import patch, MagicMock
from AdxIngestFunction.utils import get_kusto_kcsb
from azure.kusto.data import KustoConnectionStringBuilder

class TestUtils(unittest.TestCase):
    @patch('AdxIngestFunction.utils.DefaultAzureCredential')
    def test_get_kusto_kcsb(self, mock_default_credential):
        # Setup
        mock_credential_instance = MagicMock()
        mock_default_credential.return_value = mock_credential_instance
        expected_token = "fake_token"
        mock_credential_instance.get_token.return_value = MagicMock(token=expected_token)

        cluster_uri = "https://example-kusto-service"

        # Execute
        kcsb = get_kusto_kcsb(cluster_uri)

        # Verify
        mock_default_credential.assert_called_once()
        mock_credential_instance.get_token.assert_called_once_with("https://kusto.kusto.windows.net/.default")
        self.assertIsInstance(kcsb, KustoConnectionStringBuilder)

if __name__ == '__main__':
    unittest.main()
