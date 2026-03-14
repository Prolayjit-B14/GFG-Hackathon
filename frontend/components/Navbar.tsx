"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Upload, Moon, Sun, Activity, Sparkles, Database, Menu
} from "lucide-react";
import { uploadCSV } from "@/lib/api";
import toast from "react-hot-toast";

interface NavbarProps {
  darkMode: boolean;
  onToggleDark: () => void;
  datasetName: string;
  datasetRows: number;
  apiReady: boolean;
  onToggleSidebar?: () => void;
}

export default function Navbar({
  darkMode, onToggleDark, datasetName, datasetRows, apiReady, onToggleSidebar
}: NavbarProps) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadCSV(file);
      toast.success(`✅ ${file.name} loaded — ${result.rows} rows, ${result.columns.length} columns`);
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Upload failed";
      toast.error(msg);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{ borderColor: "var(--border)", background: "rgba(9,9,15,0.85)", backdropFilter: "blur(20px)" }}
    >
      <div className="flex items-center justify-between px-6 py-3">
        {/* Logo */}
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="relative">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center btn-brand shadow-lg">
              <Sparkles size={18} />
            </div>
            <div
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2"
              style={{
                background: apiReady ? "#10b981" : "#f59e0b",
                borderColor: "var(--bg-primary)",
                boxShadow: `0 0 8px ${apiReady ? "#10b981" : "#f59e0b"}`,
              }}
            />
          </div>
        {/* Sidebar toggle */}
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="w-8 h-8 rounded-lg flex items-center justify-center mr-2 transition-colors"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
              title="Toggle sidebar"
            >
              <Menu size={15} />
            </button>
          )}
          <div>
            <h1 className="font-bold text-base tracking-tight gradient-text">InsightGPT</h1>
            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>AI Business Intelligence</p>
          </div>
        </motion.div>

        {/* Center: Dataset Status */}
        <motion.div
          className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Database size={14} style={{ color: "var(--brand)" }} />
          <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
            {datasetName || "No dataset"}
          </span>
          {datasetRows > 0 && (
            <span
              className="text-[11px] px-2 py-0.5 rounded-full font-mono"
              style={{ background: "rgba(99,102,241,0.15)", color: "var(--brand-light)" }}
            >
              {datasetRows.toLocaleString()} rows
            </span>
          )}
          <div className="flex items-center gap-1">
            <Activity size={12} style={{ color: apiReady ? "#10b981" : "#f59e0b" }} />
            <span className="text-[11px]" style={{ color: apiReady ? "#10b981" : "#f59e0b" }}>
              {apiReady ? "AI Ready" : "Connecting..."}
            </span>
          </div>
        </motion.div>

        {/* Right: Actions */}
        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            {uploading ? (
              <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload size={15} />
            )}
            <span className="hidden sm:inline">{uploading ? "Uploading..." : "Upload CSV"}</span>
          </button>

          <button
            onClick={onToggleDark}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
            title="Toggle theme"
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </motion.div>
      </div>
    </header>
  );
}
