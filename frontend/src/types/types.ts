// types.ts
export interface UnbilledRow {
  CampaignName: string;
  MediaName: string;
  BookingCategoryShortname: string; // For media channel categorization
  Payable: number;
  AgencyCommission: number;
  LevyBillable: number;
  ProductCode: string; // Added for division tracking
  BuyMonth: string; // Added for monthly allocation
  BuyDate?: string; // Optional as it might not always be present
  PO: string; // Added for PO tracking
  Billable: number; // Added for total value
  VATBillable: number; // Added for VAT
  SupplierName: string; // Added for supplier info
  "Unbilled Client Cost": number; // Added for total value
}

export interface MonthlyExpense {
  NetBillable: number;
  AgencyCommission: number;
  Levy: number;  // ASBOF
  TotalInvoiceValue: number;
} 

export interface MediaChannel {
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

export interface POTrackerRow {
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
