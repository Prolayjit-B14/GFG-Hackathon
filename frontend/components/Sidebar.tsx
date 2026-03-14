"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Sparkles, History, MessageSquare, ChevronDown, ChevronRight, Zap, BarChart2
} from "lucide-react";
import type { QueryHistoryItem } from "@/lib/types";

interface SidebarProps {
  onSubmit: (prompt: string, isFollowup: boolean) => void;
  loading: boolean;
  history: QueryHistoryItem[];
  followupSuggestions: string[];
  onClearHistory?: () => void;
}

const EXAMPLE_PROMPTS = [
  "Compare online spend by city tier",
  "Correlation: internet hours vs online orders",
  "Which age group spends most online?",
  "Show tech savvy score distribution",
  "Male vs female shopping behavior",
  "Segment by shopping preference",
  "Impulse buying patterns by age",
  "Brand loyalty across city tiers",
];

export default function Sidebar({
  onSubmit, loading, history, followupSuggestions, onClearHistory
}: SidebarProps) {
  const [prompt, setPrompt] = useState("");
  const [showHistory, setShowHistory] = useState(true);
  const [showExamples, setShowExamples] = useState(true);

  const handleSubmit = (p?: string, isFollowup = false) => {
    const q = p ?? prompt;
    if (!q.trim() || loading) return;
    onSubmit(q.trim(), isFollowup);
    if (!p) setPrompt("");
  };

  return (
    <aside
      className="h-full flex flex-col"
      style={{
        background: "rgba(9,9,15,0.7)",
        borderRight: "1px solid var(--border)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Prompt Input */}
      <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="mb-3 flex items-center gap-2">
          <MessageSquare size={15} style={{ color: "var(--brand)" }} />
          <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
            ASK A QUESTION
          </span>
        </div>
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="e.g. Compare online spend by city tier..."
            rows={4}
            className="input-brand resize-none text-sm leading-relaxed pr-10"
            style={{ fontSize: "13px" }}
          />
          <button
            onClick={() => handleSubmit()}
            disabled={!prompt.trim() || loading}
            className="absolute bottom-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center btn-brand"
            style={{ padding: 0 }}
            title="Submit (Enter)"
          >
            {loading ? (
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={12} />
            )}
          </button>
        </div>
        <p className="text-[11px] mt-1.5" style={{ color: "var(--text-muted)" }}>
          Press Enter to analyze · Shift+Enter for new line
        </p>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Follow-up suggestions */}
        <AnimatePresence>
          {followupSuggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Zap size={13} style={{ color: "#f59e0b" }} />
                <span className="text-[11px] font-semibold uppercase" style={{ color: "#f59e0b" }}>
                  Follow-up
                </span>
              </div>
              <div className="space-y-1.5">
                {followupSuggestions.map((s, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => handleSubmit(s, true)}
                    disabled={loading}
                    className="sidebar-item w-full text-left flex items-start gap-2"
                    style={{ background: "rgba(245,158,11,0.06)", borderColor: "rgba(245,158,11,0.2)" }}
                  >
                    <ChevronRight size={12} className="mt-0.5 shrink-0" style={{ color: "#f59e0b" }} />
                    <span>{s}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Example Queries */}
        <div>
          <button
            className="flex items-center gap-2 mb-2 w-full"
            onClick={() => setShowExamples(!showExamples)}
          >
            <BarChart2 size={13} style={{ color: "var(--brand)" }} />
            <span className="text-[11px] font-semibold uppercase flex-1 text-left" style={{ color: "var(--text-secondary)" }}>
              Example Queries
            </span>
            {showExamples ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
          <AnimatePresence>
            {showExamples && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1.5"
              >
                {EXAMPLE_PROMPTS.map((ex, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => {
                      setPrompt(ex);
                      handleSubmit(ex, false);
                    }}
                    disabled={loading}
                    className="sidebar-item w-full text-left text-xs leading-snug"
                  >
                    {ex}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Query History */}
        {history.length > 0 && (
          <div>
            <button
              className="flex items-center gap-2 mb-2 w-full"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History size={13} style={{ color: "var(--brand)" }} />
              <span className="text-[11px] font-semibold uppercase flex-1 text-left" style={{ color: "var(--text-secondary)" }}>
                History
              </span>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={{ background: "rgba(99,102,241,0.2)", color: "var(--brand-light)" }}
              >
                {history.length}
              </span>
              {onClearHistory && (
                <button
                  onClick={(e) => { e.stopPropagation(); onClearHistory(); }}
                  className="text-[10px] px-1.5 py-0.5 rounded-md transition-colors"
                  style={{ color: "#ef4444", background: "rgba(239,68,68,0.1)" }}
                  title="Clear history"
                >
                  Clear
                </button>
              )}
              {showHistory ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1.5"
                >
                  {history.slice(0, 8).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSubmit(item.prompt, false)}
                      disabled={loading}
                      className="sidebar-item w-full text-left"
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                          style={{ background: item.success ? "#10b981" : "#ef4444" }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs truncate leading-snug">{item.prompt}</p>
                          <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                            {item.chartCount} charts · {new Date(item.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer branding */}
      <div className="p-4 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2">
          <Sparkles size={12} style={{ color: "var(--brand)" }} />
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            Powered by Gemini AI
          </span>
        </div>
      </div>
    </aside>
  );
}
