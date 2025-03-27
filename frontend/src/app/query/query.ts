export async function callPandasAgent(query: string) {
  if (!query) {
    throw new Error("Query parameter is required");
  }

  try {
    const host = "https://aiquery.azurewebsites.net/api/AIQUERY";
    const url = `${host}?query=${encodeURIComponent(query)}`;


    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    // Handle errors from the Azure Function
    if (!response.ok) {
      throw new Error(data.error || "Error fetching data from Azure Function");
    }

    return data;
  } catch (error) {
    console.error("Error calling Azure Function:", error);
    throw new Error("Error calling Azure Function");
  }
}
