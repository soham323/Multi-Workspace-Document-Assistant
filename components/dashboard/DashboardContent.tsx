// components/dashboard/DashboardContent.tsx
"use client";

import { useState } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import CreateWorkspaceModal from "@/components/workspace/CreateWorkspaceModal";

export default function DashboardContent({ userEmail }: { userEmail: string }) {
  const { workspaces, activeWorkspace, loading } = useWorkspace();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div
          className="glass-panel"
          style={{ height: "140px", animation: "pulse 1.5s infinite" }}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
          }}
        >
          <div className="glass-panel" style={{ height: "120px" }} />
          <div className="glass-panel" style={{ height: "120px" }} />
          <div className="glass-panel" style={{ height: "120px" }} />
        </div>
      </div>
    );
  }

  // ─── 0 Workspaces: Onboarding Empty State ─────────────────────────────────
  if (workspaces.length === 0) {
    return (
      <>
        <div
          className="glass-panel"
          style={{
            textAlign: "center",
            padding: "60px 24px",
            maxWidth: "600px",
            margin: "40px auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              boxShadow: "0 0 25px rgba(99, 102, 241, 0.2)",
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#818cf8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              <line x1="12" y1="11" x2="12" y2="17" />
              <line x1="9" y1="14" x2="15" y2="14" />
            </svg>
          </div>

          <h2 style={{ fontSize: "22px", fontWeight: "700", color: "var(--text-primary)" }}>
            Welcome to DocuAssistant!
          </h2>
          <p
            style={{
              fontSize: "14px",
              color: "var(--text-secondary)",
              maxWidth: "420px",
              lineHeight: "1.6",
            }}
          >
            You don&apos;t have any workspaces yet. Workspaces keep your documents, vector embeddings, and AI chat completely isolated.
          </p>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="btn-primary"
            style={{ width: "auto", padding: "12px 28px", marginTop: "8px" }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create Your First Workspace
          </button>
        </div>

        <CreateWorkspaceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </>
    );
  }

  // ─── Active Workspace View ────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Active Workspace Banner */}
      <div
        className="glass-panel"
        style={{
          padding: "28px 32px",
          background: "linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: "var(--radius-full)",
                  fontSize: "12px",
                  fontWeight: "600",
                  background: "rgba(99, 102, 241, 0.15)",
                  color: "#818cf8",
                  border: "1px solid rgba(99, 102, 241, 0.3)",
                }}
              >
                Active Workspace
              </span>
              <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                ID: {activeWorkspace?.id}
              </span>
            </div>

            <h1
              style={{
                fontSize: "26px",
                fontWeight: "700",
                letterSpacing: "-0.02em",
                color: "var(--text-primary)",
                marginBottom: "6px",
              }}
            >
              {activeWorkspace?.name}
            </h1>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
              Created on {activeWorkspace ? new Date(activeWorkspace.created_at).toLocaleDateString() : ""} &bull; All document queries and vector searches are strictly isolated to this workspace.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="btn-secondary"
            style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Workspace
          </button>
        </div>
      </div>

      {/* Feature Section Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "20px",
        }}
      >
        {/* Stage 4: Documents Card */}
        <div className="glass-panel" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(16, 185, 129, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#34d399"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: "var(--text-primary)" }}>
                Documents & Vector Store
              </h3>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Stage 4 Ingestion</span>
            </div>
          </div>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5", marginBottom: "16px" }}>
            Upload PDF, TXT, and DOCX files. Chunks are embedded via Gemini 768-dim embeddings and tagged with <code>{activeWorkspace?.id?.slice(0, 8)}...</code>.
          </p>
          <div
            style={{
              padding: "16px",
              borderRadius: "var(--radius-md)",
              border: "1px dashed var(--border-subtle)",
              background: "rgba(0, 0, 0, 0.2)",
              textAlign: "center",
              fontSize: "13px",
              color: "var(--text-muted)",
            }}
          >
            Stage 4 Document Upload Pipeline ready to be unlocked
          </div>
        </div>

        {/* Stage 5: RAG Chat Card */}
        <div className="glass-panel" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(99, 102, 241, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="18"
                height="18"
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
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: "var(--text-primary)" }}>
                RAG Document Chat
              </h3>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Stage 5 Retrieval</span>
            </div>
          </div>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5", marginBottom: "16px" }}>
            Query documents strictly within <strong>{activeWorkspace?.name}</strong>. Enforced via <code>match_workspace_chunks</code> PostgreSQL function.
          </p>
          <div
            style={{
              padding: "16px",
              borderRadius: "var(--radius-md)",
              border: "1px dashed var(--border-subtle)",
              background: "rgba(0, 0, 0, 0.2)",
              textAlign: "center",
              fontSize: "13px",
              color: "var(--text-muted)",
            }}
          >
            Stage 5 RAG Chat with Citation Badges coming next
          </div>
        </div>
      </div>

      <CreateWorkspaceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
