import * as XLSX from 'exceljs'

interface MonthlyExpense {
  NetBillable: number;
  AgencyCommission: number;
  Levy: number;  // ASBOF
  TotalInvoiceValue: number;
}

interface MediaChannel {
  MediaName: string;
  ProductCode: string;
  NetMedia: number;
  AgencyCommission: number;
  ASBOF: number;
  TotalPOValue: number;
  MonthlyExpenses: {
    [key: string]: MonthlyExpense;
  };
}

interface POTrackerRow {
  PONumber: string;
  POCloseDownDate: string;
  StartDate: string;
  EndDate: string;
  Campaign: string;
  MediaChannels: MediaChannel[];
  TotalNetMediaIncFees: number;
  TotalAgencyCommission: number;
  TotalASBOF: number;
  TotalPOValue: number;
  TotalInvoiced: number;
  POValueRemaining: number;
}

interface SheetData {
  sheetName: string;
  data: POTrackerRow[];
}

export class WorkbookGenerator {
  private workbook: XLSX.Workbook;
  private readonly months = [
    'Jan', 'Feb', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Define styles
  private readonly styles = {
    header: {
      fill: {
        fgColor: { argb: '#2F4050' },
        patternType: 'solid',
      },
      font: {
        color: { argb: '#FFFFFF' },
        bold: true,
      },
      border: {
        top: { style: 'thin', color: { argb: '#000000' } },
        bottom: { style: 'thin', color: { argb: '#000000' } },
        left: { style: 'thin', color: { argb: '#000000' } },
        right: { style: 'thin', color: { argb: '#000000' } },
      },
      alignment: {
        horizontal: 'center',
        vertical: 'center',
      },
    },
    mediaChannel: {
      fill: {
        fgColor: { argb: '#90EE90' },
        patternType: 'solid',
      },
      border: {
        top: { style: 'thin', color: { argb: '#000000' } },
        bottom: { style: 'thin', color: { argb: '#000000' } },
        left: { style: 'thin', color: { argb: '#000000' } },
        right: { style: 'thin', color: { argb: '#000000' } },
      },
    },
    normalCell: {
      border: {
        top: { style: 'thin', color: { argb: '#000000' } },
        bottom: { style: 'thin', color: { argb: '#000000' } },
        left: { style: 'thin', color: { argb: '#000000' } },
        right: { style: 'thin', color: { argb: '#000000' } },
      },
    },
    number: {
      numFmt: '#,##0.00',
      border: {
        top: { style: 'thin', color: { argb: '#000000' } },
        bottom: { style: 'thin', color: { argb: '#000000' } },
        left: { style: 'thin', color: { argb: '#000000' } },
        right: { style: 'thin', color: { argb: '#000000' } },
      },
      alignment: {
        horizontal: 'right',
      },
    },
  };

  constructor() {
    this.workbook = new XLSX.Workbook();
  }

   private getHeaderRows(): string[][] {
    const monthColumns = [
      'Net Billable',
      'Agency Commission',
      'Levy (ASBOF)',
      'Total invoice val £',
      'Inv #'
    ];

    return [
      [
        'PO Number', // A
        'Campaign', // B
        'Start Date', // C
        'End Date', // D
        'PO Close Down Date (90 days)', // E
        'Media Channel', // F
        'Product Code', // G
        'Net Media (incl Fees)', // H
        'Agency Commission', // I
        'ASBOF', // J
        'Total PO Value', // K
        'Total Invoiced to date', // L
        'PO Value Remaining', // M
        '', // N - Empty spacer column
        // Start months from column O
        ...this.months.map(month => [month, '', '', '', '']).flat(),
        'YTD', '', '', '', ''
      ],
      [
        '', '', '', '', '', '', '', '', '', '', '', '', '', '',
        // Start month details from column O
        ...Array(13).fill(monthColumns).flat()
      ]
    ];
  }
  
  private createMerges(worksheet: XLSX.Worksheet): void {
    // Merge month header cells
    for (let i = 0; i < 13; i++) { // 12 months + YTD
      const startCol = 15 + (i * 5);
      const endCol = 19 + (i * 5);
      worksheet.mergeCells(1, startCol, 1, endCol);
    }

    // Merge vertical headers
    const verticalMerges = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
    verticalMerges.forEach(col => {
      worksheet.mergeCells(1, col, 2, col);
    });
  }


  
  private applyStyles(worksheet: XLSX.Worksheet): void {
    // Header style
    const headerStyle = {
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '2F4050' },
      },
      font: {
        color: { argb: 'FFFFFF' },
        bold: true
      },
      border: {
        top: { style: 'thin', color: { argb: '000000' } },
        bottom: { style: 'thin', color: { argb: '000000' } },
        left: { style: 'thin', color: { argb: '000000' } },
        right: { style: 'thin', color: { argb: '000000' } }
      },
      alignment: {
        horizontal: 'center',
        vertical: 'middle'
      }
    };

    // Apply styles to header rows
    worksheet.getRows(1, 2)?.forEach(row => {
      row.eachCell(cell => {
        Object.assign(cell, headerStyle);
      });
    });

    // Apply styles to data rows
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 2) return; // Skip header rows

      row.eachCell((cell, colNumber) => {
        // Campaign Name and Date columns
        if ([1, 1, 3, 4].includes(colNumber)) {
          cell.alignment = { horizontal: 'center' };
        }


        // Media Channel columns
        if (colNumber === 6) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '90EE90' }
          };

          cell.alignment = { horizontal: 'center' };
        }

        // Number format for numeric columns
        if ([8, 9, 10, 11, 12, 13].includes(colNumber)) {
          cell.numFmt = '#,##0.00';
          cell.alignment = { horizontal: 'right' };
        }

        // Apply border to all cells
        cell.border = {
          top: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'thin', color: { argb: '000000' } },
          left: { style: 'thin', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } }
        };
      });
    });
  }
  
  private populateSheet(worksheet: XLSX.Worksheet, data: POTrackerRow[]): void {
    let currentRow = 3; // Start after headers

    data.forEach(poRow => {
      poRow.MediaChannels.forEach((channel, index) => {
        // Initialize base row data
        const rowData: (string | number)[] = [
          index === 0 ? poRow.PONumber : '',           // A
          index === 0 ? poRow.Campaign : '',           // B
          index === 0 ? poRow.StartDate : '',          // C
          index === 0 ? poRow.EndDate : '',            // D
          index === 0 ? poRow.POCloseDownDate : '',    // E
          channel.MediaName,                           // F
          channel.ProductCode || '',              // G
          channel.NetMedia,                            // H
          channel.AgencyCommission,                    // I
          channel.ASBOF,                               // J
          channel.TotalPOValue,                        // K
          '' ,                       // L - Total Invoiced
          channel.TotalPOValue,                        // M - PO Value Remaining
          ''                                           // N - Empty spacer column
        ];

        // Add monthly data starting from column O
        this.months.forEach(month => {
          const monthData = channel.MonthlyExpenses[month] || {
            NetBillable: 0,
            AgencyCommission: 0,
            Levy: 0,
            TotalInvoiceValue: 0
          };

          rowData.push(
            monthData.NetBillable,
            monthData.AgencyCommission,
            monthData.Levy,
            monthData.TotalInvoiceValue,
            '' // Invoice number
          );
        });

        // Add YTD totals
        rowData.push(0, 0, 0, 0, ''); // YTD columns

        const row = worksheet.getRow(currentRow);
        row.values = rowData;
        currentRow++;
      });
    });
  }

  
 public generateWorkbook(sheets: SheetData[]): XLSX.Workbook {
    sheets.forEach(({ sheetName, data }) => {
      const worksheet = this.workbook.addWorksheet(sheetName);
      
      // Add headers
      const headerRows = this.getHeaderRows();
      worksheet.addRows(headerRows);

      // Set column widths
      worksheet.columns = Array(80).fill({ width: 20 });

      // Create merged cells
      this.createMerges(worksheet);

      // Populate data
      this.populateSheet(worksheet, data);

      // Apply styles
      this.applyStyles(worksheet);
    });

    return this.workbook;
  }

  public async saveWorkbook(filename: string = 'PO_Tracker.xlsx'): Promise<void> {
    // Write to buffer
    const buffer = await this.workbook.xlsx.writeBuffer();
    
    // Create blob from buffer
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}