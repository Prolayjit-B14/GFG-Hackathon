"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const MESSAGES = [
  "Interpreting your query...",
  "Generating Pandas code...",
  "Executing data analysis...",
  "Selecting best chart types...",
  "Generating AI insights...",
  "Building dashboard...",
];

export default function LoadingAnimation() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      {/* Pulsing Logo */}
      <motion.div
        className="relative mb-8"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))", border: "1px solid rgba(99,102,241,0.4)" }}
        >
          <Sparkles size={32} style={{ color: "#818cf8" }} />
        </div>
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-2xl"
            style={{ border: "1px solid rgba(99,102,241,0.3)" }}
            animate={{ scale: [1, 1.5 + i * 0.3], opacity: [0.5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4 }}
          />
        ))}
      </motion.div>

      {/* Cycling messages */}
      <div className="overflow-hidden h-6 mb-6">
        {MESSAGES.map((msg, i) => (
          <motion.p
            key={i}
            className="text-sm text-center"
            style={{ color: "var(--text-secondary)" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: [0, 1, 1, 0], y: [20, 0, 0, -20] }}
            transition={{
              duration: 2,
              delay: i * 1.8,
              times: [0, 0.2, 0.8, 1],
              ease: "easeInOut",
            }}
          >
            {msg}
          </motion.p>
        ))}
      </div>

      {/* Shimmer bars (skeleton) */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
        {[280, 220, 240, 200].map((h, i) => (
          <motion.div
            key={i}
            className="shimmer rounded-xl"
            style={{ height: h, opacity: 0.6 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: i * 0.1 }}
          />
        ))}
      </div>
    </div>
  );
}
