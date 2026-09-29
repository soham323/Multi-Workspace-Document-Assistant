// components/documents/DocumentList.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import type { Document } from "@/types/database";

interface DocumentListProps {
  workspaceId: string;
  refreshTrigger?: number;
  onDocumentDeleted?: () => void;
}

export default function DocumentList({
  workspaceId,
  refreshTrigger = 0,
  onDocumentDeleted,
}: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/documents?workspaceId=${encodeURIComponent(workspaceId)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch documents.");
      }

      setDocuments(data.documents || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load documents.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (workspaceId) {
      fetchDocuments();
    }
  }, [workspaceId, refreshTrigger, fetchDocuments]);

  const handleDelete = async (docId: string) => {
    try {
      setDeletingId(docId);
      const res = await fetch(
        `/api/documents?id=${encodeURIComponent(docId)}&workspaceId=${encodeURIComponent(workspaceId)}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete document.");
      }

      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      setConfirmDeleteId(null);
      if (onDocumentDeleted) {
        onDocumentDeleted();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Delete failed.";
      alert(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const getFileTypeBadge = (type: string) => {
    const t = type.toLowerCase();
    if (t === "pdf") {
      return {
        bg: "rgba(239, 68, 68, 0.15)",
        color: "#f87171",
        border: "1px solid rgba(239, 68, 68, 0.25)",
        label: "PDF",
      };
    }
    if (t === "docx") {
      return {
        bg: "rgba(59, 130, 246, 0.15)",
        color: "#60a5fa",
        border: "1px solid rgba(59, 130, 246, 0.25)",
        label: "DOCX",
      };
    }
    return {
      bg: "rgba(16, 185, 129, 0.15)",
      color: "#34d399",
      border: "1px solid rgba(16, 185, 129, 0.25)",
      label: "TXT",
    };
  };

  const getStatusBadge = (status: string) => {
    if (status === "ingested") {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "12px",
            fontWeight: "600",
            padding: "3px 10px",
            borderRadius: "var(--radius-full)",
            background: "rgba(16, 185, 129, 0.15)",
            color: "#34d399",
            border: "1px solid rgba(16, 185, 129, 0.3)",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#34d399",
            }}
          />
          Ingested
        </span>
      );
    }
    if (status === "processing") {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "12px",
            fontWeight: "600",
            padding: "3px 10px",
            borderRadius: "var(--radius-full)",
            background: "rgba(245, 158, 11, 0.15)",
            color: "#fbbf24",
            border: "1px solid rgba(245, 158, 11, 0.3)",
          }}
        >
          <span className="spinner" style={{ width: "10px", height: "10px", borderWidth: "2px" }} />
          Processing
        </span>
      );
    }
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          fontSize: "12px",
          fontWeight: "600",
          padding: "3px 10px",
          borderRadius: "var(--radius-full)",
          background: "rgba(239, 68, 68, 0.15)",
          color: "#f87171",
          border: "1px solid rgba(239, 68, 68, 0.3)",
        }}
      >
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "#f87171",
          }}
        />
        Failed
      </span>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Header with Title and Refresh */}
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
          <h4 style={{ fontSize: "15px", fontWeight: "600", color: "var(--text-primary)" }}>
            Ingested Documents
          </h4>
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
            {documents.length} {documents.length === 1 ? "doc" : "docs"}
          </span>
        </div>

        <button
          type="button"
          onClick={fetchDocuments}
          disabled={loading}
          className="btn-secondary"
          style={{
            padding: "6px 12px",
            fontSize: "12px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
          title="Refresh documents list"
        >
          <svg
            width="13"
            height="13"
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
          Refresh
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="alert-error" style={{ fontSize: "13px" }}>
          {error}
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && documents.length === 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {[1, 2].map((i) => (
            <div
              key={i}
              className="glass-panel"
              style={{
                height: "68px",
                animation: "pulse 1.5s infinite",
                borderRadius: "var(--radius-md)",
              }}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && documents.length === 0 && (
        <div
          style={{
            padding: "36px 20px",
            textAlign: "center",
            background: "rgba(15, 23, 42, 0.3)",
            borderRadius: "var(--radius-md)",
            border: "1px dashed var(--border-subtle)",
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "12px",
              background: "rgba(255, 255, 255, 0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
              color: "var(--text-muted)",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <p style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "4px" }}>
            No documents uploaded yet
          </p>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", maxWidth: "340px", margin: "0 auto" }}>
            Upload PDF, TXT, or DOCX documents above. They will be split into chunks and embedded with Gemini 768-dim vectors.
          </p>
        </div>
      )}

      {/* Document Items */}
      {documents.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {documents.map((doc) => {
            const badgeStyle = getFileTypeBadge(doc.file_type);
            const isDeleting = deletingId === doc.id;
            const isConfirming = confirmDeleteId === doc.id;

            return (
              <div
                key={doc.id}
                className="glass-panel"
                style={{
                  padding: "16px 20px",
                  borderRadius: "var(--radius-md)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                  flexWrap: "wrap",
                  transition: "background 0.2s ease, border-color 0.2s ease",
                }}
              >
                {/* Left: Icon, Title, Metadata */}
                <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: "220px", flex: 1 }}>
                  {/* File Type Pill Icon */}
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "10px",
                      background: badgeStyle.bg,
                      color: badgeStyle.color,
                      border: badgeStyle.border,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "11px",
                      fontWeight: "700",
                      flexShrink: 0,
                    }}
                  >
                    {badgeStyle.label}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "var(--text-primary)",
                          wordBreak: "break-all",
                        }}
                      >
                        {doc.title}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        {doc.chunk_count || 0} {(doc.chunk_count === 1) ? "chunk" : "chunks"}
                      </span>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>&bull;</span>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        {new Date(doc.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>&bull;</span>
                      <span style={{ fontSize: "11px", fontFamily: "monospace", color: "var(--text-muted)" }}>
                        SHA-256: {doc.file_hash.slice(0, 8)}...
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Status Pill & Delete Button */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                  {getStatusBadge(doc.status)}

                  {isConfirming ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <button
                        type="button"
                        onClick={() => handleDelete(doc.id)}
                        disabled={isDeleting}
                        style={{
                          padding: "5px 10px",
                          fontSize: "12px",
                          fontWeight: "600",
                          borderRadius: "var(--radius-sm)",
                          background: "#ef4444",
                          color: "#ffffff",
                          border: "none",
                          cursor: isDeleting ? "not-allowed" : "pointer",
                        }}
                      >
                        {isDeleting ? "Deleting..." : "Confirm"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        disabled={isDeleting}
                        style={{
                          padding: "5px 10px",
                          fontSize: "12px",
                          borderRadius: "var(--radius-sm)",
                          background: "rgba(255, 255, 255, 0.1)",
                          color: "var(--text-secondary)",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(doc.id)}
                      disabled={isDeleting}
                      title="Delete document and vector chunks"
                      style={{
                        padding: "6px",
                        borderRadius: "var(--radius-sm)",
                        background: "transparent",
                        border: "1px solid transparent",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#f87171";
                        e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.3)";
                        e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "var(--text-muted)";
                        e.currentTarget.style.borderColor = "transparent";
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
