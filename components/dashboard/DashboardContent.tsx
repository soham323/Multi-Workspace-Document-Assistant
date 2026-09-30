// components/dashboard/DashboardContent.tsx
"use client";

import { useState } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import CreateWorkspaceModal from "@/components/workspace/CreateWorkspaceModal";
import UploadZone from "@/components/documents/UploadZone";
import DocumentList from "@/components/documents/DocumentList";
import ChatContainer from "@/components/chat/ChatContainer";
import TaskList from "@/components/tasks/TaskList";
import ToolCallLogList from "@/components/tools/ToolCallLogList";

export default function DashboardContent({ userEmail }: { userEmail: string }) {
  const { workspaces, activeWorkspace, loading } = useWorkspace();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshDocsTrigger, setRefreshDocsTrigger] = useState(0);
  const [refreshToolsTrigger, setRefreshToolsTrigger] = useState(0);

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
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 2-Line Hero Info & Architecture Overview Banner */}
      <div
        className="glass-panel"
        style={{
          padding: "20px 24px",
          background: "linear-gradient(135deg, rgba(20, 26, 45, 0.85) 0%, rgba(12, 17, 30, 0.95) 100%)",
          border: "1px solid rgba(99, 102, 241, 0.25)",
          boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.5), 0 0 20px rgba(99, 102, 241, 0.08)",
          borderRadius: "var(--radius-xl)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#38bdf8",
                boxShadow: "0 0 10px #38bdf8",
                display: "inline-block",
              }}
            />
            <span
              style={{
                fontSize: "12px",
                fontWeight: "700",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: "#38bdf8",
              }}
            >
              DocuAssistant Intelligence Engine &bull; Gemini 2.5 + pgvector RAG
            </span>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <span
              style={{
                padding: "3px 10px",
                borderRadius: "var(--radius-full)",
                fontSize: "11px",
                fontWeight: "600",
                background: "rgba(16, 185, 129, 0.12)",
                color: "#6ee7b7",
                border: "1px solid rgba(16, 185, 129, 0.25)",
              }}
            >
              1. Ingest Knowledge
            </span>
            <span
              style={{
                padding: "3px 10px",
                borderRadius: "var(--radius-full)",
                fontSize: "11px",
                fontWeight: "600",
                background: "rgba(99, 102, 241, 0.12)",
                color: "#a5b4fc",
                border: "1px solid rgba(99, 102, 241, 0.25)",
              }}
            >
              2. Grounded Vector Q&amp;A
            </span>
            <span
              style={{
                padding: "3px 10px",
                borderRadius: "var(--radius-full)",
                fontSize: "11px",
                fontWeight: "600",
                background: "rgba(245, 158, 11, 0.12)",
                color: "#fcd34d",
                border: "1px solid rgba(245, 158, 11, 0.25)",
              }}
            >
              3. Automated Tools (Tasks &amp; Discord)
            </span>
          </div>
        </div>

        {/* 2-Line Clear Info: What is the tool & How to use it */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <p style={{ fontSize: "14px", color: "var(--text-primary)", lineHeight: "1.5", margin: 0 }}>
            <strong style={{ color: "#818cf8" }}>What is this:</strong> A multi-tenant workspace assistant that ingests PDF, DOCX, and TXT files, extracts recursive text chunks, and performs high-speed semantic retrieval with strict tenant data isolation.
          </p>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5", margin: 0 }}>
            <strong style={{ color: "#38bdf8" }}>How to use:</strong> Upload documents on the left to build this workspace&apos;s vector index &bull; ask questions in the chat for grounded answers with verified citations &bull; or prompt the assistant in natural language to create workspace tasks and post Discord notifications.
          </p>
        </div>
      </div>

      {/* Active Workspace Banner */}
      <div
        className="glass-panel"
        style={{
          padding: "24px 28px",
          background: "linear-gradient(135deg, rgba(22, 30, 52, 0.7) 0%, rgba(13, 18, 32, 0.85) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.09)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: "var(--radius-full)",
                  fontSize: "11px",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                  background: "rgba(99, 102, 241, 0.15)",
                  color: "#818cf8",
                  border: "1px solid rgba(99, 102, 241, 0.3)",
                }}
              >
                Active Workspace
              </span>
              <span style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "monospace" }}>
                ID: {activeWorkspace?.id}
              </span>
            </div>

            <h1
              style={{
                fontSize: "24px",
                fontWeight: "700",
                letterSpacing: "-0.02em",
                color: "var(--text-primary)",
                marginBottom: "4px",
              }}
            >
              {activeWorkspace?.name}
            </h1>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>
              Created on {activeWorkspace ? new Date(activeWorkspace.created_at).toLocaleDateString() : ""} &bull; All document queries and vector searches are strictly isolated to this workspace.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="btn-primary"
            style={{
              width: "auto",
              padding: "10px 18px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
              borderRadius: "var(--radius-md)",
            }}
          >
            <svg
              width="15"
              height="15"
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
            <span>New Workspace</span>
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
        {/* Stage 4: Documents & Ingestion Section */}
        <div className="glass-panel" style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "rgba(16, 185, 129, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(16, 185, 129, 0.3)",
              }}
            >
              <svg
                width="20"
                height="20"
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
              <h3 style={{ fontSize: "18px", fontWeight: "700", color: "var(--text-primary)" }}>
                Workspace Knowledge Base
              </h3>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                Documents uploaded here are chunked, embedded into 768-dimensional vectors with Gemini, and strictly isolated to this workspace.
              </p>
            </div>
          </div>

          {activeWorkspace && (
            <>
              <UploadZone
                workspaceId={activeWorkspace.id}
                onUploadSuccess={() => setRefreshDocsTrigger((prev) => prev + 1)}
              />
              <DocumentList
                workspaceId={activeWorkspace.id}
                refreshTrigger={refreshDocsTrigger}
                onDocumentDeleted={() => setRefreshDocsTrigger((prev) => prev + 1)}
              />
            </>
          )}
        </div>

        {/* Stage 5: Live RAG Chat Container */}
        {activeWorkspace && (
          <ChatContainer
            workspaceId={activeWorkspace.id}
            workspaceName={activeWorkspace.name}
            onToolCallExecuted={() => setRefreshToolsTrigger((prev) => prev + 1)}
          />
        )}
      </div>

      {/* Stage 6: Tool Actions & Observability (Task List & Tool Call Audit Log) */}
      {activeWorkspace && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
            gap: "24px",
            alignItems: "start",
          }}
        >
          <TaskList
            workspaceId={activeWorkspace.id}
            refreshTrigger={refreshToolsTrigger}
          />
          <ToolCallLogList
            workspaceId={activeWorkspace.id}
            refreshTrigger={refreshToolsTrigger}
          />
        </div>
      )}

      <CreateWorkspaceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
