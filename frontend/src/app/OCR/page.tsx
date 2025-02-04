"use client";

import React, { useState } from "react";
import { extract_invoice_data } from "./actions";

const OCRPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<string>("");

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(",")[1]; // Extract pure Base64
        resolve(base64String);
      };
      reader.onerror = reject;
    });
  };

  // File Upload Component (receives setFile as a prop)
  const FileUpload = ({ setFile }: { setFile: (file: File) => void }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        setSelectedFile(selectedFile);
        setFile(selectedFile);
        console.log("File uploaded:", selectedFile.name);
      }
    };
  
    return (
      <div className="relative">
        <button className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded border">
          Choose PDF File
        </button>
        <input 
          type="file" 
          accept=".pdf" 
          onChange={handleFileChange}
          className="absolute inset-0 opacity-0 w-[120px] cursor-pointer"
        />
        <p className="text-gray-700 mt-2">
          {selectedFile ? `Selected File: ${selectedFile.name}` : ""}
        </p>
      </div>
    );
  };

  // Analyze File
  const analyzeFile = async () => {
    if (!file) {
      console.log("NO FILE SELECTED");
      return;
    }

    try {
      const base64String = await convertToBase64(file);
      const extractedData = await extract_invoice_data(base64String);
      const cleanedData = {
        customerName: extractedData?.CustomerName?.valueString || "N/A",
        customerAddress: extractedData?.CustomerAddress?.valueAddress || "N/A",
        invoiceId: extractedData?.InvoiceId?.valueString || "N/A",
        invoiceDate: extractedData?.InvoiceDate?.valueDate || "N/A",
        totalAmount: extractedData?.InvoiceTotal?.valueCurrency?.amount || "N/A",
        currency: extractedData?.InvoiceTotal?.valueCurrency?.currencyCode || "N/A",
        items: extractedData?.Items?.valueArray?.map((item: any) => ({
          description: item?.valueObject?.Description?.valueString || "N/A",
          unitPrice: item?.valueObject?.UnitPrice?.valueCurrency?.amount || "N/A",
          quantity: item?.valueObject?.Quantity?.valueNumber || "N/A",
          amount: item?.valueObject?.Amount?.valueCurrency?.amount || "N/A",
        })) || [],
      };
  
      const formattedText = `
📄 Invoice Details:
---------------------------------------
🆔 Invoice ID: ${cleanedData.invoiceId}
📅 Date: ${cleanedData.invoiceDate}
🏢 Customer: ${cleanedData.customerName}
🏠 Address: ${cleanedData.customerAddress.streetAddress}, ${cleanedData.customerAddress.postalCode} ${cleanedData.customerAddress.city}

💰 Total Amount: ${cleanedData.totalAmount} ${cleanedData.currency}

🛒 Items:
---------------------------------------
${cleanedData.items
  .map(
    (item, index) => `${index + 1}. ${item.description}
   - 🏷️ Price: ${item.unitPrice} ${cleanedData.currency}
   - 🔢 Quantity: ${item.quantity}
   - 💵 Amount: ${item.amount} ${cleanedData.currency}`
  )
  .join("\n---------------------------------------\n")}

✅ End of Invoice
    `;

    console.log("Formatted Data:", formattedText);
    setResult(formattedText);
    } catch (error) {
      console.error("Error analyzing the file:", error);
      setResult("Error analyzing the file: " + (error as Error).message);
    }
  };

  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-8 text-center text-black">OCR Analysis</h1>
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Upload a File</h2>
        <FileUpload setFile={setFile} />
        <p className="mt-2 text-gray-700">Selected File: {file ? file.name : "no file chosen"}</p>
        <button onClick={analyzeFile} className="bg-blue-500 text-white px-4 py-2 rounded mt-4">
            Analyze
        </button>
    </section>  
      {result && (
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">OCR Result</h2>
          <pre className="leading-relaxed text-lg text-gray-700 whitespace-pre-wrap">{result}</pre>
        </section>
      )}
    </div>
  );
};

export default OCRPage;
