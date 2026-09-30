// components/chat/ChatMessageItem.tsx
"use client";

import React from "react";
import type { ChatMessage, Citation } from "@/types/app";
import CitationBadge from "./CitationBadge";
import RetrievalDebugInspector from "./RetrievalDebugInspector";

interface ChatMessageItemProps {
  message: ChatMessage;
}

export default function ChatMessageItem({ message }: ChatMessageItemProps) {
  const isUser = message.role === "user";

  // Parse inline text: bold (**text**), inline code (`code`), and citation badges [Doc: ..., Chunk: ...]
  const renderInlineFormatted = (text: string): React.ReactNode[] => {
    // Regex matches:
    // 1. Citation tags: [Doc: ..., Chunk: ...] or [filename § section]
    // 2. Bold text: **text**
    // 3. Inline code: `code`
    const regex = /(\[(?:Doc:\s*)?[^\]\n]+?(?:,\s*Chunk:\s*\d+)?\]|\*\*[^*]+\*\*|`[^`]+`)/g;
    const parts = text.split(regex);

    return parts.map((part, idx) => {
      if (!part) return null;

      // Citations: [Doc: name, Chunk: 0] or [name.txt]
      if (part.startsWith("[") && part.endsWith("]")) {
        const inner = part.slice(1, -1);
        // Clean display label
        const displayLabel = inner
          .replace(/^Doc:\s*/i, "")
          .replace(/,\s*Chunk:\s*\d+/i, "");

        return (
          <span
            key={idx}
            title={inner}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "1px 7px",
              margin: "0 3px",
              fontSize: "11px",
              fontWeight: "600",
              color: "#34d399",
              background: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: "12px",
              verticalAlign: "baseline",
              cursor: "default",
            }}
          >
            <svg
              width="10"
              height="10"
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
            {displayLabel}
          </span>
        );
      }

      // Bold: **text**
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong
            key={idx}
            style={{
              color: isUser ? "#ffffff" : "#f8fafc",
              fontWeight: "650",
            }}
          >
            {part.slice(2, -2)}
          </strong>
        );
      }

      // Inline code: `code`
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={idx}
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              padding: "2px 5px",
              borderRadius: "4px",
              fontSize: "12px",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              color: "#a5b4fc",
            }}
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      return <span key={idx}>{part}</span>;
    });
  };

  // Structured parser for modern AI assistant layout (ChatGPT / Claude style)
  const renderFormattedContent = (content: string) => {
    const rawLines = content.split("\n");
    const blocks: React.ReactNode[] = [];
    let currentList: string[] = [];

    const flushList = (key: string) => {
      if (currentList.length > 0) {
        blocks.push(
          <ul
            key={key}
            style={{
              listStyleType: "none",
              paddingLeft: "0",
              margin: "8px 0 14px 0",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {currentList.map((item, idx) => (
              <li
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  lineHeight: "1.65",
                  fontSize: "13.5px",
                  color: isUser ? "#ffffff" : "rgba(241, 245, 249, 0.95)",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: isUser ? "#ffffff" : "#34d399",
                    marginTop: "8px",
                    flexShrink: 0,
                    boxShadow: isUser ? "none" : "0 0 8px rgba(52, 211, 153, 0.6)",
                  }}
                />
                <div style={{ flex: 1 }}>{renderInlineFormatted(item)}</div>
              </li>
            ))}
          </ul>
        );
        currentList = [];
      }
    };

    rawLines.forEach((line, lineIdx) => {
      const trimmed = line.trim();

      // Empty line
      if (!trimmed) {
        flushList(`list-${lineIdx}`);
        return;
      }

      // Check for bullet list item: "* ", "- ", "• "
      if (trimmed.startsWith("* ") || trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
        const itemText = trimmed.replace(/^[*•-]\s+/, "");
        currentList.push(itemText);
        return;
      }

      // If regular line, flush any active list first
      flushList(`list-${lineIdx}`);

      // Check for Section Header (e.g. "**Main Topics:**" or "### Main Topics")
      const isHeader =
        trimmed.startsWith("###") ||
        trimmed.startsWith("##") ||
        (/^(\*\*[^*]+:\*\*)$/.test(trimmed) && !trimmed.includes("."));

      if (isHeader) {
        const headerText = trimmed.replace(/^#{2,3}\s*/, "").replace(/^\*\*|\*\*$/g, "");
        blocks.push(
          <div
            key={`header-${lineIdx}`}
            style={{
              fontSize: "14.5px",
              fontWeight: "700",
              color: isUser ? "#ffffff" : "#38bdf8",
              margin: blocks.length === 0 ? "0 0 8px 0" : "16px 0 8px 0",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              letterSpacing: "0.02em",
            }}
          >
            <span
              style={{
                width: "4px",
                height: "14px",
                borderRadius: "2px",
                background: isUser ? "#ffffff" : "linear-gradient(to bottom, #38bdf8, #818cf8)",
                display: "inline-block",
              }}
            />
            {headerText}
          </div>
        );
        return;
      }

      // Regular paragraph line
      blocks.push(
        <p
          key={`p-${lineIdx}`}
          style={{
            margin: "0 0 8px 0",
            lineHeight: "1.65",
            fontSize: "14px",
            color: isUser ? "#ffffff" : "rgba(241, 245, 249, 0.95)",
          }}
        >
          {renderInlineFormatted(trimmed)}
        </p>
      );
    });

    flushList("final-list");
    return blocks;
  };

  const citations = (message.citations as unknown as Citation[]) || [];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isUser ? "flex-end" : "flex-start",
        marginBottom: "20px",
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "12px",
          maxWidth: isUser ? "80%" : "92%",
          alignItems: "flex-start",
          flexDirection: isUser ? "row-reverse" : "row",
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "10px",
            background: isUser
              ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
              : "linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(14, 165, 233, 0.2) 100%)",
            border: isUser
              ? "1px solid rgba(255, 255, 255, 0.25)"
              : "1px solid rgba(52, 211, 153, 0.35)",
            boxShadow: isUser
              ? "0 4px 12px rgba(99, 102, 241, 0.3)"
              : "0 4px 12px rgba(16, 185, 129, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginTop: "2px",
          }}
        >
          {isUser ? (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          ) : (
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#34d399"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
              <rect x="3" y="8" width="18" height="12" rx="3" />
              <circle cx="9" cy="14" r="1.5" />
              <circle cx="15" cy="14" r="1.5" />
              <line x1="9" y1="18" x2="15" y2="18" />
            </svg>
          )}
        </div>

        {/* Message Bubble */}
        <div
          style={{
            padding: "16px 20px",
            borderRadius: isUser ? "18px 4px 18px 18px" : "4px 18px 18px 18px",
            background: isUser
              ? "linear-gradient(135deg, rgba(99, 102, 241, 0.95) 0%, rgba(139, 92, 246, 0.95) 100%)"
              : "rgba(15, 23, 42, 0.85)",
            backdropFilter: "blur(12px)",
            border: isUser ? "none" : "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: isUser
              ? "0 4px 20px rgba(99, 102, 241, 0.3)"
              : "0 8px 30px rgba(0, 0, 0, 0.3)",
            color: "#ffffff",
            wordBreak: "break-word",
          }}
        >
          {/* Structured formatted message */}
          {renderFormattedContent(message.content)}

          {/* Bottom Citations section for Assistant turn */}
          {!isUser && citations.length > 0 && (
            <div
              style={{
                marginTop: "16px",
                paddingTop: "12px",
                borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginBottom: "8px",
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                Document Citations ({citations.length}):
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {citations.map((c, idx) => (
                  <CitationBadge key={idx} citation={c} index={idx} />
                ))}
              </div>
            </div>
          )}

          {/* Retrieval Debug Inspector */}
          {!isUser && message.retrieval_debug && (
            <RetrievalDebugInspector debug={message.retrieval_debug} />
          )}

          {/* Timestamp */}
          <div
            style={{
              fontSize: "11px",
              color: isUser ? "rgba(255, 255, 255, 0.7)" : "#64748b",
              marginTop: "8px",
              textAlign: isUser ? "right" : "left",
            }}
          >
            {new Date(message.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
