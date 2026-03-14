"use client";

import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import type { ChartData } from "@/lib/types";

// ── Custom angled tick for XAxis ─────────────────────────────────────────────
const AngleTick = ({ x, y, payload }: { x?: number; y?: number; payload?: { value: unknown } }) => (
  <g transform={`translate(${x ?? 0},${y ?? 0})`}>
    <text
      x={0} y={0} dy={8}
      textAnchor="end"
      fill="#64748b"
      fontSize={11}
      transform="rotate(-35)"
    >
      {String(payload?.value ?? "").slice(0, 16)}
    </text>
  </g>
);

const COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981",
  "#3b82f6", "#ef4444", "#14b8a6", "#f97316", "#84cc16"
];

// ── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: {
  active?: boolean; payload?: Array<{ name: string; value: number; color: string; dataKey: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl p-3 text-xs"
      style={{
        background: "rgba(15,15,26,0.97)",
        border: "1px solid rgba(99,102,241,0.4)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        backdropFilter: "blur(12px)",
        maxWidth: 220,
      }}
    >
      {label && <p className="font-semibold mb-1.5" style={{ color: "#f1f5f9" }}>{String(label)}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mb-0.5">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: p.color }} />
          <span style={{ color: "#94a3b8" }}>{p.name || p.dataKey}:</span>
          <span className="font-mono font-semibold" style={{ color: "#f1f5f9" }}>
            {typeof p.value === "number" ? p.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : String(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

// ── Axis style helpers ────────────────────────────────────────────────────────
const axisStyle = { fontSize: 11, fill: "#64748b" };
const gridStyle = { stroke: "rgba(255,255,255,0.04)", strokeDasharray: "4 4" };

// ─────────────────────────────────────────────────────────────────────────────
// BAR CHART
// ─────────────────────────────────────────────────────────────────────────────
export function BarChartComponent({ chart }: { chart: ChartData }) {
  const { data, config } = chart;
  const xKey = config.xKey || "name";
  const yKeys = config.yKeys || ["value"];
  const colors = config.colors || COLORS;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
        <CartesianGrid {...gridStyle} />
        <XAxis
          dataKey={xKey}
          tick={<AngleTick />}
          interval={0}
          height={60}
        />
        <YAxis tick={axisStyle} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8", paddingTop: 8 }} />
        {yKeys.map((key, i) => (
          <Bar key={key} dataKey={key} fill={colors[i % colors.length]} radius={[4, 4, 0, 0]} maxBarSize={60} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LINE CHART
// ─────────────────────────────────────────────────────────────────────────────
export function LineChartComponent({ chart }: { chart: ChartData }) {
  const { data, config } = chart;
  const xKey = config.xKey || "name";
  const yKeys = config.yKeys || ["value"];
  const colors = config.colors || COLORS;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
        <CartesianGrid {...gridStyle} />
        <XAxis dataKey={xKey} tick={<AngleTick />} height={60} />
        <YAxis tick={axisStyle} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8", paddingTop: 8 }} />
        {yKeys.map((key, i) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={colors[i % colors.length]}
            strokeWidth={2.5}
            dot={{ r: 4, fill: colors[i % colors.length] }}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCATTER PLOT
// ─────────────────────────────────────────────────────────────────────────────
export function ScatterPlotComponent({ chart }: { chart: ChartData }) {
  const { data, config } = chart;
  const xKey = config.xKey || "x";
  const yKey = config.yKey || "y";
  const corr = config.correlation;

  return (
    <div>
      {corr !== undefined && corr !== null && (
        <div
          className="text-center text-xs mb-2 px-3 py-1.5 rounded-lg inline-block"
          style={{
            background: Math.abs(corr) > 0.5 ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.05)",
            color: Math.abs(corr) > 0.5 ? "#818cf8" : "#94a3b8",
            border: `1px solid ${Math.abs(corr) > 0.5 ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.1)"}`,
          }}
        >
          Pearson r = <strong>{corr.toFixed(3)}</strong>
          &nbsp;·&nbsp;
          {Math.abs(corr) > 0.7 ? "🔥 Strong" : Math.abs(corr) > 0.4 ? "📈 Moderate" : "📊 Weak"} correlation
        </div>
      )}
      <ResponsiveContainer width="100%" height={280}>
        <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
          <CartesianGrid {...gridStyle} />
          <XAxis dataKey={xKey} name={xKey} tick={axisStyle} label={{ value: xKey, position: "insideBottom", offset: -5, style: axisStyle }} />
          <YAxis dataKey={yKey} name={yKey} tick={axisStyle} label={{ value: yKey, angle: -90, position: "insideLeft", style: axisStyle }} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3", stroke: "rgba(99,102,241,0.3)" }}
            content={<CustomTooltip />}
          />
          <Scatter data={data} fill="#6366f1" fillOpacity={0.7} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PIE CHART
// ─────────────────────────────────────────────────────────────────────────────
const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {
  cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; percent: number;
}) => {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="600">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function PieChartComponent({ chart }: { chart: ChartData }) {
  const { data, config } = chart;
  const nameKey = config.nameKey || "name";
  const valueKey = config.valueKey || "value";
  const colors = config.colors || COLORS;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={110}
          dataKey={valueKey}
          nameKey={nameKey}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => <span style={{ fontSize: 12, color: "#94a3b8" }}>{String(value)}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HISTOGRAM
// ─────────────────────────────────────────────────────────────────────────────
export function HistogramComponent({ chart }: { chart: ChartData }) {
  const { data, config } = chart;
  const xKey = config.xKey || "range";
  const yKey = config.yKey || config.yKeys?.[0] || "count";
  const color = config.color || "#6366f1";

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
        <CartesianGrid {...gridStyle} />
        <XAxis dataKey={xKey} tick={<AngleTick />} height={70} interval={2} />
        <YAxis tick={axisStyle} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey={yKey} fill={color} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HEATMAP (D3-style via SVG)
// ─────────────────────────────────────────────────────────────────────────────
export function HeatmapComponent({ chart }: { chart: ChartData }) {
  const { data, config } = chart;
  const columns = config.columns || [];

  if (!columns.length || !data.length) return <div className="text-center text-sm py-8" style={{ color: "var(--text-muted)" }}>No heatmap data</div>;

  const getColor = (val: number) => {
    const abs = Math.abs(val);
    if (val > 0.6) return `rgba(99,102,241,${0.4 + abs * 0.5})`;
    if (val > 0.3) return `rgba(99,102,241,${0.2 + abs * 0.3})`;
    if (val < -0.3) return `rgba(236,72,153,${0.2 + abs * 0.3})`;
    if (val < -0.6) return `rgba(236,72,153,${0.4 + abs * 0.5})`;
    return "rgba(255,255,255,0.05)";
  };

  const cellSize = Math.min(44, Math.floor(360 / columns.length));
  const labelSize = 80;

  return (
    <div className="overflow-x-auto pb-2">
      <div style={{ display: "inline-block", minWidth: labelSize + columns.length * cellSize + 16 }}>
        {/* Column headers */}
        <div style={{ display: "flex", marginLeft: labelSize }}>
          {columns.map((col) => (
            <div
              key={col}
              style={{
                width: cellSize, fontSize: 9, color: "#64748b", textAlign: "center",
                overflow: "hidden", transform: "rotate(-40deg)", transformOrigin: "bottom left",
                whiteSpace: "nowrap", marginBottom: 24
              }}
            >
              {col.replace(/_/g, " ")}
            </div>
          ))}
        </div>
        {/* Rows */}
        {columns.map((rowCol) => (
          <div key={rowCol} style={{ display: "flex", alignItems: "center", marginBottom: 2 }}>
            <div style={{ width: labelSize, fontSize: 9, color: "#64748b", textAlign: "right", paddingRight: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {rowCol.replace(/_/g, " ")}
            </div>
            {columns.map((colCol) => {
              const cell = data.find(d => d.x === colCol && d.y === rowCol);
              const val = cell ? Number(cell.value) : 0;
              return (
                <div
                  key={colCol}
                  title={`${rowCol} × ${colCol}: ${val.toFixed(3)}`}
                  style={{
                    width: cellSize, height: cellSize,
                    background: getColor(val),
                    border: "1px solid rgba(255,255,255,0.04)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: cellSize > 36 ? 9 : 7, color: "#fff",
                    cursor: "default",
                    transition: "opacity 0.2s",
                    borderRadius: 3,
                  }}
                >
                  {Math.abs(val) > 0.2 ? val.toFixed(2) : ""}
                </div>
              );
            })}
          </div>
        ))}
        {/* Legend */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: labelSize, marginTop: 8 }}>
          <span style={{ fontSize: 9, color: "#64748b" }}>-1</span>
          <div style={{ flex: 1, height: 8, borderRadius: 4, background: "linear-gradient(to right, rgba(236,72,153,0.6), rgba(255,255,255,0.05), rgba(99,102,241,0.8))" }} />
          <span style={{ fontSize: 9, color: "#64748b" }}>+1</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI CARD
// ─────────────────────────────────────────────────────────────────────────────
export function KPICardComponent({ chart }: { chart: ChartData }) {
  const { data, title } = chart;
  const kpiData = data[0];
  const value = kpiData?.value ?? kpiData?.kpi_value ?? 0;
  const label = kpiData?.label ?? title;

  return (
    <div className="kpi-card flex flex-col items-center justify-center py-8">
      <p className="text-sm mb-2" style={{ color: "var(--text-secondary)" }}>{String(label)}</p>
      <p
        className="text-5xl font-bold font-mono"
        style={{ background: "linear-gradient(135deg, #6366f1, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
      >
        {typeof value === "number"
          ? value > 10000
            ? `₹${(value / 1000).toFixed(1)}K`
            : value.toLocaleString(undefined, { maximumFractionDigits: 2 })
          : String(value)}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHART ROUTER
// ─────────────────────────────────────────────────────────────────────────────
export function ChartRouter({ chart }: { chart: ChartData }) {
  switch (chart.type) {
    case "bar": return <BarChartComponent chart={chart} />;
    case "line": return <LineChartComponent chart={chart} />;
    case "scatter": return <ScatterPlotComponent chart={chart} />;
    case "pie": return <PieChartComponent chart={chart} />;
    case "heatmap": return <HeatmapComponent chart={chart} />;
    case "histogram": return <HistogramComponent chart={chart} />;
    case "kpi_card": return <KPICardComponent chart={chart} />;
    default: return <BarChartComponent chart={chart} />;
  }
}
