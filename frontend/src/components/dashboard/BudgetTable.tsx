// components/BudgetTable.tsx
"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Campaign } from "./page";

interface BudgetTableProps {
  data: Campaign[];
  isLoading: boolean;
}

const BudgetTable: React.FC<BudgetTableProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return <p>Loading Excel Data...</p>;
  }

  if (!data || data.length === 0) {
    return <p>No data available.</p>;
  }

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const monthlySubHeaders = [
    "Net Billable",
    "Agency Commission",
    "Levy (ASBOF)",
    "Total Invoice Val",
  ];

  return (
    <div className="overflow-x-auto border border-gray-300 shadow-md rounded-lg">
      <Table className="w-full border-collapse">
        <TableHeader className="bg-black text-white">
          {/* First Row: Fixed Info Headers & Month Headers */}
          <TableRow>
            <TableHead className="p-3 font-bold text-center" rowSpan={2}>
              PO Number
            </TableHead>
            <TableHead className="p-3 font-bold text-center" rowSpan={2}>
              Campaign
            </TableHead>
            <TableHead className="p-3 font-bold text-center" rowSpan={2}>
              Channel
            </TableHead>
            <TableHead className="p-3 font-bold text-center" rowSpan={2}>
              Product Code
            </TableHead>
            <TableHead className="p-3 font-bold text-center" rowSpan={2}>
              Net Billable
            </TableHead>
            <TableHead className="p-3 font-bold text-center" rowSpan={2}>
              Agency Commission
            </TableHead>
            <TableHead className="p-3 font-bold text-center" rowSpan={2}>
              Levy (ASBOF)
            </TableHead>
            <TableHead className="p-3 font-bold text-center" rowSpan={2}>
              Total Invoice Val
            </TableHead>
            <TableHead className="p-3 font-bold text-center" rowSpan={2}>
              Planned Spend
            </TableHead>
            <TableHead className="p-3 font-bold text-center" rowSpan={2}>
              Reserved Budget
            </TableHead>
            <TableHead className="p-3 font-bold text-center" rowSpan={2}>
              Total Budget
            </TableHead>
            <TableHead className="p-3 font-bold text-center" rowSpan={2}>
              Channel Budget
            </TableHead>
            <TableHead className="p-3 font-bold text-center" rowSpan={2}>
              Market
            </TableHead>
            {months.map((month, index) => (
              <TableHead
                key={index}
                colSpan={4}
                className="p-3 font-bold text-center border"
              >
                {month}
              </TableHead>
            ))}
          </TableRow>

          {/* Second Row: 4 Subheaders Per Month */}
          <TableRow>
            {Array(12)
              .fill(monthlySubHeaders)
              .flat()
              .map((subHeader, index) => (
                <TableHead key={index} className="p-3 font-bold border">
                  {subHeader}
                </TableHead>
              ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow
              key={rowIndex}
              className={rowIndex % 2 === 0 ? "bg-gray-50" : "bg-white"}
            >
              <TableCell>{row.poNumber}</TableCell>
              <TableCell>{row.name}</TableCell>
              <TableCell>
                {row.channels.map((channel) => channel.name).join(", ")}
              </TableCell>
              <TableCell>0</TableCell>
              <TableCell>{row.financials.netBillable}</TableCell>
              <TableCell>{row.financials.agencyCommission}</TableCell>
              <TableCell>{row.financials.levyASBOF}</TableCell>
              <TableCell>{row.financials.invoiceVal}</TableCell>
              <TableCell>{row.financials.plannedSpend}</TableCell>
              <TableCell>{row.financials.reservedBudget}</TableCell>
              <TableCell>{row.financials.totalBudget}</TableCell>
              {/*// TODO: FIX
              // 
              // <TableCell>{row.financials.chanelBudget}</TableCell> 
              // */}
              <TableCell>{row.market}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default BudgetTable;
