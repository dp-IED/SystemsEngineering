import logging
import azure.functions as func
import json
import pandas as pd
from langchain_openai import AzureChatOpenAI
from langchain_experimental.agents.agent_toolkits import create_pandas_dataframe_agent
from langchain.agents.agent_types import AgentType
from azure.identity import DefaultAzureCredential, get_bearer_token_provider


app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

@app.route(route="AIQUERY")
def AIQUERY(req: func.HttpRequest) -> func.HttpResponse:
    logging.info("Python HTTP trigger function processed a request.")

    # Azure OpenAI setup
    endpoint = "https://systemsopenai.openai.azure.com/openai/deployments/gpt-4/chat/completions?api-version=2024-12-01-preview"
    model_name = "gpt-4"
    deployment = "gpt-4"
    api_version = "2024-12-01-preview"
    token_provider = get_bearer_token_provider(
    DefaultAzureCredential(), "https://cognitiveservices.azure.com/.default"
)

    llm = AzureChatOpenAI(
        api_version=api_version,
        azure_endpoint=endpoint,
        azure_ad_token_provider=token_provider,
    )

    # Load the dataframe from Azure Blob Storage
    API_URL = "https://systemsteam17storage.blob.core.windows.net/summary/FormattedAnnualBudget.xlsx?se=2025-04-10T23%3A59%3A59Z&sp=r&sv=2022-11-02&sr=b&sig=1DvdyO%2BRgtocwWEPBo1GmfRZG4CimWg8QYHXYIEQ6a0%3D"
    df = pd.read_excel(API_URL)

    # Create the agent
    agent = create_pandas_dataframe_agent(
        llm,
        df,
        verbose=True,
        agent_type=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
        allow_dangerous_code=True,
        return_intermediate_steps=True,
    )

    # Get the query from the request
    query = req.params.get("query")
    if not query:
        return func.HttpResponse(
            "Please pass a query in the request parameters.", status_code=400
        )

    try:
        # Execute the query
        result = agent.invoke(query)
        print(result)
        # Extract the final result (ensure it's JSON serializable)
        if isinstance(result, dict):
            # If the result is already a dictionary, return it directly
            response_data = {
                "output": result.get("output", None),
                "intermediate_steps": [
                    step[0].log
                    for step in result.get("intermediate_steps", [])
                ] if "intermediate_steps" in result else []
            }
        else:
            # Otherwise, convert the result to a string
            response_data = {"result": str(result)}
        
        print("Returning", response_data)
        # Return the response
        return func.HttpResponse(
            body=json.dumps(response_data),
            status_code=200,
            mimetype="application/json"
        )
    except Exception as e:
        logging.error(f"Error executing query: {e}")
        return func.HttpResponse(
            f"Error executing query: {str(e)}", status_code=500
        )
