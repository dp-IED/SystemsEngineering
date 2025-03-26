# utils.py
from azure.identity import DefaultAzureCredential
from azure.kusto.data import KustoConnectionStringBuilder

def get_kusto_kcsb(cluster_uri: str):
    credential = DefaultAzureCredential()
    token = credential.get_token("https://kusto.kusto.windows.net/.default").token
    return KustoConnectionStringBuilder.with_aad_application_token_authentication(cluster_uri, token)
