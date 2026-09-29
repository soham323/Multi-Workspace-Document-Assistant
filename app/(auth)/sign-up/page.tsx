// app/(auth)/sign-up/page.tsx
import SignUpForm from "@/components/auth/SignUpForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account | Multi-Workspace Document Assistant",
  description: "Create an account to start isolating and chatting with documents.",
};

export default function SignUpPage() {
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
          Create an Account
        </h2>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
          Set up your profile to start querying documents across workspaces.
        </p>
      </div>

      <SignUpForm />
    </div>
  );
}
