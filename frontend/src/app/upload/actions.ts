"use server";

import { BlobServiceClient } from "@azure/storage-blob";

export async function uploadFile(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) {
    return { error: "No file selected" };
  }

  const AZURE_STORAGE_CONNECTION_STRING =
    process.env.NEXT_PUBLIC_AZURE_STORAGE_CONNECTION_STRING || "";
  if (!AZURE_STORAGE_CONNECTION_STRING) {
    return { error: "Azure Storage connection string is missing" };
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    AZURE_STORAGE_CONNECTION_STRING,
  );
  const containerClient = blobServiceClient.getContainerClient(
    "subcontractor-documents",
  );

  const blobName = file.name;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.upload(buffer, buffer.length);

  return { success: true, url: blockBlobClient.url };
}
