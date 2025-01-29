"use client";
import { POTrackerView, processPOTracker } from '@/components/POTrackerProcessor';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { POTrackerRow } from '@/types/types';
import { useState } from 'react';
import ExcelJS from 'exceljs';

export const exportFormattedExcel = async (data: POTrackerRow[]) => {
  // Create workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Budget Tracker', {
    properties: { tabColor: { argb: '6B8E23' } }
  });

  // Define columns
  worksheet.columns = [
    { header: 'PO Number', key: 'poNumber', width: 15 },
    { header: 'Campaign', key: 'campaign', width: 25 },
    { header: 'Start Date', key: 'startDate', width: 12 },
    { header: 'End Date', key: 'endDate', width: 12 },
    { header: 'PO Close Down Date (90 days)', key: 'poCloseDownDate', width: 20 },
    { header: 'Media Channel', key: 'mediaChannel', width: 15 },
    { header: 'Product Code', key: 'productCode', width: 15 },
    { header: 'Net Media (Incl Fees)', key: 'netMedia', width: 18 },
    { header: 'Agency Commission', key: 'agencyCommission', width: 18 },
    { header: 'ASBOF', key: 'asbof', width: 12 },
    { header: 'Total PO Value', key: 'totalPOValue', width: 15 },
    { header: 'Total Invoiced to date', key: 'totalInvoiced', width: 18 },
    { header: 'PO Value Remaining', key: 'poValueRemaining', width: 18 }
  ];

  // Style the header row
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, size: 11 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  
  // Add data
  data.forEach((item) => {

    item.MediaChannels.forEach((mediaChannel) => {
      worksheet.addRow({
        poNumber: item.PONumber,
        campaign: item.Campaign,
        startDate: item.StartDate,
        endDate: item.EndDate,
        poCloseDownDate: item.POCloseDownDate,
        mediaChannel: mediaChannel.MediaName,
        productCode: mediaChannel.ProductCode,
        netMedia: mediaChannel.NetMedia,
        agencyCommission: mediaChannel.AgencyCommission,
        asbof: mediaChannel.ASBOF,
        totalPOValue: item.TotalPOValue,
        totalInvoiced: item.TotalInvoiced,
        poValueRemaining: item.POValueRemaining
      });
    });
  });

  // Style data rows
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) { // Skip header row
      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        
        // Align numbers right, text left
        if (colNumber >= 4) {
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        }

        // Color negative variances red
        if (colNumber === 6 && cell.value && typeof cell.value === 'number' && cell.value < 0) {
          cell.font = { color: { argb: 'FFFF0000' } };
        }
      });
    }
  });

  // Add totals row
  const totalRow = worksheet.addRow({
    campaign: 'Total',
    channel: '',
    market: '',
    totalBudget: { formula: `SUM(D2:D${data.length + 1})` },
    plannedSpend: { formula: `SUM(E2:E${data.length + 1})` },
    variance: { formula: `SUM(F2:F${data.length + 1})` }
  });

  // Style totals row
  totalRow.eachCell((cell, colNumber) => {
    cell.font = { bold: true, size: 11 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'double' },
      right: { style: 'thin' }
    };
    
    if (colNumber >= 4) {
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
    } else {
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
    }
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  
  // Create blob and download
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `budget-tracker-${new Date().toISOString().slice(0, 10)}.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);
};

// React com, { useState }ponent
import React from 'react';
import { WorkbookGenerator } from '@/components/export/WorkbookGenerator';

const ExportButton: React.FC<{ data: POTrackerRow[] }> = ({ data }) => {
  const handleExport = async () => {
    try {
      const workbook = new WorkbookGenerator();
      await workbook.generateWorkbook([{sheetName: "Sheet1", data: data}]);
      workbook.saveWorkbook();
    } catch (error) {
      console.error('Error exporting Excel file:', error);
    }
  };

  return (
    <button 
      onClick={handleExport}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      Export to Excel
    </button>
  );
};


// In your component:
const ExportView = () => {

  const [unbilledFile, setUnbilledFile] = useState<File | null>(null);
  const [poData, setPOData] = useState<POTrackerRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    try {
      setUnbilledFile(file);
      const poTrackerData = await processPOTracker(file);
      setPOData(poTrackerData);
      console.log(poTrackerData);
    } catch (err) {
      setError("Error processing file");
      console.error(err);
    }
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto flex flex-col gap-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 mt-6">
        File Upload
      </h1>

      <h2 className="text-xl text-gray-900 dark:text-gray-100 mb-6">
        Upload your Unbilled file
      </h2>

      <div
        className={`flex flex-row gap-2 p-4 rounded-md justify-between align-middle ${
          unbilledFile
            ? "bg-green-100 dark:bg-green-800"
            : "bg-gray-100 dark:bg-gray-800"
        }`}
      >
        <span className="text-gray-900 dark:text-gray-100 justify-self-center">
          Upload your Unbilled file
        </span>
        <Input
          type="file"
          accept=".csv, .xls, .xlsx"
          multiple={false}
          className="border rounded-md w-2/12"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files && e.target.files[0];
            if (file) {
              handleFileUpload(file);
            }
          }}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}


      
      {poData && (<POTrackerView data={poData} />)}

      {poData && (<ExportButton data={poData} />)}

      
    </div>
  );
};

export default ExportView;