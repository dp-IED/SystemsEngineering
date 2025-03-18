"use client";

import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { OverallSpendingChart } from "@/components/charts/OverallSpendingChart";
import { BudgetvsActualChart } from "../charts/BudgetvsActualChart";
import BudgetTable from "./BudgetTable";

const API_URL =
  "https://systemsteam17storage.blob.core.windows.net/summary/FormattedAnnualBudget.xlsx?se=2025-04-10T23%3A59%3A59Z&sp=r&sv=2022-11-02&sr=b&sig=1DvdyO%2BRgtocwWEPBo1GmfRZG4CimWg8QYHXYIEQ6a0%3D"; // Direct Blob URL

//TODO: ADD MORE GRAPH TYPES

interface FinancialMetrics {
  netBillable: number;
  agencyCommission: number;
  levyASBOF: number;
  invoiceVal: number;
  plannedSpend: number;
  reservedBudget: number;
  totalBudget: number;
  chanelBudget: number;
}

interface Channel {
  name: string;
  financials: FinancialMetrics;
}

export interface Campaign {
  poNumber: string;
  name: string;
  channels: Channel[];
  financials: FinancialMetrics;
  market: string;
  isSubCampaign?: boolean;
  parentCampaignName?: string;
}

const ExpenseDashboard: React.FC = () => {
  interface ParsedData {
    fnb: Campaign[];
    fshew: Campaign[];
    wfj: Campaign[];
  }

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [parsedData, setParsedData] = useState<ParsedData>({
    fnb: [],
    fshew: [],
    wfj: [],
  });

  const parseExcelData = (rawData: string[][]): Campaign[] => {
    // Skip header rows and handle empty data
    if (!rawData || rawData.length < 3) return [];

    const dataRows = rawData.slice(2);
    const campaigns: Campaign[] = [];

    dataRows.forEach((row, i) => {
      // Skip total rows or empty rows
      if (!row || row[2] === "Total") return;

      // Extract financial metrics
      const financials: FinancialMetrics = {
        netBillable: Number(row[4]) || 0,
        agencyCommission: Number(row[5]) || 0,
        levyASBOF: Number(row[6]) || 0,
        invoiceVal: Number(row[7]) || 0,
        plannedSpend: Number(row[8]) || 0,
        reservedBudget: Number(row[9]) || 0,
        totalBudget: Number(row[10]) || 0,
        chanelBudget: Number(row[11]) || 0,
      };

      // Main campaign with PO number
      if (row[0]) {
        campaigns.push({
          poNumber: String(row[0] || ""),
          name: String(row[1] || ""),
          channels: [{
            name: String(row[2] || ""),
            financials: { ...financials },
          }],
          financials: { ...financials },
          market: String(row[12] || ""),
        });
      } // Sub-campaign (has name but no PO)
      else if (row[1] && row[2]) {
        // Find parent campaign
        let parentName = "";
        for (let j = i - 1; j >= 0; j--) {
          if (dataRows[j] && dataRows[j][0] && dataRows[j][1]) {
            parentName = String(dataRows[j][1] || "");
            break;
          }
        }

        campaigns.push({
          poNumber: "",
          name: String(row[1] || ""),
          channels: [{
            name: String(row[2] || ""),
            financials: { ...financials },
          }],
          financials: { ...financials },
          market: String(row[12] || ""),
          isSubCampaign: true,
          parentCampaignName: parentName,
        });
      } // Channel only (add to most recent campaign)
      else if (row[2] && campaigns.length > 0) {
        const lastCampaign = campaigns[campaigns.length - 1];
        lastCampaign.channels.push({
          name: String(row[2] || ""),
          financials: { ...financials },
        });

        // Update campaign totals
        lastCampaign.financials.netBillable += financials.netBillable;
        lastCampaign.financials.agencyCommission += financials.agencyCommission;
        lastCampaign.financials.levyASBOF += financials.levyASBOF;
        lastCampaign.financials.invoiceVal += financials.invoiceVal;
        lastCampaign.financials.plannedSpend += financials.plannedSpend;
        lastCampaign.financials.reservedBudget += financials.reservedBudget;
      }
    });

    return campaigns;
  };

  // Fetch Excel File from Backend and Parse it
  useEffect(() => {
    const fetchExcelFile = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(API_URL, { method: "GET" });

        if (!response.ok) {
          throw new Error(`Failed to fetch file. ${response.status}`);
        }

        const blob = await response.blob();
        const reader = new FileReader();
        reader.readAsArrayBuffer(blob);
        reader.onload = (e) => {
          const arrayBuffer = e.target?.result as string;
          const workbook = XLSX.read(arrayBuffer, { type: "array" });

          // Extract sheets for each division
          const fnbSheet = workbook.Sheets["F&B"];
          const fshewSheet = workbook.Sheets["FSH&EW"];
          const wfjSheet = workbook.Sheets["W&FJ"];

          // Convert each sheet to JSON format
          const fnbRawData = XLSX.utils.sheet_to_json(fnbSheet, {
            header: 1,
          }) as string[][];
          const fshewRawData = XLSX.utils.sheet_to_json(fshewSheet, {
            header: 1,
          }) as string[][];
          const wfjRawData = XLSX.utils.sheet_to_json(wfjSheet, {
            header: 1,
          }) as string[][];

          // Process the raw data into a more accessible format
          const [processedFnb, processedFshew, processedWfj] = [
            parseExcelData(fnbRawData),
            parseExcelData(fshewRawData),
            parseExcelData(wfjRawData),
          ];

          console.log([processedFnb, processedFshew, processedFshew]);

          // Store the processed data in a separate state
          setParsedData({
            fnb: processedFnb,
            fshew: processedFshew,
            wfj: processedWfj,
          });
        };
      } catch (error) {
        console.error("Error fetching Excel file:", error);
      }
      setIsLoading(false);
    };

    fetchExcelFile();
  }, []);

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <Tabs defaultValue="overview" className="mb-8">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="division1">F&B</TabsTrigger>
          <TabsTrigger value="division2">FSH&EW</TabsTrigger>
          <TabsTrigger value="division3">W&FJ</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          {/* 📌 Excel File Preview */}
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">
              Budget Visualization
            </h2>
            {isLoading
              ? <p>Loading Excel Data...</p>
              : parsedData
              ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                  <OverallSpendingChart
                    chartData={[
                      parsedData.fnb,
                      parsedData.fshew,
                      parsedData.wfj,
                    ].flat()}
                  />
                  <BudgetvsActualChart
                    chartData={[
                      parsedData.fnb,
                      parsedData.fshew,
                      parsedData.wfj,
                    ].flat()}
                  />
                </div>
              )
              : <p>No data available.</p>}
          </div>

          {/* 📌 Download Button */}
          <div className="flex justify-end">
            <Button asChild>
              <a href={API_URL} download="Financial_Report.xlsx">
                ⬇ Download Report
              </a>
            </Button>
          </div>
        </TabsContent>
        {/* 🔹 F&B DIVISION - Now using the reusable component */}
        <TabsContent value="division1">
          <h2 className="text-2xl font-semibold mb-4">F&B Division</h2>
          <BudgetTable data={parsedData.fnb} isLoading={isLoading} />
        </TabsContent>

        {/* 🔹 FSH&EW DIVISION - Now using the reusable component */}
        <TabsContent value="division2">
          <h2 className="text-2xl font-semibold mb-4">FSH&EW Division</h2>
          <BudgetTable data={parsedData.fshew} isLoading={isLoading} />
        </TabsContent>

        {/* 🔹 W&FJ DIVISION - Now using the reusable component */}
        <TabsContent value="division3">
          <h2 className="text-2xl font-semibold mb-4">W&FJ Division</h2>
          <BudgetTable data={parsedData.wfj} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExpenseDashboard;
