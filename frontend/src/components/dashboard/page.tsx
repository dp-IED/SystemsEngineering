"use client";

import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronDown, TrendingDown } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, Pie, PieChart, Cell, ResponsiveContainer } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

export interface Expense {
  id: number;
  name: string;
  division: string;
  campaign: string;
  date: string;
  amount: string;
}

const API_URL =
  "https://systemsteam17storage.blob.core.windows.net/summary/FormattedAnnualBudget.xlsx?se=2025-04-10T23%3A59%3A59Z&sp=r&sv=2022-11-02&sr=b&sig=1DvdyO%2BRgtocwWEPBo1GmfRZG4CimWg8QYHXYIEQ6a0%3D"; // Direct Blob URL

const ExpenseDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [excelData, setExcelData] = useState<{ 
    fnb: string[][]; 
    fshew: string[][]; 
    wfj: string[][]; 
  }>({
    fnb: [],
    fshew: [],
    wfj: [],
  });
  

  const recentTransactions: Expense[] = [
    { id: 1, name: "Expense A", division: "F&B", campaign: "Bleu", date: "01/02/24", amount: "£10,500" },
    { id: 2, name: "Expense B", division: "FSH&EW", campaign: "Les Beiges", date: "05/02/24", amount: "£25,300" },
    { id: 3, name: "Expense C", division: "W&FJ", campaign: "Rouge Allure", date: "10/02/24", amount: "£5,200" },
  ];

  // Fetch Excel File from Backend and Parse it
  useEffect(() => {
    const fetchExcelFile = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(API_URL, { method: "GET" });
  
        if (!response.ok) throw new Error("Failed to fetch file.");
  
        const blob = await response.blob();
        const reader = new FileReader();
        reader.readAsBinaryString(blob);
        reader.onload = (e) => {
          const binaryStr = e.target?.result as string;
          const workbook = XLSX.read(binaryStr, { type: "binary" });
  
          // Extract sheets for each division
          const fnbSheet = workbook.Sheets["F&B"];
          const fshewSheet = workbook.Sheets["FSH&EW"];
          const wfjSheet = workbook.Sheets["W&FJ"];
  
          // Convert each sheet to JSON format
          setExcelData({
            fnb: XLSX.utils.sheet_to_json(fnbSheet, { header: 1 }) as string[][],
            fshew: XLSX.utils.sheet_to_json(fshewSheet, { header: 1 }) as string[][],
            wfj: XLSX.utils.sheet_to_json(wfjSheet, { header: 1 }) as string[][],
          });
        };
      } catch (error) {
        console.error("Error fetching Excel file:", error);
      }
      setIsLoading(false);
    };
  
    fetchExcelFile();
  }, []);
  
  

  const chartData = [
    { month: "January", div1: 75, div2: 85, div3: 65 },
    { month: "February", div1: 78, div2: 82, div3: 68 },
    { month: "March", div1: 80, div2: 85, div3: 70 },
    { month: "April", div1: 77, div2: 83, div3: 68 },
    { month: "May", div1: 82, div2: 86, div3: 71 },
    { month: "June", div1: 85, div2: 88, div3: 75 },
  ];

  const chartConfig = {
    div1: { label: "F&B", color: "hsl(var(--chart-1))" },
    div2: { label: "FSH&EW", color: "hsl(var(--chart-2))" },
    div3: { label: "W&FJ", color: "hsl(var(--chart-3))" },
  } satisfies ChartConfig;

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
          {/* 📌 Recent Transactions */}
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Recent Transactions</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Division</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{expense.name}</TableCell>
                    <TableCell>{expense.division}</TableCell>
                    <TableCell>{expense.campaign}</TableCell>
                    <TableCell>{expense.date}</TableCell>
                    <TableCell>{expense.amount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

        
          {/* 📌 Excel File Preview */}
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Budget Visualization</h2>
            {isLoading ? (
              <p>Loading Excel Data...</p>
            ) : excelData.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    {excelData[0].map((header, index) => (
                      <TableHead key={index}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {excelData.slice(1).map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <TableCell key={cellIndex}>{cell}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p>No data available.</p>
            )}
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
        {/* 🔹 F&B DIVISION */}
<TabsContent value="division1">
  <h2 className="text-2xl font-semibold mb-4">F&B Division</h2>

  {isLoading ? (
    <p>Loading Excel Data...</p>
  ) : excelData.fnb.length > 0 ? (
    <div className="overflow-x-auto border border-gray-300 shadow-md rounded-lg">

      {/* 📌 Merged Summary & Monthly Breakdown Table */}
<h3 className="text-lg font-semibold mt-4 mb-2">Budget Overview</h3>
<Table className="w-full border-collapse">
  <TableHeader className="bg-black text-white">
    {/* First Row: Fixed Info Headers & Month Headers */}
    <TableRow>
      <TableHead className="p-3 font-bold text-center" rowSpan={2}>PO Number</TableHead>
      <TableHead className="p-3 font-bold text-center" rowSpan={2}>Campaign</TableHead>
      <TableHead className="p-3 font-bold text-center" rowSpan={2}>Channel</TableHead>
      <TableHead className="p-3 font-bold text-center" rowSpan={2}>Product Code</TableHead>
      <TableHead className="p-3 font-bold text-center" rowSpan={2}>Net Billable</TableHead>
      <TableHead className="p-3 font-bold text-center" rowSpan={2}>Agency Commission</TableHead>
      <TableHead className="p-3 font-bold text-center" rowSpan={2}>Levy (ASBOF)</TableHead>
      <TableHead className="p-3 font-bold text-center" rowSpan={2}>Total Invoice Val</TableHead>
      <TableHead className="p-3 font-bold text-center" rowSpan={2}>Planned Spend</TableHead>
      <TableHead className="p-3 font-bold text-center" rowSpan={2}>Reserved Budget</TableHead>
      <TableHead className="p-3 font-bold text-center" rowSpan={2}>Total Budget</TableHead>
      <TableHead className="p-3 font-bold text-center" rowSpan={2}>Channel Budget</TableHead>
      <TableHead className="p-3 font-bold text-center" rowSpan={2}>Market</TableHead>
      {[
        "January", "February", "March", "April", "May", "June", 
        "July", "August", "September", "October", "November", "December"
      ].map((month, index) => (
        <TableHead key={index} colSpan={4} className="p-3 font-bold text-center border">
          {month}
        </TableHead>
      ))}
    </TableRow>

    {/* Second Row: 4 Subheaders Per Month */}
    <TableRow>
      {Array(12).fill(["Net Billable", "Agency Commission", "Levy (ASBOF)", "Total Invoice Val"])
        .flat()
        .map((subHeader, index) => (
          <TableHead key={index} className="p-3 font-bold border">
            {subHeader}
          </TableHead>
        ))}
    </TableRow>
  </TableHeader>

  {/* Table Body with Data from Summary Spreadsheet */}
  <TableBody>
    {excelData.fnb.slice(1).map((row, rowIndex) => (
      <TableRow key={rowIndex} className={rowIndex % 2 === 0 ? "bg-gray-50" : "bg-white"}>
        {/* Fixed Info Columns */}
        {row.slice(0, 13).map((cell, cellIndex) => (
          <TableCell key={cellIndex} className="border border-gray-200 p-3 text-center">
            {cell}
          </TableCell>
        ))}

        {/* Monthly Data: Net Billable, Agency Commission, Levy, Total Invoice */}
        {row.slice(13).map((cell, cellIndex) => (
          <TableCell key={cellIndex} className="border border-gray-200 p-3 text-center">
            {cell}
          </TableCell>
        ))}
      </TableRow>
    ))}
  </TableBody>
</Table>


    </div>
  ) : (
    <p>No data available.</p>
  )}
</TabsContent>


        {/* 🔹 FSH&EW DIVISION */}
        <TabsContent value="division2">
          <h2 className="text-2xl font-semibold mb-4">FSH&EW Division</h2>
          {isLoading ? (
            <p>Loading Excel Data...</p>
          ) : excelData.fshew.length > 0 ? (
            <div className="overflow-x-auto border border-gray-300 shadow-md rounded-lg">
              <Table className="w-full border-collapse">
                <TableHeader className="bg-black text-white">
                  <TableRow>
                    {excelData.fshew[0].map((header, index) => (
                      <TableHead key={index} className="p-3 font-bold">
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {excelData.fshew.slice(1).map((row, rowIndex) => (
                    <TableRow key={rowIndex} className={rowIndex % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                      {row.map((cell, cellIndex) => (
                        <TableCell key={cellIndex} className="border border-gray-200 p-3 text-center">
                          {cell}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p>No data available.</p>
          )}
        </TabsContent>

        {/* 🔹 W&FJ DIVISION */}
        <TabsContent value="division3">
          <h2 className="text-2xl font-semibold mb-4">W&FJ Division</h2>
          {isLoading ? (
            <p>Loading Excel Data...</p>
          ) : excelData.wfj.length > 0 ? (
            <div className="overflow-x-auto border border-gray-300 shadow-md rounded-lg">
              <Table className="w-full border-collapse">
                <TableHeader className="bg-black text-white">
                  <TableRow>
                    {excelData.wfj[0].map((header, index) => (
                      <TableHead key={index} className="p-3 font-bold">
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {excelData.wfj.slice(1).map((row, rowIndex) => (
                    <TableRow key={rowIndex} className={rowIndex % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                      {row.map((cell, cellIndex) => (
                        <TableCell key={cellIndex} className="border border-gray-200 p-3 text-center">
                          {cell}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p>No data available.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExpenseDashboard;
