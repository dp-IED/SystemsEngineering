import pytest
import json
import azure.functions as func
from unittest.mock import Mock, patch, MagicMock
import sys, os

# Add the project root directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from ADXgraph.function_app import adxGraph

## Test for ADXgraph function
## Tests for each graph type to ensure the correct keys are returned in the JSON response
## Tests for invalid graph type and missing graph type


@pytest.mark.parametrize("graph_type, expected_keys", [
    ("bar_chart", {"Market", "TotalPlannedSpend", "TotalActualSpend"}),
    ("line_chart", {"Month", "TotalSpend"}),
    ("pie_chart_campaign", {"Campaign", "TotalSpend"}),
    ("pie_chart_market", {"Market", "TotalSpend"}),
    ("pie_chart_division", {"Division", "TotalSpend"}),
    ("pie_chart_channel", {"Channel", "TotalSpend"}),
    ("pie_chart_monthly", {"Month", "TotalSpend"}),
])
@patch("ADXgraph.function_app.KustoClient")
@patch("ADXgraph.function_app.DefaultAzureCredential")
@patch("ADXgraph.function_app.dataframe_from_result_table")
def test_adxGraph(mock_dataframe, mock_credential, mock_kusto_client, graph_type, expected_keys):
    # Mock Azure credential
    mock_credential.return_value.get_token.return_value.token = "mock_token"

    # Mock KustoClient
    mock_kusto_client_instance = MagicMock()
    mock_kusto_client.return_value = mock_kusto_client_instance

    # Mock the query result
    mock_result_table = MagicMock()
    mock_result_table.primary_results = [MagicMock()]
    mock_kusto_client_instance.execute.return_value = mock_result_table

    # Mock the DataFrame conversion to JSON
    mock_dataframe.return_value.to_json.return_value = json.dumps(
        [
            {key: "mock_value" for key in expected_keys},  # Mock response with expected keys
        ]
    )

    # Create a mock HTTP request
    req = func.HttpRequest(
        method="GET",
        url=f"http://localhost:7071/adxGraph?type={graph_type}",
        headers={},
        params={"type": graph_type},
        body=b"",
    )

    # Call the function
    response = adxGraph(req)

    # Assert the response status code
    assert response.status_code == 200

    # Parse the JSON response
    response_data = json.loads(response.get_body().decode())

    # Assert that the keys in the first record match the expected keys
    if response_data:  # Ensure the response is not empty
        actual_keys = set(response_data[0].keys())
        assert actual_keys == expected_keys, (
            f"Keys for graph_type '{graph_type}' do not match. "
            f"Expected: {expected_keys}, Got: {actual_keys}"
        )


@patch("ADXgraph.function_app.KustoClient")
@patch("ADXgraph.function_app.DefaultAzureCredential")
def test_invalid_graph_type(mock_credential, mock_kusto_client):
    # Mock Azure credential
    mock_credential.return_value.get_token.return_value.token = "mock_token"

    # Create a mock HTTP request with an invalid graph_type
    req = func.HttpRequest(
        method="GET",
        url="http://localhost:7071/adxGraph?type=invalid_type",
        headers={},
        params={"type": "invalid_type"},
        body=b"",
    )

    # Call the function
    response = adxGraph(req)

    # Assert the response status code
    assert response.status_code == 400

    # Assert the response body
    assert "Invalid graph type" in response.get_body().decode()


@patch("ADXgraph.function_app.KustoClient")
@patch("ADXgraph.function_app.DefaultAzureCredential")
def test_missing_graph_type(mock_credential, mock_kusto_client):
    # Mock Azure credential
    mock_credential.return_value.get_token.return_value.token = "mock_token"

    # Create a mock HTTP request without a graph_type
    req = func.HttpRequest(
        method="GET",
        url="http://localhost:7071/adxGraph",
        headers={},
        params={},
        body=b"",
    )

    # Call the function
    response = adxGraph(req)

    # Assert the response status code
    assert response.status_code == 400

    # Assert the response body
    assert "Please provide a graph type" in response.get_body().decode()
