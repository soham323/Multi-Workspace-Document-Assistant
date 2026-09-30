// components/chat/ChatMessageItem.tsx
"use client";

import type { ChatMessage, Citation } from "@/types/app";
import CitationBadge from "./CitationBadge";
import RetrievalDebugInspector from "./RetrievalDebugInspector";

interface ChatMessageItemProps {
  message: ChatMessage;
}

export default function ChatMessageItem({ message }: ChatMessageItemProps) {
  const isUser = message.role === "user";

  // Clean Markdown formatting helper
  const renderFormattedContent = (content: string) => {
    // Split into paragraphs
    const paragraphs = content.split(/\n\n+/);

    return paragraphs.map((para, i) => {
      // Bullet list item
      if (para.startsWith("- ") || para.startsWith("* ")) {
        const items = para.split(/\n[-*] /).filter(Boolean);
        return (
          <ul key={i} style={{ paddingLeft: "20px", margin: "6px 0", lineHeight: "1.6" }}>
            {items.map((item, idx) => (
              <li key={idx} style={{ marginBottom: "4px" }}>
                {item.replace(/^[-*] /, "")}
              </li>
            ))}
          </ul>
        );
      }

      // Standard paragraph with linebreaks
      const lines = para.split("\n");
      return (
        <p key={i} style={{ margin: "6px 0", lineHeight: "1.6" }}>
          {lines.map((line, lineIdx) => (
            <span key={lineIdx}>
              {line}
              {lineIdx < lines.length - 1 && <br />}
            </span>
          ))}
        </p>
      );
    });
  };

  const citations = (message.citations as unknown as Citation[]) || [];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isUser ? "flex-end" : "flex-start",
        marginBottom: "18px",
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "10px",
          maxWidth: "85%",
          alignItems: "flex-start",
          flexDirection: isUser ? "row-reverse" : "row",
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "10px",
            background: isUser
              ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
              : "rgba(16, 185, 129, 0.15)",
            border: isUser
              ? "1px solid rgba(255, 255, 255, 0.2)"
              : "1px solid rgba(16, 185, 129, 0.3)",
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
              width="16"
              height="16"
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
            padding: "12px 18px",
            borderRadius: isUser ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
            background: isUser
              ? "linear-gradient(135deg, rgba(99, 102, 241, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)"
              : "rgba(17, 24, 39, 0.8)",
            border: isUser ? "none" : "1px solid var(--border-subtle)",
            boxShadow: isUser
              ? "0 4px 15px rgba(99, 102, 241, 0.25)"
              : "var(--shadow-card)",
            color: "#ffffff",
            fontSize: "14px",
            wordBreak: "break-word",
          }}
        >
          {renderFormattedContent(message.content)}

          {/* Citations section for Assistant turn */}
          {!isUser && citations.length > 0 && (
            <div
              style={{
                marginTop: "12px",
                paddingTop: "10px",
                borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                Grounded Citations:
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
              fontSize: "10px",
              color: isUser ? "rgba(255, 255, 255, 0.6)" : "var(--text-muted)",
              marginTop: "6px",
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
