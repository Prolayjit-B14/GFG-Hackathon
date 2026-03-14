"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, BarChart2, AlertCircle, BrainCircuit,
  TrendingUp, Users, ShoppingCart, ChevronRight, RotateCcw, Menu, X
} from "lucide-react";

import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import ChartCard from "@/components/ChartCard";
import LoadingAnimation from "@/components/LoadingAnimation";
import StatsBar from "@/components/StatsBar";
import { getHealth } from "@/lib/api";
import { useDashboard } from "@/hooks/useDashboard";
import type { HealthStatus } from "@/lib/types";

// ── Welcome Screen ────────────────────────────────────────────────────────────
function WelcomeScreen({ onExample }: { onExample: (p: string) => void }) {
  const features = [
    { icon: <BrainCircuit size={18} />, title: "AI-Powered Analysis", desc: "Gemini interprets your question and generates instant data insights" },
    { icon: <BarChart2 size={18} />, title: "Smart Chart Selection", desc: "Automatically picks the best visualization for your data" },
    { icon: <TrendingUp size={18} />, title: "Executive Insights", desc: "AI writes business-level conclusions under every chart" },
    { icon: <Users size={18} />, title: "Conversational BI", desc: "Ask follow-up questions to drill deeper into the data" },
  ];

  const examples = [
    { icon: <ShoppingCart size={14} />, q: "Compare average online spend by city tier" },
    { icon: <TrendingUp size={14} />, q: "Correlation between tech savvy score and online orders" },
    { icon: <Users size={14} />, q: "Segment users by shopping preference" },
    { icon: <BarChart2 size={14} />, q: "Which age group spends most online?" },
    { icon: <Sparkles size={14} />, q: "Show heatmap of behavioral correlations" },
    { icon: <ShoppingCart size={14} />, q: "Compare male vs female shopping behavior" },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-full py-12 px-8 text-center">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex justify-center mb-6">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(236,72,153,0.2))",
              border: "1px solid rgba(99,102,241,0.3)",
              boxShadow: "0 0 60px rgba(99,102,241,0.15)",
            }}
          >
            <Sparkles size={36} style={{ color: "#818cf8" }} />
          </div>
        </div>
        <h2 className="text-4xl font-bold mb-3"><span className="gradient-text">InsightGPT</span></h2>
        <p className="text-lg mb-1" style={{ color: "var(--text-secondary)" }}>
          Conversational AI Business Intelligence
        </p>
        <p className="text-sm max-w-md mx-auto" style={{ color: "var(--text-muted)" }}>
          Type a plain English question about customer behaviour data. Get instant interactive dashboards with AI-generated insights.
        </p>
      </motion.div>

      <motion.div
        className="grid grid-cols-2 gap-4 mb-8 max-w-2xl w-full"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
      >
        {features.map((f, i) => (
          <div key={i} className="glass-card p-4 text-left">
            <div className="flex items-center gap-2 mb-1.5">
              <span style={{ color: "#818cf8" }}>{f.icon}</span>
              <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{f.title}</span>
            </div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{f.desc}</p>
          </div>
        ))}
      </motion.div>

      <motion.div
        className="max-w-xl w-full"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
      >
        <p className="text-xs font-semibold mb-3 uppercase" style={{ color: "var(--text-muted)" }}>
          Try these example queries →
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {examples.map((ex, i) => (
            <button
              key={i}
              onClick={() => onExample(ex.q)}
              className="w-full text-left flex items-center gap-3 p-3 rounded-xl transition-all"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
            >
              <span style={{ color: "var(--brand)" }}>{ex.icon}</span>
              <span className="text-xs flex-1">{ex.q}</span>
              <ChevronRight size={12} style={{ color: "var(--text-muted)" }} />
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  const {
    loading, response, history, followupSuggestions, currentQuery,
    dashboardRef, handleQuery, clearHistory, resetDashboard,
  } = useDashboard();

  const [darkMode, setDarkMode] = useState(true);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    getHealth().then(setHealth).catch(() => setHealth(null));
  }, []);

  useEffect(() => {
    document.documentElement.className = darkMode ? "dark" : "light";
  }, [darkMode]);

  return (
    <div className="h-screen flex flex-col" style={{ background: "var(--bg-primary)" }}>
      <Navbar
        darkMode={darkMode}
        onToggleDark={() => setDarkMode(!darkMode)}
        datasetName={health?.dataset_name || "Customer Behaviour"}
        datasetRows={health?.dataset_rows || 0}
        apiReady={!!health?.ai_ready}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Stats bar */}
      <StatsBar />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — collapsible */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 288, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="shrink-0 overflow-hidden"
              style={{ borderRight: "1px solid var(--border)" }}
            >
              <Sidebar
                onSubmit={handleQuery}
                loading={loading}
                history={history}
                followupSuggestions={followupSuggestions}
                onClearHistory={clearHistory}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto relative" style={{ background: "var(--bg-primary)" }}>
          {/* Ambient glow */}
          <div className="fixed top-20 right-20 w-96 h-96 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)", zIndex: 0 }} />
          <div className="fixed bottom-20 left-80 w-64 h-64 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(236,72,153,0.04) 0%, transparent 70%)", zIndex: 0 }} />

          <div className="relative z-10">
            <AnimatePresence mode="wait">
              {loading && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <LoadingAnimation />
                </motion.div>
              )}

              {!loading && !response && (
                <motion.div key="welcome" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <WelcomeScreen onExample={(p) => handleQuery(p)} />
                </motion.div>
              )}

              {!loading && response && (
                <motion.div
                  key="dashboard"
                  ref={dashboardRef}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-6"
                >
                  {/* Error */}
                  {!response.success && (
                    <div
                      className="glass-card p-8 flex flex-col items-center text-center max-w-lg mx-auto mt-12"
                      style={{ borderColor: "rgba(239,68,68,0.3)" }}
                    >
                      <AlertCircle size={40} style={{ color: "#ef4444" }} className="mb-4" />
                      <h3 className="font-semibold text-lg mb-2" style={{ color: "#ef4444" }}>Data Not Available</h3>
                      <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
                        {response.error || "This query could not be processed."}
                      </p>
                      <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
                        Try rephrasing or use an example from the sidebar.
                      </p>
                      <button
                        onClick={resetDashboard}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm btn-brand"
                      >
                        <RotateCcw size={14} /> Try Again
                      </button>
                    </div>
                  )}

                  {/* Success */}
                  {response.success && (
                    <>
                      {/* Header */}
                      <motion.div className="mb-6" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="flex items-start justify-between flex-wrap gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Sparkles size={16} style={{ color: "var(--brand)" }} />
                              <span className="text-xs font-semibold uppercase" style={{ color: "var(--brand)" }}>
                                AI Dashboard
                              </span>
                            </div>
                            <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                              {response.intent || currentQuery || "Business Intelligence Report"}
                            </h2>
                            {currentQuery && (
                              <p className="text-xs mt-0.5 italic" style={{ color: "var(--text-muted)" }}>
                                Query: &ldquo;{currentQuery}&rdquo;
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className="text-[11px] px-3 py-1.5 rounded-full font-mono"
                              style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}
                            >
                              {response.charts?.length} visualization{response.charts?.length !== 1 ? "s" : ""}
                            </span>
                            <button
                              onClick={resetDashboard}
                              className="p-1.5 rounded-lg transition-colors"
                              style={{ background: "var(--bg-card)", color: "var(--text-muted)" }}
                              title="Clear dashboard"
                            >
                              <RotateCcw size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Executive Summary */}
                        {response.summary && (
                          <motion.div
                            className="mt-4 p-4 rounded-xl"
                            style={{
                              background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.06))",
                              border: "1px solid rgba(99,102,241,0.2)",
                            }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                          >
                            <div className="flex items-center gap-2 mb-1.5">
                              <BrainCircuit size={14} style={{ color: "var(--brand)" }} />
                              <span className="text-xs font-semibold" style={{ color: "var(--brand)" }}>
                                Executive Summary
                              </span>
                            </div>
                            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                              {response.summary}
                            </p>
                          </motion.div>
                        )}
                      </motion.div>

                      {/* Charts Grid */}
                      <motion.div
                        className="grid gap-5"
                        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(460px, 1fr))" }}
                      >
                        {response.charts?.map((chart, i) => (
                          <ChartCard key={chart.id || i} chart={chart} index={i} />
                        ))}
                      </motion.div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
