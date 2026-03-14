"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Database, Users, ShoppingBag, TrendingUp, Cpu, Store } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ProfileData {
  total_rows?: number;
  total_columns?: number;
  online_preference_pct?: number;
  avg_online_spend?: number;
  avg_store_spend?: number;
  avg_tech_savvy?: number;
  loaded?: boolean;
}

const API =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) ||
  "http://localhost:8000";

export default function StatsBar() {
  const [stats, setStats] = useState<ProfileData | null>(null);

  useEffect(() => {
    fetch(`${API}/api/data-profile`)
      .then((r) => r.json())
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  if (!stats || stats.loaded === false) return null;

  const cards = [
    {
      icon: <Database size={14} />,
      label: "Records",
      value: stats.total_rows?.toLocaleString() || "–",
      color: "#6366f1",
    },
    {
      icon: <Users size={14} />,
      label: "Features",
      value: `${stats.total_columns} cols`,
      color: "#8b5cf6",
    },
    {
      icon: <ShoppingBag size={14} />,
      label: "Online Pref.",
      value: `${stats.online_preference_pct}%`,
      color: "#10b981",
    },
    {
      icon: <TrendingUp size={14} />,
      label: "Avg Online Spend",
      value: formatCurrency(stats.avg_online_spend || 0),
      color: "#f59e0b",
    },
    {
      icon: <Store size={14} />,
      label: "Avg Store Spend",
      value: formatCurrency(stats.avg_store_spend || 0),
      color: "#ec4899",
    },
    {
      icon: <Cpu size={14} />,
      label: "Avg Tech Savvy",
      value: `${stats.avg_tech_savvy}/10`,
      color: "#3b82f6",
    },
  ];

  return (
    <div
      className="flex items-center gap-3 px-6 py-2 overflow-x-auto border-b"
      style={{
        borderColor: "var(--border)",
        background: "rgba(9,9,15,0.6)",
        backdropFilter: "blur(8px)",
      }}
    >
      {cards.map((card, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg shrink-0"
          style={{
            background: `${card.color}10`,
            border: `1px solid ${card.color}25`,
          }}
        >
          <span style={{ color: card.color }}>{card.icon}</span>
          <div>
            <p className="text-[10px] leading-none" style={{ color: "var(--text-muted)" }}>
              {card.label}
            </p>
            <p className="text-xs font-semibold font-mono mt-0.5" style={{ color: "var(--text-primary)" }}>
              {card.value}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
