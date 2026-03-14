// TypeScript interfaces for InsightGPT BI Dashboard

export interface ChartConfig {
  xKey?: string;
  yKeys?: string[];
  yKey?: string;
  colors?: string[];
  stacked?: boolean;
  showGrid?: boolean;
  showDots?: boolean;
  smooth?: boolean;
  nameKey?: string;
  valueKey?: string;
  colorKey?: string | null;
  correlation?: number | null;
  colorScale?: string[];
  minVal?: number;
  maxVal?: number;
  columns?: string[];
  color?: string;
}

export type ChartType = "bar" | "line" | "scatter" | "pie" | "heatmap" | "histogram" | "kpi_card";

export interface ChartData {
  id: string;
  type: ChartType;
  title: string;
  data: Record<string, unknown>[];
  config: ChartConfig;
  insight: string;
  error?: string;
  analysis?: string;
}

export interface DashboardResponse {
  success: boolean;
  intent?: string;
  summary?: string;
  charts?: ChartData[];
  followup_suggestions?: string[];
  error?: string;
  message?: string;
  query?: string;
}

export interface QueryHistoryItem {
  id: string;
  prompt: string;
  timestamp: Date;
  success: boolean;
  chartCount: number;
}

export interface DatasetInfo {
  loaded: boolean;
  name?: string;
  rows?: number;
  columns?: string[];
  column_info?: Record<string, ColumnInfo>;
}

export interface ColumnInfo {
  type: "numeric" | "categorical";
  min?: number;
  max?: number;
  mean?: number;
  unique?: number;
  unique_values?: string[];
  unique_count?: number;
}

export interface HealthStatus {
  api: string;
  dataset_loaded: boolean;
  ai_ready: boolean;
  dataset_rows: number;
  dataset_name: string;
}
