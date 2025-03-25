export interface FinancialMetrics {
  netBillable: number;
  agencyCommission: number;
  levyASBOF: number;
  invoiceVal: number;
  plannedSpend: number;
  reservedBudget: number;
  totalBudget: number;
  totalInvoicedToDate: number;
  poValueRemaining: number;
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


export const parseExcelData = (rawData: string[][]): Campaign[] => {
    if (!rawData || rawData.length < 2) return [];

    const dataRows = rawData.slice(1); // Skip the header row
    const campaigns: Campaign[] = [];
    let currentCampaign: Campaign | null = null;

    dataRows.forEach((row) => {
      const financials: FinancialMetrics = {
        netBillable: Number(row[10]) || 0,
        agencyCommission: Number(row[11]) || 0,
        levyASBOF: Number(row[12]) || 0,
        invoiceVal: Number(row[13]) || 0,
        plannedSpend: Number(row[7]) || 0,
        reservedBudget: Number(row[8]) || 0,
        totalBudget: Number(row[9]) || 0,
        totalInvoicedToDate: Number(row[14]) || 0,
        poValueRemaining: Number(row[15]) || 0,
      };

      if (row[0]) {
        if (currentCampaign) {
          campaigns.push(currentCampaign);
        }

        currentCampaign = {
          poNumber: String(row[0] || ""),
          name: String(row[5] || ""),
          market: String(row[4] || ""),
          financials: { ...financials },
          channels: [],
        };
      }

      if (row[6] && row[6] !== "Total") {
        if (currentCampaign) {
          currentCampaign.channels.push({
            name: String(row[6] || ""),
            financials: { ...financials },
          });
        }
      }

      if (row[6] === "Total") {
        if (currentCampaign) {
          currentCampaign.financials = { ...financials };
        }
      }
    });

    if (currentCampaign) {
      campaigns.push(currentCampaign);
    }

    return campaigns;
  };