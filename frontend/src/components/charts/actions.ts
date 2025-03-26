import { GraphType } from "./ChartBase";

export default async function fetchKustoData(graphType: GraphType) {
  // Use the deployed URL as the base API URL
  const apibase = "https://finsyncadxgraphs.azurewebsites.net/api/adxGraph";
  if (graphType) {
    try {
      const response = await fetch(apibase + `?type=${graphType}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json(); // Parse JSON response
      console.log("data", data);
      return {
        status: "ok",
        data: data,
      };
    } catch (error) {
      console.error("Failed to fetch data:", error);
      return {
        status: "error",
        error: error,
      };
    }
  } else {
    return {
      status: "error",
      error: `Invalid GraphType ${graphType}`,
    };
  }
}
