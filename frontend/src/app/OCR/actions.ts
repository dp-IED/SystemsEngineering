"use server";

import DocumentIntelligence, {
  AnalyzeOperationOutput,
  getLongRunningPoller,
  isUnexpected,
} from "@azure-rest/ai-document-intelligence";

export async function extract_invoice_data(base64String: string) {
  const client = DocumentIntelligence(
    process.env.DOCUMENT_INTELLIGENCE_ENDPOINT || "",
    { key: process.env.DOCUMENT_INTELLIGENCE_API_KEY || "" }
  );

  // Convert Base64 to Binary Buffer
  const binaryData = Buffer.from(base64String, "base64");

  const initialResponse = await client
    .path("/documentModels/{modelId}:analyze", "prebuilt-invoice")
    .post({
      contentType: "application/octet-stream", // Correct content type
      body: binaryData, // Send binary instead of Base64
    });

  if (isUnexpected(initialResponse)) {
    throw new Error(`Azure OCR Error: ${JSON.stringify(initialResponse.body.error)}`);
  }

  const poller = getLongRunningPoller(client, initialResponse);
  const analyzeResult = (await poller.pollUntilDone()).body as AnalyzeOperationOutput;

  const documents = analyzeResult?.analyzeResult?.documents;
  return documents?.[0]?.fields || {};
}
