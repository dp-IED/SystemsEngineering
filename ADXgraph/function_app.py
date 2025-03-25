from decimal import Decimal
import json
import azure.functions as func
from azure.identity import DefaultAzureCredential
from azure.kusto.data import KustoClient, KustoConnectionStringBuilder
from azure.kusto.data.helpers import dataframe_from_result_table

import logging

from utils import get_kusto_kcsb

app = func.FunctionApp(http_auth_level=func.AuthLevel.ADMIN)

@app.route(route="adxGraph")
def adxGraph(req: func.HttpRequest) -> func.HttpResponse:
    logging.info("Python HTTP trigger function processed a request.")
    
    # Cluster and database configuration
    CLUSTER = "https://chanelmediacluster.uksouth.kusto.windows.net"
    DATABASE = "financial-database-1"
    
    # Authentication
    credential = DefaultAzureCredential()
    token = credential.get_token("https://kusto.kusto.windows.net/.default").token
    KCSB = KustoConnectionStringBuilder.with_aad_application_token_authentication(CLUSTER, token)
    KCSB_INGEST = get_kusto_kcsb(CLUSTER.replace("https://", "https://ingest-"))

    # Create Kusto Client
    client = KustoClient(KCSB)
    
    # Get graph type from query parameters
    graph_type = req.params.get("type")
    if not graph_type:
        return func.HttpResponse(
            "Please provide a graph type in the query string (e.g., ?type=bar_chart).",
            status_code=400
        )
    
    # Define queries based on graph_type
    queries = {
        "bar_chart": """
            summary
            | summarize TotalPlannedSpend = sum(PlannedSpend), TotalActualSpend = sum(Total_Invoice_Val) by Market
            | order by Market asc
        """,
        "line_chart": """
            summary
            | summarize TotalSpend = sum(Total_Invoice_Val) by Month
            | order by Month asc
        """,
        "pie_chart_campaign": """
            summary
            | summarize TotalSpend = sum(Total_Invoice_Val) by Campaign
            | order by TotalSpend desc
        """,
        "pie_chart_market": """
            summary
            | summarize TotalSpend = sum(Total_Invoice_Val) by Market
            | order by TotalSpend desc
        """,
        "pie_chart_division": """
            summary
            | summarize TotalSpend = sum(Total_Invoice_Val) by Division
            | order by TotalSpend desc
        """,
        "pie_chart_channel": """
            summary
            | summarize TotalSpend = sum(Total_Invoice_Val) by Channel
            | order by TotalSpend desc
        """,
        "pie_chart_monthly": """
            summary
            | summarize TotalSpend = sum(Total_Invoice_Val) by Month
            | order by TotalSpend desc
        """
    }
    
    # Get the query for the specified graph_type
    query = queries.get(graph_type)
    
    if not query:
        return func.HttpResponse(
            f"Invalid graph type '{graph_type}'. Valid types are: {', '.join(queries.keys())}.",
            status_code=400
        )
    
    try:
        # Execute the query
        logging.info("Executing query with parameters: DATABASE=%s, QUERY=%s", DATABASE, query.strip())
        # Execute the query
        response = client.execute(DATABASE, query.strip())

        # Convert the primary result table to a Pandas DataFrame
        df = dataframe_from_result_table(response.primary_results[0])

        # Convert the DataFrame to JSON
        json_result = df.to_json(orient="records")  # Convert to JSON array of records

        # Log the processed payload
        logging.info("Processed Query Result: %s", json_result)

        # Return the response
        return func.HttpResponse(
            body=json_result,  # JSON string
            status_code=200,
            mimetype="application/json"
        )
    except Exception as e:
        logging.error("Error executing query: %s", str(e))
        return func.HttpResponse(
            f"An error occurred while executing the query: {str(e)}",
            status_code=500
        )
