
# Deployment and Security Guide

#### This guide will help you deploy the Next.js frontend and FastAPI backend as Docker containers on Azure. It includes instructions for creating the required Azure resources, setting environment variables, and securing the deployment.

## Prerequisites
Ensure you have:

Azure CLI installed on your local machine.
Docker installed and your Docker images for the frontend and backend ready.
Access to an Azure account with permissions to create resources.

### Step 1: Create a Resource Group

A Resource Group is a container for all the Azure resources you’ll create.

#### Open a terminal and log in to Azure:

```azurecli
az login
```

#### Create a Resource Group:
```azurecli
az group create --name MyResourceGroup --location uksouth
```

Replace MyResourceGroup with your desired name.
Replace uksouth with your preferred Azure region.

### Step 2: Create Azure Data Explorer (ADX)
Azure Data Explorer is used for querying and analyzing data.

#### Create an ADX Cluster:

```azurecli
az kusto cluster create --resource-group MyResourceGroup --name MyADXCluster --sku Dev(No SLA)_Standard_D11_v2 --capacity 1 --location uksouth
```

Replace MyADXCluster with your desired cluster name.
The Dev(No SLA)_Standard_D11_v2 SKU is the free Dev/Test tier.
Replace uksouth with your preferred Azure region.

#### Create an ADX Database:

```azurecli
az kusto database create --resource-group MyResourceGroup --cluster-name MyADXCluster --name MyADXDatabase --soft-delete-period P31D
```

Replace MyADXDatabase with your desired database name.
The --soft-delete-period P31D specifies a data retention period of 31 days, which is the maximum allowed for the free tier.

### Step 3: Create Azure Blob Storage

Azure Blob Storage is used for storing files (e.g., uploads). In this case, it will store the expense spreadsheets.

#### Create a Storage Account:

```azurecli
az storage account create --name MyStorageAccount --resource-group MyResourceGroup --location uksouth --sku Standard_LRS
```

Replace MyStorageAccount with your desired storage account name.
The Standard_LRS SKU is cost-effective and suitable for most use cases.

#### Create a Blob Container:

```azurecli
az storage container create --account-name MyStorageAccount --name expenses-container --public-access off
```

Replace expenses-container with your desired container name.
The --public-access off flag ensures that the container is private and requires authentication for access.
Step 4: Create an Azure Container Registry (ACR)
Azure Container Registry (ACR) is used to store your Docker images for the frontend and backend.

#### Create a Container Registry:

```azurecli
az acr create --resource-group MyResourceGroup --name MyContainerRegistry --sku Basic --location uksouth
```

Replace MyContainerRegistry with your desired registry name.
The Basic SKU is the most cost-effective option for ACR.

#### Log in to the Container Registry:

```azurecli
az acr login --name MyContainerRegistry
```

#### Tag your Docker images:

For the Next.js frontend:

```bash
docker tag nextjs-frontend MyContainerRegistry.azurecr.io/nextjs-frontend:v1
```

For the FastAPI backend:

```bash
docker tag fastapi-backend MyContainerRegistry.azurecr.io/fastapi-backend:v1
```

#### Push the images to the registry:

For the Next.js frontend:
```bash
docker push MyContainerRegistry.azurecr.io/nextjs-frontend:v1
```

For the FastAPI backend:

```bash
docker push MyContainerRegistry.azurecr.io/fastapi-backend:v1
```

### Step 5: Create an App Service Plan
An App Service Plan defines the compute resources for your applications. For this setup, we’ll use the free tier for App Service.

#### Create an App Service Plan:

```azurecli
az appservice plan create --name MyAppServicePlan --resource-group MyResourceGroup --sku F1 --is-linux --location uksouth
```

Replace MyAppServicePlan with your desired plan name.
The F1 SKU is the free tier for App Service, which is suitable for small-scale workloads.

### Step 6: Deploy the Containers
Deploy the Next.js Frontend
#### Create a Web App for the frontend:

```azurecli
az webapp create --resource-group MyResourceGroup --plan MyAppServicePlan --name MyNextJSApp --deployment-container-image-name MyContainerRegistry.azurecr.io/nextjs-frontend:v1
```
Replace MyNextJSApp with your desired app name.

#### Set environment variables for the frontend:

```azurecli
az webapp config appsettings set --resource-group MyResourceGroup --name MyNextJSApp --settings API_URL=https://MyPythonBackend.azurewebsites.net
```

Replace https://MyPythonBackend.azurewebsites.net with the URL of your backend.
Enable HTTPS for the frontend:

```azurecli
az webapp update --resource-group MyResourceGroup --name MyNextJSApp --https-only true
```

#### Create a Web App for the backend:

```azurecli
az webapp create --resource-group MyResourceGroup --plan MyAppServicePlan --name MyPythonBackend --deployment-container-image-name MyContainerRegistry.azurecr.io/fastapi-backend:v1
```

Replace MyPythonBackend with your desired app name.
#### Set environment variables for the backend:

```azurecli
az webapp config appsettings set --resource-group MyResourceGroup --name MyPythonBackend --settings \
STORAGE_ACCOUNT_URL=https://MyStorageAccount.blob.core.windows.net \
ADX_CLUSTER_URL=https://MyADXCluster.kusto.windows.net \
ADX_DATABASE=MyADXDatabase
```

Replace https://MyStorageAccount.blob.core.windows.net with the URL of your Blob Storage account.
Replace https://MyADXCluster.kusto.windows.net with the URL of your ADX cluster.
Replace MyADXDatabase with the name of your ADX database.

#### Enable HTTPS for the backend:
```azurecli
az webapp update --resource-group MyResourceGroup --name MyPythonBackend --https-only true
```

### Step 7: Secure the Deployment
Use Managed Identity for Secure Access
To securely access Azure Blob Storage and Azure Data Explorer without hardcoding credentials, enable Managed Identity for the backend.

#### Assign a Managed Identity to the backend:

```azurecli
az webapp identity assign --resource-group MyResourceGroup --name MyPythonBackend
```

#### Grant the backend access to Blob Storage:

```azurecli
az role assignment create --assignee <ManagedIdentityPrincipalId> --role "Storage Blob Data Contributor" --scope /subscriptions/<SubscriptionId>/resourceGroups/MyResourceGroup/providers/Microsoft.Storage/storageAccounts/MyStorageAccount
```

Replace ManagedIdentityPrincipalId with the principal ID of the backend's managed identity (you can retrieve this using az webapp identity show).
Replace SubscriptionId with your Azure subscription ID.

#### Grant the backend access to ADX:
```azurecli
az kusto cluster-principal-assignment create --cluster-name MyADXCluster --principal-id <ManagedIdentityPrincipalId> --principal-type App --role Admin --tenant-id <TenantId> --resource-group MyResourceGroup
```

Replace TenantId with your Azure tenant ID.

### Step 8: Test the Deployment

Access the Next.js frontend at: https://MyNextJSApp.azurewebsites.net
Access the FastAPI backend at: https://MyPythonBackend.azurewebsites.net

#### Verify that:
- The frontend can communicate with the backend.
- The backend can interact with Azure Blob Storage and Azure Data Explorer.

### Step 9: Update Environment Variables (Optional)
If you need to update the environment variables later, you can use the Azure CLI:

```azurecli
az webapp config appsettings set --resource-group MyResourceGroup --name MyPythonBackend --settings \
STORAGE_ACCOUNT_URL=https://NewStorageAccount.blob.core.windows.net \
ADX_CLUSTER_URL=https://NewADXCluster.kusto.windows.net \
ADX_DATABASE=NewADXDatabase
```
