"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  Legend,
} from "recharts";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import fetchKustoData from "./actions";

export type GraphType =
  | "bar_chart"
  | "line_chart"
  | "pie_chart_campaign"
  | "pie_chart_market"
  | "pie_chart_division"
  | "pie_chart_channel"
  | "pie_chart_monthly";

export default function GraphBase(props: { graphType: GraphType }) {
  const [data, setData] = useState<{ [key: string]: number | string }[]>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchKustoData(props.graphType)
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setLoading(false);
      });
  }, [props.graphType]);

  if (loading) {
    return <p>Loading chart...</p>; // Show a loading message while data is being fetched
  }

  if (!data || data.length === 0) {
    return <p>No data available for the selected graph type.</p>; // Show a fallback message if no data is available
  }

  // Define chart configuration dynamically based on graphType
  const chartConfig = (() => {
    switch (props.graphType) {
      case "bar_chart":
        return {
          TotalPlannedSpend: {
            label: "Planned Spend",
            color: "hsl(var(--chart-1))",
          },
          TotalActualSpend: {
            label: "Actual Spend",
            color: "hsl(var(--chart-2))",
          },
        } satisfies ChartConfig;
      case "line_chart":
        return {
          TotalSpend: {
            label: "Total Spend",
            color: "hsl(var(--chart-1))",
          },
        } satisfies ChartConfig;
      case "pie_chart_campaign":
      case "pie_chart_market":
      case "pie_chart_division":
      case "pie_chart_channel":
      case "pie_chart_monthly":
        return {
          TotalSpend: {
            label: "Total Spend",
            color: "hsl(var(--chart-1))",
          },
        } satisfies ChartConfig;
      default:
        return {};
    }
  })();

  // Determine the dataKey dynamically based on graphType
  const dataKey = (() => {
    switch (props.graphType) {
      case "bar_chart":
        return "Market";
      case "line_chart":
        return "Month";
      case "pie_chart_campaign":
        return "Campaign";
      case "pie_chart_market":
        return "Market";
      case "pie_chart_division":
        return "Division";
      case "pie_chart_channel":
        return "Channel";
      case "pie_chart_monthly":
        return "Month";
      default:
        return "dataKey not defined";
    }
  })();

  // Filter out invalid or undefined values and exclude "Total" for specific graph types
  const filterInvalidValues = (
    data: { [key: string]: number | string }[],
    key: string
  ) => {
    return data.filter((item) => {
      // Exclude rows with undefined, null, or empty values
      if (
        item[key] === undefined ||
        item[key] === null ||
        item[key] === ""
      ) {
        return false;
      }

      // Exclude "Total" row for pie_chart_monthly and pie_chart_channel
      if (
        (props.graphType === "pie_chart_monthly" ||
          props.graphType === "pie_chart_channel") &&
        item[key] === "Total"
      ) {
        return false;
      }

      return true;
    });
  };

  const processedData = filterInvalidValues(data, dataKey);

  // Render the appropriate chart based on graphType
  const renderChart = () => {
    switch (props.graphType) {
      case "bar_chart":
        return (
          <BarChart accessibilityLayer data={processedData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={dataKey}
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis />
            <Legend/>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />}
            />
            <Bar
              dataKey="TotalPlannedSpend"
              fill="var(--color-planned-spend)"
              radius={4}
            />
            <Bar
              dataKey="TotalActualSpend"
              fill="var(--color-actual-spend)"
              radius={4}
            />
          </BarChart>
        );
      case "line_chart":
        return (
          <LineChart accessibilityLayer data={processedData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={dataKey}
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis />
            <Legend/>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />}
            />
            <Line
              type="monotone"
              dataKey="TotalSpend"
              stroke="hsl(var(--chart-1))" // Fixed stroke color
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        );
      case "pie_chart_campaign":
      case "pie_chart_market":
      case "pie_chart_division":
      case "pie_chart_channel":
      case "pie_chart_monthly":
        return (
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />}
            />
            <Pie
              data={processedData}
              dataKey="TotalSpend"
              nameKey={dataKey}
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="var(--color-total-spend)"
            >
              {processedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`hsl(var(--chart-${(index % 6) + 1}))`}
                />
              ))}
            </Pie>
            <Legend/>
          </PieChart>
        );
      default:
        return <p>Invalid graph type.</p>;
    }
  };

  // Dynamic title based on graphType
  const title = (() => {
    switch (props.graphType) {
      case "bar_chart":
        return "Bar Chart - Market Spend";
      case "line_chart":
        return "Line Chart - Monthly Spend";
      case "pie_chart_campaign":
        return "Pie Chart - Campaign Spend";
      case "pie_chart_market":
        return "Pie Chart - Market Spend";
      case "pie_chart_division":
        return "Pie Chart - Division Spend";
      case "pie_chart_channel":
        return "Pie Chart - Channel Spend";
      case "pie_chart_monthly":
        return "Pie Chart - Monthly Spend";
      default:
        return "Chart";
    }
  })();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>{renderChart()}</ChartContainer>
      </CardContent>
    </Card>
  );
}
