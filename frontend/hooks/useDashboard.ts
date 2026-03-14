import { useState, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import { generateDashboard } from "@/lib/api";
import type { DashboardResponse, QueryHistoryItem } from "@/lib/types";

export interface DashboardState {
  loading: boolean;
  response: DashboardResponse | null;
  history: QueryHistoryItem[];
  followupSuggestions: string[];
  currentQuery: string;
}

export function useDashboard() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<DashboardResponse | null>(null);
  const [history, setHistory] = useState<QueryHistoryItem[]>([]);
  const [followupSuggestions, setFollowupSuggestions] = useState<string[]>([]);
  const [currentQuery, setCurrentQuery] = useState("");
  const dashboardRef = useRef<HTMLDivElement>(null);

  const handleQuery = useCallback(async (prompt: string, isFollowup = false) => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setCurrentQuery(prompt);

    const toastId = toast.loading(
      isFollowup ? "Updating dashboard…" : "Generating dashboard…"
    );

    try {
      const result = await generateDashboard(prompt, isFollowup);
      setResponse(result);

      if (result.success) {
        const count = result.charts?.length || 0;
        toast.success(
          `Dashboard ready — ${count} chart${count !== 1 ? "s" : ""}`,
          { id: toastId }
        );
        setFollowupSuggestions(result.followup_suggestions || []);

        setHistory((prev) =>
          [
            {
              id: `${Date.now()}`,
              prompt,
              timestamp: new Date(),
              success: true,
              chartCount: count,
            },
            ...prev,
          ].slice(0, 20)
        );

        // Scroll to dashboard
        setTimeout(() => {
          dashboardRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 100);
      } else {
        toast.error(
          result.error || "Data not available for this query.",
          { id: toastId }
        );
        setHistory((prev) =>
          [
            {
              id: `${Date.now()}`,
              prompt,
              timestamp: new Date(),
              success: false,
              chartCount: 0,
            },
            ...prev,
          ].slice(0, 20)
        );
      }
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ||
        "Connection failed — is the backend running on port 8000?";
      toast.error(msg, { id: toastId });
      setResponse({ success: false, error: msg });
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    toast.success("History cleared");
  }, []);

  const resetDashboard = useCallback(() => {
    setResponse(null);
    setFollowupSuggestions([]);
    setCurrentQuery("");
  }, []);

  return {
    loading,
    response,
    history,
    followupSuggestions,
    currentQuery,
    dashboardRef,
    handleQuery,
    clearHistory,
    resetDashboard,
  };
}
