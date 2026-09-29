// components/chat/ChatContainer.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ChatMessage, ChatTurn } from "@/types/app";
import ChatMessageItem from "./ChatMessageItem";
import ChatInput from "./ChatInput";

interface ChatContainerProps {
  workspaceId: string;
  workspaceName?: string;
  onToolCallExecuted?: () => void;
}

const SUGGESTED_PROMPTS = [
  "What are the main topics and key takeaways in these documents?",
  "Summarize the key facts, findings, and figures mentioned.",
  "List any recommendations, conclusions, or next steps found.",
];

export default function ChatContainer({
  workspaceId,
  workspaceName,
  onToolCallExecuted,
}: ChatContainerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch conversation history for workspace
  const fetchMessages = useCallback(async () => {
    try {
      setInitialLoading(true);
      setError(null);
      const res = await fetch(`/api/chat/messages?workspaceId=${encodeURIComponent(workspaceId)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load chat history.");
      }

      setMessages(data.messages || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load messages.";
      setError(msg);
    } finally {
      setInitialLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (workspaceId) {
      fetchMessages();
    }
  }, [workspaceId, fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    setError(null);

    // Create optimistic user message
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      workspace_id: workspaceId,
      role: "user",
      content: text,
      citations: [],
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      // Build conversation history turns for LLM context
      const historyTurns: ChatTurn[] = messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          workspaceId,
          history: historyTurns,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to get an answer from the assistant.");
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        workspace_id: workspaceId,
        role: "assistant",
        content: data.answer,
        citations: data.citations || [],
        retrieval_debug: data.retrievalDebug,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Notify parent to refresh TaskList and ToolCallLogList
      if (data.toolCallsMade && data.toolCallsMade.length > 0 && onToolCallExecuted) {
        onToolCallExecuted();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error during chat.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm("Are you sure you want to clear the chat history for this workspace?")) {
      return;
    }

    try {
      const res = await fetch(`/api/chat/messages?workspaceId=${encodeURIComponent(workspaceId)}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to clear history.");
      }

      setMessages([]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error clearing history.";
      alert(msg);
    }
  };

  return (
    <div
      className="glass-panel"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "640px",
        overflow: "hidden",
      }}
    >
      {/* Chat Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(15, 23, 42, 0.4)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "#10b981",
              boxShadow: "0 0 10px rgba(16, 185, 129, 0.6)",
            }}
          />
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--text-primary)" }}>
              Workspace RAG Assistant
            </h3>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              {workspaceName ? `Isolated to: ${workspaceName}` : "Grounded Retrieval"}
            </span>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            onClick={handleClearHistory}
            className="btn-secondary"
            style={{
              padding: "5px 10px",
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
            title="Clear chat history in this workspace"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
            </svg>
            Clear
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {initialLoading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: "8px",
              color: "var(--text-muted)",
              fontSize: "13px",
            }}
          >
            <div className="spinner" style={{ width: "20px", height: "20px" }} />
            <span>Loading conversation...</span>
          </div>
        ) : messages.length === 0 ? (
          /* Empty State with Suggested Chips */
          <div
            style={{
              margin: "auto",
              textAlign: "center",
              maxWidth: "500px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(99, 102, 241, 0.3)",
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#818cf8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>

            <div>
              <h4 style={{ fontSize: "16px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "4px" }}>
                Ask anything about your documents
              </h4>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                Queries are embedded into 768-dim vectors, matched via PostgreSQL HNSW, and answered with grounded inline citations.
              </p>
            </div>

            {/* Suggested Prompt Chips */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%", marginTop: "6px" }}>
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "var(--radius-md)",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-primary)",
                    fontSize: "13px",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(99, 102, 241, 0.12)";
                    e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                    e.currentTarget.style.borderColor = "var(--border-subtle)";
                  }}
                >
                  <span>&ldquo;{prompt}&rdquo;</span>
                  <span style={{ color: "#818cf8", fontSize: "14px" }}>&rarr;</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => <ChatMessageItem key={msg.id} message={msg} />)
        )}

        {/* Loading Assistant Bubble */}
        {loading && (
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "18px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "10px",
                background: "rgba(16, 185, 129, 0.15)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <div className="spinner" style={{ width: "14px", height: "14px", borderWidth: "2px" }} />
            </div>
            <div
              style={{
                padding: "12px 18px",
                borderRadius: "4px 16px 16px 16px",
                background: "rgba(17, 24, 39, 0.8)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-muted)",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>Searching workspace vectors & generating grounded answer...</span>
            </div>
          </div>
        )}

        {/* Error notification in chat */}
        {error && (
          <div className="alert-error" style={{ margin: "8px 0", fontSize: "13px" }}>
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div
        style={{
          padding: "14px 20px 16px",
          borderTop: "1px solid var(--border-subtle)",
          background: "rgba(15, 23, 42, 0.3)",
        }}
      >
        <ChatInput onSendMessage={handleSendMessage} disabled={loading} />
      </div>
    </div>
  );
}
