// components/chat/ClearChatModal.tsx
"use client";

import { useEffect } from "react";

interface ClearChatModalProps {
  isOpen: boolean;
  workspaceName?: string;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ClearChatModal({
  isOpen,
  workspaceName,
  loading,
  onConfirm,
  onClose,
}: ClearChatModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: "16px",
        animation: "fadeIn 0.2s ease-out",
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: "100%",
          maxWidth: "440px",
          background: "linear-gradient(180deg, rgba(24, 24, 37, 0.95), rgba(15, 17, 28, 0.98))",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          boxShadow: "0 24px 48px -12px rgba(0, 0, 0, 0.8), 0 0 24px rgba(239, 68, 68, 0.15)",
          borderRadius: "var(--radius-xl)",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
        }}
      >
        {/* Header Icon + Title */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              color: "#f87171",
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </div>

          <div style={{ flex: 1 }}>
            <h3
              style={{
                fontSize: "17px",
                fontWeight: 600,
                color: "var(--text-primary)",
                margin: "0 0 4px 0",
              }}
            >
              Clear Chat History
            </h3>
            <p
              style={{
                fontSize: "13px",
                color: "var(--text-muted)",
                margin: 0,
                lineHeight: "1.5",
              }}
            >
              Are you sure you want to clear all conversation messages
              {workspaceName ? (
                <> for workspace <strong style={{ color: "var(--text-primary)" }}>{workspaceName}</strong></>
              ) : null}?
            </p>
          </div>
        </div>

        {/* Warning Callout */}
        <div
          style={{
            padding: "10px 14px",
            borderRadius: "var(--radius-md)",
            background: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            fontSize: "12px",
            color: "#fca5a5",
            lineHeight: "1.5",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "15px" }}>⚠️</span>
          <span>
            This will permanently delete all messages, citations, and debug info. This action cannot be undone.
          </span>
        </div>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "10px",
            marginTop: "6px",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="btn-secondary"
            style={{
              padding: "8px 16px",
              fontSize: "13px",
              borderRadius: "var(--radius-md)",
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "8px 18px",
              fontSize: "13px",
              fontWeight: 600,
              borderRadius: "var(--radius-md)",
              border: "1px solid rgba(239, 68, 68, 0.5)",
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
              color: "#ffffff",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
              transition: "all 0.2s ease",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: "14px", height: "14px", borderWidth: "2px" }} />
                <span>Clearing...</span>
              </>
            ) : (
              <span>Clear History</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
