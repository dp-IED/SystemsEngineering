"use server";
import { BlobServiceClient } from "@azure/storage-blob";

export async function fetchSummarySpreadsheet(): Promise<
  Buffer | undefined
> {
  const AZURE_STORAGE_CONNECTION_STRING =
    process.env.NEXT_PUBLIC_AZURE_STORAGE_CONNECTION_STRING || "";
  if (!AZURE_STORAGE_CONNECTION_STRING) {
    throw new Error("Azure Storage connection string is missing");
  }

  const blobServiceClient = BlobServiceClient.fromConnectionString(
    AZURE_STORAGE_CONNECTION_STRING,
  );
  const containerClient = blobServiceClient.getContainerClient("summary");

  const blobName = `FormattedAnnualBudget.xlsx`;
  try {
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Check if the blob exists
    const exists = await blockBlobClient.exists();
    if (!exists) {
      // Gracefully return undefined if the file isn't found
      return undefined;
    }

    // Download the blob
    const downloadBlockBlobResponse = await blockBlobClient.download();
    if (downloadBlockBlobResponse.readableStreamBody) {
      const downloaded = await streamToBuffer(
        downloadBlockBlobResponse.readableStreamBody,
      );
      return downloaded;
    }

    // Helper function to convert stream to buffer
    async function streamToBuffer(
      readableStream: NodeJS.ReadableStream,
    ): Promise<Buffer> {
      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        readableStream.on("data", (data) => {
          chunks.push(data instanceof Buffer ? data : Buffer.from(data));
        });
        readableStream.on("end", () => {
          resolve(Buffer.concat(chunks));
        });
        readableStream.on("error", reject);
      });
    }
  } catch (e) {
    // Log the error and rethrow it
    console.error("Error fetching spreadsheet:", e);
    throw e as Error;
  }
}
