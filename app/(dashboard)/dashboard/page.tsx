// app/(dashboard)/dashboard/page.tsx
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Multi-Workspace Document Assistant",
  description: "View and manage document workspaces.",
};

export default async function DashboardPage() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Welcome Banner */}
      <div
        className="glass-panel"
        style={{
          padding: "32px",
          background: "linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <span
            style={{
              padding: "4px 10px",
              borderRadius: "var(--radius-full)",
              fontSize: "12px",
              fontWeight: "600",
              background: "var(--success-bg)",
              color: "var(--success)",
              border: "1px solid var(--success-border)",
            }}
          >
            Authentication Active
          </span>
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Stage 2 Verified</span>
        </div>

        <h1
          style={{
            fontSize: "26px",
            fontWeight: "700",
            letterSpacing: "-0.02em",
            color: "var(--text-primary)",
            marginBottom: "8px",
          }}
        >
          Welcome, {user?.email}
        </h1>
        <p style={{ fontSize: "15px", color: "var(--text-secondary)", maxWidth: "680px", lineHeight: "1.6" }}>
          Your Supabase Auth session is active and verified. In the next stage (Stage 3), we will enable multi-workspace creation, workspace switching, and isolated document context.
        </p>
      </div>

      {/* Overview Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "20px",
        }}
      >
        <div className="glass-panel" style={{ padding: "24px" }}>
          <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "8px" }}>
            Active User ID
          </div>
          <div
            style={{
              fontSize: "13px",
              fontFamily: "monospace",
              color: "var(--accent-primary)",
              wordBreak: "break-all",
              background: "rgba(0, 0, 0, 0.25)",
              padding: "8px 12px",
              borderRadius: "var(--radius-sm)",
            }}
          >
            {user?.id}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: "24px" }}>
          <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "8px" }}>
            Multi-Tenant Isolation
          </div>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
            All queries, documents, tasks, and embeddings will be strictly tied to your user ID and workspace boundaries.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: "24px" }}>
          <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "8px" }}>
            Next Stage Roadmap
          </div>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
            <strong>Stage 3</strong>: Create workspaces, list workspaces, and switch between active workspaces.
          </p>
        </div>
      </div>
    </div>
  );
}
