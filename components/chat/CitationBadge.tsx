// components/chat/CitationBadge.tsx
"use client";

import { useState } from "react";
import type { Citation } from "@/types/app";

interface CitationBadgeProps {
  citation: Citation;
  index: number;
}

export default function CitationBadge({ citation, index }: CitationBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);

  const matchPercent = Math.round(citation.similarity * 100);

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "3px 10px",
          borderRadius: "var(--radius-full)",
          background: "rgba(99, 102, 241, 0.12)",
          border: "1px solid rgba(99, 102, 241, 0.3)",
          color: "#a5b4fc",
          fontSize: "12px",
          fontWeight: "500",
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(99, 102, 241, 0.25)";
          e.currentTarget.style.borderColor = "#818cf8";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(99, 102, 241, 0.12)";
          e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.3)";
        }}
        title="Click to view retrieved chunk excerpt and similarity score"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <span>
          [{index + 1}] {citation.document_title}
        </span>
        <span
          style={{
            fontSize: "10px",
            padding: "1px 5px",
            borderRadius: "var(--radius-full)",
            background: "rgba(16, 185, 129, 0.2)",
            color: "#34d399",
            fontWeight: "700",
          }}
        >
          {matchPercent}%
        </span>
      </button>

      {/* Popover Excerpt Modal */}
      {isOpen && (
        <div
          className="glass-panel"
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: "0",
            width: "320px",
            padding: "16px",
            zIndex: 50,
            borderRadius: "var(--radius-md)",
            background: "rgba(15, 23, 42, 0.95)",
            border: "1px solid rgba(99, 102, 241, 0.4)",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.6)",
            fontSize: "12px",
            lineHeight: "1.5",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
              paddingBottom: "6px",
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            <div>
              <span style={{ fontWeight: "700", color: "#f8fafc" }}>
                Chunk #{citation.chunk_index}
              </span>
              <span style={{ color: "var(--text-muted)", marginLeft: "6px" }}>
                ({matchPercent}% Cosine Match)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: "2px",
                fontSize: "14px",
              }}
            >
              ✕
            </button>
          </div>

          <div
            style={{
              maxHeight: "120px",
              overflowY: "auto",
              color: "var(--text-secondary)",
              fontStyle: "italic",
              background: "rgba(0, 0, 0, 0.25)",
              padding: "8px 10px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            &ldquo;{citation.excerpt}&rdquo;
          </div>
        </div>
      )}
    </div>
  );
}
