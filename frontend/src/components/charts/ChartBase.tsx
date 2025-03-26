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

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    return <p>Loading chart...</p>;
  }

  if (!data || data.length === 0) {
    return <p>No data available for the selected graph type.</p>;
  }

  // Define chart configuration dynamically based on graphType
  const chartConfig = (() => {
    switch (props.graphType) {
      case "bar_chart":
        return {
          TotalPlannedSpend: {
            label: "Planned Spend",
            color: "#1f77b4",
          },
          TotalActualSpend: {
            label: "Actual Spend",
            color: "#ff7f0e",
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

  // Determine the dataKey dynamically based on the graphType.
  // For campaign pie chart we use "Campaign" for the name on the pie.
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

  // Filter out invalid entries, empty values, and rows with 0 TotalSpend,
  // if TotalSpend exists and should be non-zero.
  const filterInvalidValues = (
    data: { [key: string]: number | string }[],
    key: string
  ) => {
    return data.filter((item) => {
      if (item[key] === undefined || item[key] === null || item[key] === "") {
        return false;
      }
      // Exclude rows where TotalSpend is 0 (if TotalSpend is numeric)
      if (
        props.graphType.startsWith("pie_chart") &&
        typeof item["TotalSpend"] === "number" &&
        item["TotalSpend"] === 0
      ) {
        return false;
      }
      // Exclude "Total" rows for specific graph types.
      if (
        (props.graphType === "pie_chart_monthly" ||
          props.graphType === "pie_chart_channel" ||
          (props.graphType === "line_chart" && key === "Month")) &&
        item[key] === "Total"
      ) {
        return false;
      }
      return true;
    });
  };

  let processedData = filterInvalidValues(data, dataKey);

  // Sort the data for the line chart based on calendar months.
  if (props.graphType === "line_chart") {
    const monthOrder = [
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
    processedData = processedData.sort((a, b) => {
      const aValue = a[dataKey] as string;
      const bValue = b[dataKey] as string;
      return monthOrder.indexOf(aValue) - monthOrder.indexOf(bValue);
    });
  }

  // Render the appropriate chart based on graphType.
  const renderChart = () => {
    switch (props.graphType) {
      case "bar_chart":
        return (
          <BarChart data={processedData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={dataKey}
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis />
            <Legend />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />}
            />
            <Bar
              dataKey="TotalPlannedSpend"
              fill={chartConfig["TotalPlannedSpend"]?.color ?? "#cccccc"}
              radius={4}
            />
            <Bar
              dataKey="TotalActualSpend"
              fill={chartConfig["TotalActualSpend"]?.color ?? "#dddddd"}
              radius={4}
            />
          </BarChart>
        );
      case "line_chart":
        return (
          <LineChart data={processedData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={dataKey}
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis />
            <Legend />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />}
            />
            <Line
              type="monotone"
              dataKey="TotalSpend"
              stroke={chartConfig["TotalSpend"]?.color ?? "hsl(var(--chart-1))"}
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
            <Legend />
          </PieChart>
        );
      default:
        return <p>Invalid graph type.</p>;
    }
  };

  // Set a dynamic title based on graphType.
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
        {/* @ts-expect-error: ChartContainer config prop does not match the inferred type */}
        <ChartContainer config={chartConfig}>{renderChart()}</ChartContainer>
      </CardContent>
    </Card>
  );
}
