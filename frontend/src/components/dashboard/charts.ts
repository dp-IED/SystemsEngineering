import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

const API_BASE = "http://localhost:8080/"; // FastAPI Backend

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const response = await axios.get(`${API_BASE}/charts`);
    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch chart data" });
  }
}