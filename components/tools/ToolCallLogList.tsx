// components/tools/ToolCallLogList.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import type { ToolCallLog, ToolCallStatus } from "@/types/app";

interface ToolCallLogListProps {
  workspaceId: string;
  refreshTrigger?: number;
}

export default function ToolCallLogList({ workspaceId, refreshTrigger = 0 }: ToolCallLogListProps) {
  const [logs, setLogs] = useState<ToolCallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/tools/logs?workspaceId=${encodeURIComponent(workspaceId)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch tool audit logs.");
      }

      setLogs(data.logs || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load audit logs.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (workspaceId) {
      fetchLogs();
    }
  }, [workspaceId, refreshTrigger, fetchLogs]);

  const getStatusBadge = (status: ToolCallStatus) => {
    if (status === "success") {
      return {
        bg: "rgba(16, 185, 129, 0.15)",
        color: "#34d399",
        border: "1px solid rgba(16, 185, 129, 0.3)",
        label: "SUCCESS",
      };
    }
    if (status === "validation_error") {
      return {
        bg: "rgba(245, 158, 11, 0.15)",
        color: "#fbbf24",
        border: "1px solid rgba(245, 158, 11, 0.3)",
        label: "VALIDATION_ERR",
      };
    }
    return {
      bg: "rgba(239, 68, 68, 0.15)",
      color: "#f87171",
      border: "1px solid rgba(239, 68, 68, 0.3)",
      label: "FAILURE",
    };
  };

  return (
    <div
      className="glass-panel"
      style={{
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: "12px",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "rgba(139, 92, 246, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(139, 92, 246, 0.3)",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#a78bfa"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="4 17 10 11 4 5" />
              <line x1="12" y1="19" x2="20" y2="19" />
            </svg>
          </div>
          <div>
            <h4 style={{ fontSize: "16px", fontWeight: "700", color: "var(--text-primary)" }}>
              Tool Call Audit Log
            </h4>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Real-time audit trail of all AI tool execution attempts (`tool_calls_log`)
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontSize: "11px",
              fontWeight: "600",
              padding: "2px 8px",
              borderRadius: "var(--radius-full)",
              background: "rgba(255, 255, 255, 0.08)",
              color: "var(--text-secondary)",
            }}
          >
            {logs.length} {logs.length === 1 ? "call" : "calls"}
          </span>

          <button
            type="button"
            onClick={fetchLogs}
            disabled={loading}
            className="btn-secondary"
            style={{ padding: "4px 8px", fontSize: "11px" }}
            title="Refresh logs"
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
              style={{ animation: loading ? "spin 1s linear infinite" : "none" }}
            >
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
            </svg>
          </button>
        </div>
      </div>

      {error && <div className="alert-error" style={{ fontSize: "12px" }}>{error}</div>}

      {/* Loading Skeletons */}
      {loading && logs.length === 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[1, 2].map((i) => (
            <div
              key={i}
              className="glass-panel"
              style={{ height: "54px", animation: "pulse 1.5s infinite" }}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && logs.length === 0 && (
        <div
          style={{
            padding: "28px 16px",
            textAlign: "center",
            background: "rgba(15, 23, 42, 0.3)",
            borderRadius: "var(--radius-md)",
            border: "1px dashed var(--border-subtle)",
          }}
        >
          <p style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "4px" }}>
            No tool calls logged yet
          </p>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", maxWidth: "340px", margin: "0 auto" }}>
            When the AI uses functions like <code>save_workspace_task</code> or <code>send_channel_notification</code>, every invocation attempt will be recorded here for auditing.
          </p>
        </div>
      )}

      {/* Log Items */}
      {logs.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "300px", overflowY: "auto" }}>
          {logs.map((log) => {
            const badge = getStatusBadge(log.status);
            const isExpanded = expandedLogId === log.id;

            return (
              <div
                key={log.id}
                style={{
                  padding: "10px 14px",
                  borderRadius: "var(--radius-md)",
                  background: "rgba(15, 23, 42, 0.5)",
                  border: "1px solid var(--border-subtle)",
                  fontSize: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <code
                      style={{
                        padding: "2px 6px",
                        borderRadius: "var(--radius-sm)",
                        background: "rgba(255, 255, 255, 0.08)",
                        color: "#818cf8",
                        fontWeight: "600",
                        fontSize: "11px",
                      }}
                    >
                      {log.tool_name}
                    </code>

                    <span
                      style={{
                        fontSize: "9px",
                        fontWeight: "700",
                        padding: "2px 6px",
                        borderRadius: "var(--radius-sm)",
                        background: badge.bg,
                        color: badge.color,
                        border: badge.border,
                      }}
                    >
                      {badge.label}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      {new Date(log.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>

                    <button
                      type="button"
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#a5b4fc",
                        fontSize: "11px",
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      {isExpanded ? "Hide JSON" : "View JSON"}
                    </button>
                  </div>
                </div>

                {log.error_msg && (
                  <div style={{ color: "#f87171", fontSize: "11px" }}>
                    Error: {log.error_msg}
                  </div>
                )}

                {/* Collapsible JSON View */}
                {isExpanded && (
                  <div
                    style={{
                      marginTop: "6px",
                      padding: "8px 10px",
                      borderRadius: "var(--radius-sm)",
                      background: "rgba(0, 0, 0, 0.5)",
                      border: "1px solid rgba(255, 255, 255, 0.05)",
                      fontFamily: "monospace",
                      fontSize: "10px",
                      maxHeight: "140px",
                      overflowY: "auto",
                      color: "#94a3b8",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    <div>
                      <strong style={{ color: "var(--text-primary)" }}>Arguments:</strong>
                      <pre style={{ margin: "2px 0", color: "#a5b4fc", whiteSpace: "pre-wrap" }}>
                        {JSON.stringify(log.arguments, null, 2)}
                      </pre>
                    </div>
                    {log.result && (
                      <div>
                        <strong style={{ color: "var(--text-primary)" }}>Result:</strong>
                        <pre style={{ margin: "2px 0", color: "#34d399", whiteSpace: "pre-wrap" }}>
                          {JSON.stringify(log.result, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
