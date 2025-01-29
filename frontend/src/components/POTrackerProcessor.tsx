// components/POTrackerProcessor.tsx
import * as XLSX from "xlsx";
import _ from "lodash";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UnbilledRow, POTrackerRow, MonthlyExpense } from "@/types/types";
import React from "react";

export const processPOTracker = async (file: File): Promise<POTrackerRow[]> => {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer);
  const allSheetsData: UnbilledRow[] = [];

  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const sheetData = XLSX.utils.sheet_to_json(sheet) as UnbilledRow[];
    allSheetsData.push(...sheetData);
  });


  const rawData = allSheetsData;

  // Filter out rows with zero values or undefined PO
  const validRows = rawData.filter(
    (row) => (row.Payable > 0 || row.Billable > 0) && row.PO
  );

  const groupedByCampaign = _.groupBy(validRows, "CampaignName");

  const processedData = Object.entries(groupedByCampaign).map(([campaignName, entries]) => {
    // Group entries by media channel within the campaign
    const mediaChannels = _.groupBy(entries, "MediaName");
    
    // Process each media channel
    const processedMediaChannels = Object.entries(mediaChannels).map(([mediaName, mediaEntries]) => {
      // Calculate monthly expenses for this media channel
      const monthlyExpenses = _.groupBy(mediaEntries, entry => {
        const date = XLSX.SSF.parse_date_code(entry.BuyMonth);
        return date ? date.m : 0;
      });

      const processedMonthlyExpenses: { [key: string]: MonthlyExpense } = {};
      
      Object.entries(monthlyExpenses).forEach(([month, monthEntries]) => {
        const monthNum = parseInt(month);
        if (monthNum > 0) {
          const monthName = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
          ][monthNum - 1];

          processedMonthlyExpenses[monthName] = {
            NetBillable: _.sumBy(monthEntries, e => Number(e.Payable) || 0),
            AgencyCommission: _.sumBy(monthEntries, e => Number(e.AgencyCommission) || 0),
            Levy: _.sumBy(monthEntries, e => Number(e.LevyBillable) || 0),
            TotalInvoiceValue: _.sumBy(monthEntries, e => Number(e["Unbilled Client Cost"]) || 0),
          };
        }
      });

      return {
        MediaName: mediaName,
        ProductCode: mediaEntries[0].ProductCode,
        NetMedia: _.sumBy(mediaEntries, entry => Number(entry.Payable) || 0),
        AgencyCommission: _.sumBy(mediaEntries, entry => Number(entry.AgencyCommission) || 0),
        ASBOF: _.sumBy(mediaEntries, entry => Number(entry.LevyBillable) || 0),
        TotalPOValue: _.sumBy(mediaEntries, entry => Number(entry["Unbilled Client Cost"]) || 0),
        MonthlyExpenses: processedMonthlyExpenses
      };
    });

    // Calculate campaign dates
    const dates = entries.reduce((acc, entry) => {
      const monthDate = entry.BuyMonth ? XLSX.SSF.parse_date_code(entry.BuyMonth) : null;
      const buyDate = entry.BuyDate ? XLSX.SSF.parse_date_code(entry.BuyDate) : null;

      if (monthDate) {
        const monthDateTime = new Date(monthDate.y, monthDate.m - 1, 1).getTime();
        acc.start = Math.min(acc.start || monthDateTime, monthDateTime);
        // Set end date to last day of the month
        const lastDay = new Date(monthDate.y, monthDate.m, 0).getTime();
        acc.end = Math.max(acc.end || lastDay, lastDay);
      }

      if (buyDate) {
        const buyDateTime = new Date(buyDate.y, buyDate.m - 1, buyDate.d).getTime();
        acc.start = Math.min(acc.start || buyDateTime, buyDateTime);
        acc.end = Math.max(acc.end || buyDateTime, buyDateTime);
      }

      return acc;
    }, { start: 0, end: 0 });

    const startDate = new Date(dates.start);
    const endDate = new Date(dates.end);
    const poCloseDate = new Date(endDate);
    poCloseDate.setDate(poCloseDate.getDate() + 90);

    return {
      Campaign: campaignName,
      PONumber: entries[0].PO,
      StartDate: startDate.toISOString().split('T')[0],
      EndDate: endDate.toISOString().split('T')[0],
      POCloseDownDate: poCloseDate.toISOString().split('T')[0],
      MediaChannels: processedMediaChannels,
      TotalNetMediaIncFees: _.sumBy(processedMediaChannels, 'NetMedia'),
      TotalAgencyCommission: _.sumBy(processedMediaChannels, 'AgencyCommission'),
      TotalASBOF: _.sumBy(processedMediaChannels, 'ASBOF'),
      TotalPOValue: _.sumBy(processedMediaChannels, 'TotalPOValue'),
      TotalInvoiced: 0,
      POValueRemaining: _.sumBy(processedMediaChannels, 'TotalPOValue'),
    };
  });

  return processedData.sort((a, b) => a.Campaign.localeCompare(b.Campaign));
};

interface POTrackerProps {
  data: POTrackerRow[];
}

// Helper function to format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
  }).format(value);
};

const CampaignTable = ({
  campaign,
  rows,
}: {
  campaign: string;
  rows: POTrackerRow[];
}) => {
  const campaignData = rows.find(row => row.Campaign === campaign);
  if (!campaignData) return null;

  return (
    <Card className="w-full mb-8">
      <CardHeader>
        <CardTitle>{campaign}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="font-semibold w-48">Campaign</TableHead>
                <TableHead className="font-semibold w-48">Media Channel</TableHead>
                <TableHead className="font-semibold w-32">Product Code</TableHead>
                <TableHead className="font-semibold text-right w-40">Net Media (incl Fees)</TableHead>
                <TableHead className="font-semibold text-right w-40">Agency Commission</TableHead>
                <TableHead className="font-semibold text-right w-32">ASBOF</TableHead>
                <TableHead className="font-semibold text-right w-40">Total PO Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaignData.MediaChannels.map((mediaChannel) => (
                <React.Fragment key={mediaChannel.MediaName}>
                  <TableRow className="bg-slate-200">
                    <TableCell colSpan={7} className="font-semibold">
                      {mediaChannel.MediaName} total: {formatCurrency(mediaChannel.TotalPOValue)}
                    </TableCell>
                  </TableRow>
                  {Object.entries(mediaChannel.MonthlyExpenses).map(([month, expense]) => (
                    <TableRow
                      key={`${mediaChannel.MediaName}-${month}`}
                      className="hover:bg-slate-50"
                    >
                      <TableCell>{campaign}</TableCell>
                      <TableCell>{mediaChannel.MediaName}</TableCell>
                      <TableCell>{mediaChannel.ProductCode}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(expense.NetBillable)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(expense.AgencyCommission)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(expense.Levy)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(expense.TotalInvoiceValue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              ))}
              {/* Campaign total row */}
              <TableRow className="bg-slate-100 font-semibold border-t-2">
                <TableCell colSpan={3}>Campaign Total</TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(campaignData.TotalNetMediaIncFees)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(campaignData.TotalAgencyCommission)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(campaignData.TotalASBOF)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(campaignData.TotalPOValue)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export const POTrackerView = ({ data }: POTrackerProps) => {
  if (data.length === 0) {
    return <div>No data found</div>;
  }

  const campaignData = _.groupBy(data, "Campaign")

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">PO Tracker</h1>
        </div>

        {Object.entries(campaignData).map(([campaign, campaignRows]) => (
          <CampaignTable
            key={campaign}
            campaign={campaign}
            rows={campaignRows}
          />
        ))}
      </div>
    </div>
  );
};
