"use client";
import { useQuery, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import axios from "axios";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from "recharts";

// ✅ Ensure QueryClient is initialized properly
const queryClient = new QueryClient();

async function fetchCharts() {
  try {
    console.log("Fetching charts data...");
    const res = await fetch("http://localhost:8080/charts");
    if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);
    const data = await res.json();
    console.log("Charts data received:", data); // ✅ Log response
    return data;
  } catch (error) {
    console.error("Error fetching charts:", error);
    throw error;
  }
}

// 🎨 Pie Chart Colors
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#D7263D", "#3F88C5", "#F49D37"];

function DashboardContent() {
  const { data: charts, isLoading, error } = useQuery({
    queryKey: ["charts"],
    queryFn: fetchCharts,
  });

  if (isLoading) return <p>Loading charts...</p>;
  if (error) return <p className="text-red-500">Error: {error.message}</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      <div className="grid grid-cols-2 gap-6">
        {/* ✅ 1️⃣ Bar Chart: Planned Spend vs Budget */}
        {charts?.planned_vs_actual_spend?.length ? (
          <div className="border p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold">Planned vs Actual Spend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={charts.planned_vs_actual_spend}>
                <XAxis dataKey="Month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="TotalPlannedSpend" fill="#6366F1" />
                <Bar dataKey="TotalActualSpend" fill="#F97316" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : <p className="text-gray-500">No data for Planned vs Actual Spend.</p>}

        {/* ✅ 2️⃣ Line Chart: Overall Monthly Spend */}
        {charts?.overall_monthly_spend?.length ? (
          <div className="border p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold">Overall Monthly Spend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={charts.overall_monthly_spend}>
                <XAxis dataKey="Month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="TotalSpend" stroke="#10B981" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : <p className="text-gray-500">No data for Overall Monthly Spend.</p>}

        {/* ✅ 3️⃣ Pie Chart: Campaign Breakdown */}
        {charts?.campaign_breakdown?.length ? (
          <div className="border p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold">Breakdown by campaign</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={charts.campaign_breakdown} dataKey="TotalSpend" nameKey="Campaign">
                  {charts.campaign_breakdown.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : <p className="text-gray-500">No data for Campaign Breakdown.</p>}

        {/* ✅ 4️⃣ Pie Chart: Market Breakdown */}
        {charts?.market_breakdown?.length ? (
          <div className="border p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold">Breakdown by market</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={charts.market_breakdown} dataKey="TotalSpend" nameKey="Market">
                  {charts.market_breakdown.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : <p className="text-gray-500">No data for Market Breakdown.</p>}

        {/* ✅ 5️⃣ Pie Chart: Division Breakdown */}
        {charts?.division_breakdown?.length ? (
          <div className="border p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold">Breakdown by division</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={charts.division_breakdown} dataKey="TotalSpend" nameKey="Division">
                  {charts.division_breakdown.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : <p className="text-gray-500">No data for Division Breakdown.</p>}

        {/* ✅ 6️⃣ Pie Chart: Channel Breakdown */}
        {charts?.channel_breakdown?.length ? (
          <div className="border p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold">Breakdown by channel</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={charts.channel_breakdown} dataKey="TotalSpend" nameKey="Channel">
                  {charts.channel_breakdown.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : <p className="text-gray-500">No data for Channel Breakdown.</p>}

        {/* ✅ 7️⃣ Pie Chart: Monthly Breakdown */}
        {charts?.monthly_breakdown?.length ? (
          <div className="border p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold">Breakdown by month</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={charts.monthly_breakdown} dataKey="TotalSpend" nameKey="Month">
                  {charts.monthly_breakdown.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : <p className="text-gray-500">No data for Monthly Breakdown.</p>}
      </div>
    </div>
  );
}

// ✅ Wrap Dashboard in QueryClientProvider
export default function Dashboard() {
  const [client] = useState(() => queryClient); // ✅ Ensures correct React hydration

  return (
    <QueryClientProvider client={client}>
      <DashboardContent />
    </QueryClientProvider>
  );
}
