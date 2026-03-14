import axios from "axios";
import type { DashboardResponse, DatasetInfo, HealthStatus } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 90000, // 90s for AI processing
});

export async function generateDashboard(
  prompt: string,
  isFollowup = false
): Promise<DashboardResponse> {
  const { data } = await api.post("/api/generate-dashboard", {
    prompt,
    is_followup: isFollowup,
  });
  return data;
}

export async function uploadCSV(file: File): Promise<{ success: boolean; rows: number; columns: string[] }> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post("/api/upload-csv", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function getDatasetInfo(): Promise<DatasetInfo> {
  const { data } = await api.get("/api/dataset-info");
  return data;
}

export async function getHealth(): Promise<HealthStatus> {
  const { data } = await api.get("/api/health");
  return data;
}

export async function getExamplePrompts(): Promise<{ prompts: string[] }> {
  const { data } = await api.get("/api/example-prompts");
  return data;
}

export async function exportCSVData(
  chartData: Record<string, unknown>[],
  filename: string
): Promise<string> {
  const { data } = await api.post("/api/export-csv", {
    format: "csv",
    data: chartData,
    filename,
  });
  return data.csv_content;
}
