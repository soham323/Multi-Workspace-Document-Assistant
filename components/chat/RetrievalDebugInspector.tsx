// components/chat/RetrievalDebugInspector.tsx
"use client";

import { useState } from "react";
import type { RetrievalDebug } from "@/types/app";

interface RetrievalDebugInspectorProps {
  debug?: RetrievalDebug;
}

export default function RetrievalDebugInspector({ debug }: RetrievalDebugInspectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!debug) return null;

  return (
    <div style={{ marginTop: "8px" }}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          background: "transparent",
          border: "none",
          color: "var(--text-muted)",
          fontSize: "11px",
          cursor: "pointer",
          padding: "2px 4px",
          borderRadius: "var(--radius-sm)",
          transition: "color 0.2s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#a5b4fc")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span>
          Debug Inspector ({debug.latency_ms}ms &bull; {debug.chunks_retrieved} chunks &bull; threshold {debug.match_threshold})
        </span>
      </button>

      {isExpanded && (
        <div
          style={{
            marginTop: "6px",
            padding: "10px 12px",
            borderRadius: "var(--radius-sm)",
            background: "rgba(0, 0, 0, 0.4)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            fontSize: "11px",
            fontFamily: "monospace",
            color: "var(--text-secondary)",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-muted)" }}>Workspace Filter:</span>
            <span style={{ color: "#818cf8" }}>{debug.workspace_id}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-muted)" }}>Chunks Retrieved:</span>
            <span style={{ color: "#34d399" }}>{debug.chunks_retrieved}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-muted)" }}>Similarity Threshold:</span>
            <span>{debug.match_threshold}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-muted)" }}>Retrieval Latency:</span>
            <span>{debug.latency_ms} ms</span>
          </div>
          <div style={{ marginTop: "4px", paddingTop: "4px", borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}>
            <span style={{ color: "var(--text-muted)" }}>SQL Isolation Clause:</span>
            <div style={{ color: "#94a3b8", wordBreak: "break-all", marginTop: "2px" }}>
              {debug.sql_filter}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
