"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

import { ChartContainer, ChartConfig } from "@/components/ui/chart"
import { Card, CardContent } from "../ui/card"
import { Label } from "../ui/label"
import { Campaign } from "../dashboard/parseExcelData"

type BarChartProps = {
  chartData: Campaign[];
}

export function BudgetvsActualChart(props: BarChartProps) {
  const { chartData } = props;

  // Define chart colors
  const ACTUAL_COLOR = 'hsl(var(--chart-1))';
  const BUDGET_COLOR = 'hsl(var(--chart-2))';
  
  // Format currency in GBP
  const formatGBP = (value: number) => {
    return new Intl.NumberFormat('en-GB', { 
      style: 'currency', 
      currency: 'GBP' 
    }).format(value);
  };
  
  // Format compact numbers for axis labels
  const formatCompact = (value: number) => {
    return new Intl.NumberFormat('en-GB', { 
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1
    }).format(value);
  };
  
  // Filter out campaigns with zero values and prepare data for comparison
  const filteredData = chartData
    .filter(campaign => 
      campaign.financials.invoiceVal > 0 || 
      campaign.financials.totalBudget > 0
    )
    .map((campaign) => ({ 
      name: campaign.name.length > 15 ? campaign.name.substring(0, 15) + '...' : campaign.name, // Truncate long names
      actual: campaign.financials.invoiceVal,
      budget: campaign.financials.totalBudget,
      remaining: campaign.financials.totalBudget - campaign.financials.invoiceVal
    }))
    .sort((a, b) => b.budget - a.budget) // Sort by budget size (descending)
    .slice(0, 10); // Limit to top 10 campaigns for readability
  // Calculate totals for the title
  const totalActual = chartData.reduce((sum, campaign) => sum + campaign.financials.invoiceVal, 0);
  const totalBudget = chartData.reduce((sum, campaign) => sum + campaign.financials.totalBudget, 0);
  const percentageUsed = totalBudget > 0 ? Math.round((totalActual / totalBudget) * 100) : 0;
  const remainingBudget = totalBudget - totalActual;
  
  // Dynamically generate chartConfig
  const dynamicChartConfig: ChartConfig = {
    actual: {
      label: "Actual Spend",
      color: ACTUAL_COLOR
    },
    budget: {
      label: "Total Budget",
      color: BUDGET_COLOR
    }
  };

  return (
    <Card className="p-4 w-full align-middle justify-center">
      <CardContent>
        <div className="flex flex-col space-y-2 mb-4">
          <Label className="text-lg font-semibold">Total Budget vs Actual Spend</Label>
          <div className="text-sm text-muted-foreground text-right">
            <span className="font-medium">{percentageUsed}% of budget used ({formatGBP(totalActual)})</span>
            <br/> 
            Budget: {formatGBP(totalBudget)}
            <br/> 
            Remaining: {formatGBP(remainingBudget)}
          </div>
        </div>
        
        <ChartContainer config={dynamicChartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={filteredData}
              layout="vertical"
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" tickFormatter={(value) => formatCompact(value)} />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip 
                formatter={(value, name) => [
                  formatGBP(Number(value)), 
                  name === "budget" ? "Total Budget" : "Actual Spend"
                ]} 
                labelFormatter={(label) => `Campaign: ${label}`}
              />
              <Bar dataKey="budget" fill={BUDGET_COLOR} name="Total Budget" />
              <Bar dataKey="actual" fill={ACTUAL_COLOR} name="Actual Spend" />
              <Legend/>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
