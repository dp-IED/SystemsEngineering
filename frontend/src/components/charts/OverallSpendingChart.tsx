"use client"

import { Pie, PieChart, Cell, Legend } from "recharts"

import { ChartContainer, ChartTooltipContent, ChartTooltip, ChartConfig } from "@/components/ui/chart"
import { Card, CardContent } from "../ui/card"
import { Label } from "../ui/label"
import { Campaign } from "../dashboard/page"

type ChartType = "Campaign" | "Market" | "Division" | "Channel" | "Month"

type BarChartProps = {
  chartData: Campaign[];
}

export function OverallSpendingChart(props: BarChartProps) {
  const {chartData} = props;


  // Define chart colors
  const CHART_COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
    'hsl(var(--chart-6))',
    'hsl(var(--chart-7))',
    'hsl(var(--chart-8))'
  ];
  
  // Filter out campaigns with zero invoice values
  const filteredData = chartData
  .map((campaign) => ({ 
    campaign: campaign.name, 
    spending: campaign.financials.invoiceVal 
  }))
  .filter(item => item.spending > 0); // Only keep items with value greater than 0
  
  // Dynamically generate chartConfig based on filteredData
  const dynamicChartConfig: ChartConfig = {
    // Add a main property for the chart
    spending: {
      label: "Spending",
    },
    // Add properties for each campaign
    ...filteredData.reduce((config, item, index) => {
      // Create a key from the campaign name (make it URL-safe)
      const key = item.campaign.toLowerCase().replace(/\s+/g, '_');
      
      return {
        ...config,
        [key]: {
          label: item.campaign,
          color: CHART_COLORS[index % CHART_COLORS.length]
        }
      };
    }, {})
  };

  // Define an array of colors for the pie segments
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#6A7FDB'];

  const by: ChartType = "Campaign";

  if (by === "Campaign") {
    
    return (
      <Card className="p-4 w-full align-middle justify-center space-y-10">
        <CardContent>
        <Label className="text-lg font-semibold"> {`Overall Spending by ${by}`}</Label>
        <ChartContainer config={dynamicChartConfig} className="h-[385px] w-full">
          <PieChart accessibilityLayer>
            <ChartTooltip content={<ChartTooltipContent />} />
            <Pie
              data={filteredData} 
              label
              dataKey="spending" 
              nameKey="campaign" 
              cx="50%" 
              cy="50%" 
              outerRadius={100}
            >
              {filteredData.map((entry, index) => (
                <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]} 
                />
              ))}
            </Pie>
            <Legend />
          </PieChart>
        </ChartContainer>
        </CardContent>
      </Card>
    )
  }
}
