// app/(auth)/sign-in/page.tsx
import SignInForm from "@/components/auth/SignInForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | Multi-Workspace Document Assistant",
  description: "Sign in to access your workspaces and documents.",
};

export default function SignInPage() {
  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h2
          style={{
            fontSize: "20px",
            fontWeight: "600",
            color: "var(--text-primary)",
            marginBottom: "6px",
          }}
        >
          Welcome Back
        </h2>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
          Enter your credentials to access your workspaces.
        </p>
      </div>

      <SignInForm />
    </div>
  );
}
