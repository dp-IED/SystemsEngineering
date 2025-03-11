from azure.kusto.data import KustoConnectionStringBuilder, KustoClient
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # ✅ Only allow frontend requests
    allow_credentials=True,
    allow_methods=["*"],  # ✅ Allow all HTTP methods
    allow_headers=["*"],  # ✅ Allow all headers
)

# ✅ Azure Data Explorer (ADX) Configuration
KUSTO_CLUSTER = "https://chanelmediacluster.uksouth.kusto.windows.net"
KUSTO_DATABASE = "financial-database-1"

# ✅ Function to Initialize Kusto Client
def get_kusto_client():
    """Initialize Azure Data Explorer (Kusto) client."""
    KCSB = KustoConnectionStringBuilder.with_aad_device_authentication(KUSTO_CLUSTER)
    return KustoClient(KCSB)

# ✅ Define Queries
QUERIES = {
    "planned_vs_actual_spend": """
        summary
        | summarize TotalPlannedSpend = sum(PlannedSpend), TotalActualSpend = sum(Total_Invoice_Val) by Month
        | order by Month asc
        | where Month != "Total"
    """,
    "overall_monthly_spend": """
        summary
        | summarize TotalSpend = sum(Total_Invoice_Val) by Month
        | order by Month asc
        | where Month != "Total"
    """,
    "campaign_breakdown": """
        summary
        | summarize TotalSpend = sum(Total_Invoice_Val) by Campaign
        | order by TotalSpend desc
    """,
    "market_breakdown": """
        summary
        | summarize TotalSpend = sum(Total_Invoice_Val) by Market
        | order by TotalSpend desc
    """,
    "division_breakdown": """
        summary
        | summarize TotalSpend = sum(Total_Invoice_Val) by Division
        | order by TotalSpend desc
    """,
    "channel_breakdown": """
        summary
        | summarize TotalSpend = sum(Total_Invoice_Val) by Channel
        | order by TotalSpend desc
        | where Channel != "Total"
    """,
    "monthly_breakdown": """
        summary
        | summarize TotalSpend = sum(Total_Invoice_Val) by Month
        | order by TotalSpend desc
        | where Month != "Total"
    """
}

# ✅ FIXED: Define `client` inside the function before using it
@app.get("/charts")
def get_charts():
    """Fetch data for all charts from Azure Data Explorer."""
    response_data = {}

    try:
        client = get_kusto_client()  # ✅ Now correctly defined inside the function
    except Exception as e:
        return {"error": f"Failed to initialize Kusto client: {str(e)}"}

    for chart_name, query in QUERIES.items():
        try:
            print(f"Running query for: {chart_name}")  # ✅ Debugging output
            response = client.execute(KUSTO_DATABASE, query)
            table = response.primary_results[0]  # ✅ Extract table

            print(f"Columns: {[col.column_name for col in table.columns]}")  # ✅ Debugging output
            print(f"Rows: {table.raw_rows[:5]}")  # ✅ Print first 5 rows

            rows = [dict(zip([col.column_name for col in table.columns], row)) for row in table.rows]
            response_data[chart_name] = rows
        except Exception as e:
            print(f"Error in {chart_name}: {str(e)}")  # ✅ Debugging output
            response_data[chart_name] = {"error": str(e)}

    return response_data


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8080)