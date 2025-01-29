// components/UnbilledTable.tsx
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronsUpDown } from "lucide-react"; // already available
import * as XLSX from "xlsx";
import _ from "lodash";

type UnbilledRow = {
  CampaignName: string;
  MediaName: string;
  Payable: number;
  AgencyCommission: number;
  LevyBillable: number;
};

export type CampaignData = {
  CampaignName: string;
  TotalSpend: number;
  TotalAgencyCommission: number;
  TotalLevyBillable: number;
  details: UnbilledRow[];
};

export const processFile: {
  (file: File): Promise<{
    data: CampaignData[];
    noSpend: CampaignData[];
  }>;
} = async (file: File) => {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData: UnbilledRow[] = XLSX.utils.sheet_to_json(sheet);

  // Group by campaign, ignore the last row which is the total
  const grouped = _.groupBy(rawData.slice(0, -1), "CampaignName");

  const processedData: CampaignData[] = Object.entries(grouped).map(
    ([campaign, rows]) => {
      const details = rows;
      return {
        CampaignName: campaign,
        TotalSpend: _.sumBy(rows, "Payable") ?? 0,
        TotalAgencyCommission: _.sumBy(rows, "AgencyCommission") ?? 0,
        TotalLevyBillable: _.sumBy(rows, "LevyBillable") ?? 0,
        details,
      } as CampaignData;
    }
  );

  return {
    data: processedData.filter((campaign) => campaign.TotalSpend != 0),
    noSpend: processedData.filter((campaign) => campaign.TotalSpend == 0),
  };
};

export function UnbilledTable({ file }: { file: File }) {
  const [data, setData] = useState<CampaignData[] | null>(null);
  const [noSpend, setNoSpend] = useState<CampaignData[] | null>(null);
  useEffect(() => {
    processFile(file).then(({ data, noSpend }) => {
      setData(data);
      setNoSpend(noSpend);
    });
  }, [file]);

  if (!data) {
    return <div>Loading...</div>;
  }

  return (
    <div className="rounded-md border">
      {Object.values(data).map((campaign) => {
        return (
          <Collapsible key={campaign.CampaignName}>
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between p-4 bg-gray-100 w-full">
                <div>
                  <strong>Campaign Name</strong>
                  <br /> {campaign.CampaignName}
                </div>
                <div>
                  <strong>Total Spend:</strong>
                  <br /> {campaign.TotalSpend}
                </div>
                <div>
                  <strong>Total Agency Commission:</strong>
                  <br /> {campaign.TotalAgencyCommission}
                </div>
                <div>
                  <strong>Total Levy Billable:</strong>
                  <br /> {campaign.TotalLevyBillable}
                </div>

                <div>
                  <ChevronsUpDown />
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Media Channel</TableHead>
                    <TableHead>Payable</TableHead>
                    <TableHead>Agency Commission</TableHead>
                    <TableHead>Levy Payable</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.values(campaign.details).map((row, index) => {
                    if (!row) {
                      return null;
                    }

                    return (
                      <TableRow key={row.CampaignName + row.MediaName + index}>
                        <TableCell>{row.MediaName}</TableCell>
                        <TableCell>{row.Payable}</TableCell>
                        <TableCell>{row.AgencyCommission}</TableCell>
                        <TableCell>{row.LevyBillable}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CollapsibleContent>
          </Collapsible>
        );
      })}

      {noSpend && noSpend.length > 0 && (
        <Collapsible>
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between p-4 bg-gray-100 w-full">
              <div className="font-semibold">Campaigns with no spend</div>
              <div>
                <ChevronsUpDown />
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.values(noSpend).map((campaign) => {
                  if (!campaign) {
                    return null;
                  }

                  return (
                    <TableRow key={campaign.CampaignName}>
                      <TableCell>{campaign.CampaignName}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
