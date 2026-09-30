// components/workspace/CreateWorkspaceModal.tsx
"use client";

import { useState } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateWorkspaceModal({ isOpen, onClose }: CreateWorkspaceModalProps) {
  const { createWorkspace } = useWorkspace();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();

    if (trimmed.length < 2) {
      setError("Workspace name must be at least 2 characters.");
      return;
    }
    if (trimmed.length > 100) {
      setError("Workspace name cannot exceed 100 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createWorkspace(trimmed);
      setName("");
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create workspace";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: "16px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: "100%",
          maxWidth: "460px",
          padding: "28px",
          background: "#0f172a",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: "600", color: "var(--text-primary)" }}>
              Create New Workspace
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px" }}>
              Workspaces isolate documents, vector search, and conversations.
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: "4px",
              fontSize: "18px",
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="alert-error" style={{ marginBottom: "16px" }} role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <label htmlFor="workspace-name" style={{ fontSize: "13px", fontWeight: "500", color: "var(--text-secondary)" }}>
                Workspace Name
              </label>
              <span style={{ fontSize: "12px", color: name.trim().length > 100 ? "var(--error)" : "var(--text-muted)" }}>
                {name.trim().length} / 100
              </span>
            </div>
            <input
              id="workspace-name"
              type="text"
              required
              autoFocus
              placeholder="e.g. Legal Documents, Q3 Financials, Project Alpha"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              disabled={loading}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || name.trim().length < 2 || name.trim().length > 100}
              className="btn-primary"
              style={{ width: "auto", minWidth: "140px" }}
            >
              {loading ? (
                <>
                  <span className="spinner" /> Creating...
                </>
              ) : (
                "Create Workspace"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
