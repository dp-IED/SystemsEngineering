"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // Import useRouter for navigation
import * as XLSX from "xlsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { OverallSpendingChart } from "@/components/charts/OverallSpendingChart";
import { BudgetvsActualChart } from "../charts/BudgetvsActualChart";
import BudgetTable from "./BudgetTable";
import { fetchSummarySpreadsheet } from "@/app/actions";
import { Campaign, parseExcelData } from "./parseExcelData";
import ChartBase from "../charts/ChartBase";

//TODO: does this retrieve a snapshot or the most recent version.
const API_URL =
  "https://systemsteam17storage.blob.core.windows.net/summary/FormattedAnnualBudget.xlsx?se=2025-04-10T23%3A59%3A59Z&sp=r&sv=2022-11-02&sr=b&sig=1DvdyO%2BRgtocwWEPBo1GmfRZG4CimWg8QYHXYIEQ6a0%3D"; // Direct Blob URL



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
  const [isEmpty, setIsEmpty] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const fetchExcelFile = async () => {
      setIsLoading(true);
      try {
        const textBuffer = await fetchSummarySpreadsheet();
        if (textBuffer) {
          const workbook = XLSX.read(textBuffer, { type: "buffer" });
          const fnbSheet = workbook.Sheets["F&B"];
          const fshewSheet = workbook.Sheets["FSH&EW"];
          const wfjSheet = workbook.Sheets["W&FJ"];

          const fnbRawData = XLSX.utils.sheet_to_json(fnbSheet, {
            header: 1,
          }) as string[][];
          const fshewRawData = XLSX.utils.sheet_to_json(fshewSheet, {
            header: 1,
          }) as string[][];
          const wfjRawData = XLSX.utils.sheet_to_json(wfjSheet, {
            header: 1,
          }) as string[][];

          const [processedFnb, processedFshew, processedWfj] = [
            parseExcelData(fnbRawData),
            parseExcelData(fshewRawData),
            parseExcelData(wfjRawData),
          ];
          console.log([processedFnb, processedFshew, processedWfj])
          setParsedData({
            fnb: processedFnb,
            fshew: processedFshew,
            wfj: processedWfj,
          });

          // Check if all parsed data is empty
          if (
            processedFnb.length === 0 &&
            processedFshew.length === 0 &&
            processedWfj.length === 0
          ) {
            setIsEmpty(true); // Set the empty state
          }
        } else {
          setIsEmpty(true); // Set the empty state if no data is fetched
        }
      } catch (error) {
        console.error("Error fetching Excel file:", error);
        setIsEmpty(true); // Set the empty state in case of error
      }
      setIsLoading(false);
    };

    fetchExcelFile();
  }, []);

  if (isEmpty) {
    // Render the prompt if data is empty
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold mb-4">No Data Found</h1>
        <p className="text-gray-600 mb-6">
          It seems like there is no data available. Please upload a file to
          continue.
        </p>
        <Button onClick={() => router.push("/upload")}>Go to Upload</Button>
      </div>
    );
  }

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
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">
              Budget Visualization
            </h2>
            {isLoading ? (
              <p>Loading Excel Data...</p>
            ) : parsedData ? (
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
                <ChartBase graphType={"bar_chart"} />
                <ChartBase graphType={"line_chart"} />
                <ChartBase graphType={"pie_chart_channel"} />
                <ChartBase graphType={"pie_chart_division"} />
                <ChartBase graphType={"pie_chart_market"} />
                <ChartBase graphType={"pie_chart_monthly"} />
              </div>
            ) : (
              <p>No data available.</p>
            )}
          </div>

          <div className="flex justify-end">
            <Button asChild>
              <a href={API_URL} download="Financial_Report.xlsx">
                ⬇ Download Report
              </a>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="division1">
          <h2 className="text-2xl font-semibold mb-4">F&B Division</h2>
          <BudgetTable data={parsedData.fnb} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="division2">
          <h2 className="text-2xl font-semibold mb-4">FSH&EW Division</h2>
          <BudgetTable data={parsedData.fshew} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="division3">
          <h2 className="text-2xl font-semibold mb-4">W&FJ Division</h2>
          <BudgetTable data={parsedData.wfj} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExpenseDashboard;
