"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Download, FileText, Image, Table, Maximize2, Minimize2, Lightbulb } from "lucide-react";
import toast from "react-hot-toast";
import type { ChartData } from "@/lib/types";
import { ChartRouter } from "./charts/ChartComponents";
import { exportCSVData } from "@/lib/api";

interface ChartCardProps {
  chart: ChartData;
  index: number;
}

export default function ChartCard({ chart, index }: ChartCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showInsight, setShowInsight] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);

  const typeColors: Record<string, string> = {
    bar: "#6366f1", line: "#8b5cf6", scatter: "#ec4899",
    pie: "#f59e0b", heatmap: "#10b981", histogram: "#3b82f6", kpi_card: "#14b8a6"
  };
  const color = typeColors[chart.type] || "#6366f1";

  const handleExportCSV = async () => {
    if (!chart.data?.length) { toast.error("No data to export"); return; }
    try {
      const csv = await exportCSVData(chart.data as Record<string, unknown>[], chart.title.replace(/\s+/g, "_"));
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${chart.title.replace(/\s+/g, "_")}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exported!");
    } catch {
      toast.error("Export failed");
    }
  };

  const handleExportPNG = async () => {
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current!, { backgroundColor: "#0f0f1a", scale: 2 });
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `${chart.title.replace(/\s+/g, "_")}.png`;
      a.click();
      toast.success("PNG exported!");
    } catch {
      toast.error("PNG export failed. Try a different browser.");
    }
  };

  const handleExportPDF = async () => {
    try {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;
      const canvas = await html2canvas(cardRef.current!, { backgroundColor: "#0f0f1a", scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [canvas.width / 2, canvas.height / 2] });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`${chart.title.replace(/\s+/g, "_")}.pdf`);
      toast.success("PDF exported!");
    } catch {
      toast.error("PDF export failed.");
    }
  };

  if (chart.error && !chart.data?.length) {
    return (
      <motion.div
        className="glass-card p-6 col-span-1"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.08 }}
      >
        <div className="text-center">
          <p className="font-semibold mb-2" style={{ color: "#f59e0b" }}>Data Not Available</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{chart.error}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={cardRef}
      className={`glass-card flex flex-col ${expanded ? "col-span-2 row-span-2" : ""}`}
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      layout
    >
      {/* Card Header */}
      <div className="flex items-start justify-between p-5 pb-3">
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full"
              style={{
                background: `${color}20`,
                color: color,
                border: `1px solid ${color}40`,
              }}
            >
              {chart.type.replace("_", " ")}
            </span>
          </div>
          <h3 className="font-semibold text-sm leading-snug" style={{ color: "var(--text-primary)" }}>
            {chart.title}
          </h3>
          {chart.analysis && (
            <p className="text-[11px] mt-0.5 line-clamp-1" style={{ color: "var(--text-muted)" }}>
              {chart.analysis}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setShowInsight(!showInsight)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: showInsight ? `${color}20` : "transparent", color: showInsight ? color : "var(--text-muted)" }}
            title="Toggle insight"
          >
            <Lightbulb size={13} />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: "var(--bg-card)", color: "var(--text-muted)" }}
            title="Expand"
          >
            {expanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="px-3 flex-1">
        <ChartRouter chart={chart} />
      </div>

      {/* Insight */}
      {showInsight && chart.insight && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mx-4 mb-4 mt-2 p-3 rounded-xl text-xs leading-relaxed"
          style={{
            background: `${color}0d`,
            border: `1px solid ${color}25`,
            color: "var(--text-secondary)",
          }}
        >
          <span className="font-semibold" style={{ color }}>💡 Insight: </span>
          {chart.insight}
        </motion.div>
      )}

      {/* Export Row */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-t"
        style={{ borderColor: "var(--border)" }}
      >
        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
          {chart.data?.length?.toLocaleString()} data points
        </span>
        <div className="flex items-center gap-1">
          <button onClick={handleExportCSV} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] transition-colors" style={{ background: "var(--bg-card)", color: "var(--text-secondary)" }} title="Export CSV">
            <Table size={10} /> CSV
          </button>
          <button onClick={handleExportPNG} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] transition-colors" style={{ background: "var(--bg-card)", color: "var(--text-secondary)" }} title="Export PNG">
            <Image size={10} /> PNG
          </button>
          <button onClick={handleExportPDF} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] transition-colors" style={{ background: "var(--bg-card)", color: "var(--text-secondary)" }} title="Export PDF">
            <FileText size={10} /> PDF
          </button>
        </div>
      </div>
    </motion.div>
  );
}
