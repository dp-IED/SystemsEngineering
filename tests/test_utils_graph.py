import pytest
from unittest.mock import patch, Mock

# Assuming the function get_kusto_kcsb is in ADXgraph.utils and uses KustoConnectionStringBuilder
from ADXgraph.utils import get_kusto_kcsb

@pytest.fixture
def mock_credential():
    with patch('ADXgraph.utils.DefaultAzureCredential') as mock:
        mock_instance = mock.return_value
        mock_instance.get_token.return_value = Mock(token='mock_token')
        yield mock_instance

@pytest.fixture
def mock_kcsb():
    with patch('ADXgraph.utils.KustoConnectionStringBuilder') as mock:
        # Set up the class method to return a mock that can be checked
        class_mock = Mock()
        mock.with_aad_application_token_authentication = class_mock
        class_mock.return_value = 'ExpectedConnectionString'
        yield class_mock

def test_get_kusto_kcsb(mock_credential, mock_kcsb):
    cluster_uri = "https://example.kusto.windows.net"
    # Call the function
    connection_string = get_kusto_kcsb(cluster_uri)
    # Check if DefaultAzureCredential is instantiated correctly
    mock_credential.get_token.assert_called_once_with("https://kusto.kusto.windows.net/.default")
    # Check if with_aad_application_token_authentication is called correctly
    mock_kcsb.assert_called_once_with(cluster_uri, 'mock_token')
    # Check if the connection string is as expected
    assert connection_string == 'ExpectedConnectionString'
