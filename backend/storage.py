from azure.storage.blob import BlobServiceClient, BlobClient, ContainerClient
import os

# Replace with your connection string
connection_string = "DefaultEndpointsProtocol=https;AccountName=group17;AccountKey=JUVSQp54KqgEeZrzPIVSMawp/B+p4pwKk5MVOWUXukyfYEJa1qdMGU3YSL+DMQOynuzP6ucoW2Cx+AStWov19A==;EndpointSuffix=core.windows.net"

# Replace with your container name
container_name = "finsync"

# Initialize Blob Service Client
blob_service_client = BlobServiceClient.from_connection_string(connection_string)

# Get the container client
container_client = blob_service_client.get_container_client(container_name)

# Upload file
def upload_file_to_blob(file_path):
    # Extract file name from file path
    file_name = os.path.basename(file_path)
    
    # Create a blob client using the file name as the blob name
    blob_client = container_client.get_blob_client(file_name)
    
    # Upload the file
    with open(file_path, "rb") as data:
        blob_client.upload_blob(data)
    
    print(f"{file_name} has been uploaded to {container_name} container.")

# Example usage
upload_file_to_blob(r"C:\Users\azire.AZIRET-LAPTOP\OneDrive - University College London\Year 2\Systems_engineering\2024 Budget Tracker 16.12.24 - ucl.xlsx")
