"use client";

import { useState } from "react";
import { PYTHON_BACKEND_URL } from "../../../constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MatchResult {
  invoice_data: {
    vendor: string;
    date: string;
    amount: number;
    description: string;
    raw_text: string;
  };
  number_of_rows: number; // Number of rows in the CSV file
  matches: Array<{
    expense_row: {
      date: string;
      description: string;
      vendor: string;
      amount: number;
    };
    confidence: number;
    matched_fields: {
      date: boolean;
      amount: boolean;
      vendor: boolean;
      description: boolean;
    };
  }>;
}

export default function Page() {
  const [csvFile, setCSV] = useState<File | null>(null);
  const [pdfFile, setPDF] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!csvFile || !pdfFile) {
      setError("Please upload both CSV and PDF files");
      return;
    }

    setLoading(true);
    setError(null);

    try { //edit this part, add the extract function here
      const formData = new FormData();
      formData.append("csvFile", csvFile);
      formData.append("pdfFile", pdfFile);

      const response = await fetch(PYTHON_BACKEND_URL + "/reconciliate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: MatchResult = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto flex flex-col gap-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 mt-6">
        Reconciliate your expenses
      </h1>

      <h2 className="text-xl text-gray-900 dark:text-gray-100 mb-6">
        First, we need a xlsx or csv file with your spending data including at
        least the following columns: date, description, vendor, and amount.
      </h2>

      <div className="flex flex-row gap-2 bg-gray-100 dark:bg-gray-800 p-4 rounded-md justify-between align-middle">
        <span className="text-gray-900 dark:text-gray-100 justify-self-center">
          Upload your expenses file
        </span>
        <Input
          type="file"
          accept=".csv"
          className="border rounded-md w-2/12"
          onChange={(e) => {
            const files = e.target.files;
            if (files && files[0]) {
              setCSV(files[0]);
            }
          }}
        />
      </div>

      {csvFile && (
        <>
          <h2 className="text-xl text-gray-900 dark:text-gray-100 mb-6">
            Now, upload a PDF file and we will match your expenses with the
            invoice.
          </h2>
          <Input
            type="file"
            accept=".pdf"
            className="border border-gray-300 dark:border-gray-700 rounded-md"
            onChange={(e) => {
              const files = e.target.files;
              if (files && files[0]) {
                setPDF(files[0]);
              }
            }}
          />
        </>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button onClick={handleSubmit} disabled={loading || !csvFile || !pdfFile}>
        {loading ? "Processing..." : "Match Expenses"}
      </Button>

      {result && (
        <div className="mt-6 space-y-4">
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
            <h3 className="text-lg font-semibold mb-2">Invoice Details</h3>
            <dl className="grid grid-cols-2 gap-2">
              <dt className="font-medium">Vendor:</dt>
              <dd>{result.invoice_data.vendor || "Not found"}</dd>
              <dt className="font-medium">Date:</dt>
              <dd>{result.invoice_data.date || "Not found"}</dd>
              <dt className="font-medium">Amount:</dt>
              <dd>{result.invoice_data.amount?.toFixed(2) || "Not found"}</dd>
              <dt className="font-medium">Description:</dt>
              <dd>{result.invoice_data.description || "Not found"}</dd>
            </dl>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              Matching Expenses ({result.matches.length}) out of{" "}
              {result.number_of_rows} rows
            </h3>
            {result.matches.length === 0 ? (
              <p>No matching expenses found</p>
            ) : (
              result.matches.map((match, index) => (
                <div
                  key={index}
                  className="border rounded-md p-4 bg-white dark:bg-gray-900"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">Match #{index + 1}</h4>
                    <span className="text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 px-2 py-1 rounded">
                      {match.confidence.toFixed(1)}% confidence
                    </span>
                  </div>
                  <dl className="grid grid-cols-2 gap-2">
                    <dt className="font-medium">Vendor:</dt>
                    <dd
                      className={
                        match.matched_fields.vendor
                          ? "text-green-600 dark:text-green-400"
                          : ""
                      }
                    >
                      {match.expense_row.vendor}
                    </dd>
                    <dt className="font-medium">Date:</dt>
                    <dd
                      className={
                        match.matched_fields.date
                          ? "text-green-600 dark:text-green-400"
                          : ""
                      }
                    >
                      {match.expense_row.date}
                    </dd>
                    <dt className="font-medium">Amount:</dt>
                    <dd
                      className={
                        match.matched_fields.amount
                          ? "text-green-600 dark:text-green-400"
                          : ""
                      }
                    >
                      ${match.expense_row.amount.toFixed(2)}
                    </dd>
                    <dt className="font-medium">Description:</dt>
                    <dd
                      className={
                        match.matched_fields.description
                          ? "text-green-600 dark:text-green-400"
                          : ""
                      }
                    >
                      {match.expense_row.description}
                    </dd>
                  </dl>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
