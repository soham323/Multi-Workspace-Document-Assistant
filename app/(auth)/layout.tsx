// app/(auth)/layout.tsx
// Centered layout for authentication pages with ambient background lighting

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        overflow: "hidden",
      }}
    >
      {/* Background ambient lighting effects */}
      <div
        style={{
          position: "absolute",
          top: "15%",
          left: "25%",
          width: "400px",
          height: "400px",
          background: "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "15%",
          right: "25%",
          width: "350px",
          height: "350px",
          background: "radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "440px",
          display: "flex",
          flexDirection: "column",
          gap: "28px",
        }}
      >
        {/* App Brand Header */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              marginBottom: "16px",
              boxShadow: "0 0 20px rgba(99, 102, 241, 0.2)",
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
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: "700",
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
            }}
          >
            DocuAssistant
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "var(--text-secondary)",
              marginTop: "4px",
            }}
          >
            Multi-Workspace Document Intelligence & RAG
          </p>
        </div>

        {/* Auth Card Container */}
        <div className="glass-panel" style={{ padding: "32px 28px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
