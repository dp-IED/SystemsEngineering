import { GraphType } from "./ChartBase";

export default async function fetchKustoData(graphType: GraphType) {
  // const apibase = "http://localhost:7071/api/adxGraph"; // dev

  const apibase = "https://finsyncadxgraphs.azurewebsites.net/adxGraph"; // prod
  if (graphType) {
    try {
      const requesturl = new URL(apibase);
      requesturl.searchParams.append("type", graphType);
      console.log("requesturl", requesturl);
      const response = await fetch(requesturl.toString());
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
