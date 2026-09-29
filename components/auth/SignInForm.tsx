// components/auth/SignInForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {errorMessage && (
        <div className="alert-error" role="alert">
          {errorMessage}
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "500", color: "var(--text-secondary)" }}
        >
          Email Address
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field"
          disabled={loading}
        />
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
          <label
            htmlFor="password"
            style={{ fontSize: "13px", fontWeight: "500", color: "var(--text-secondary)" }}
          >
            Password
          </label>
        </div>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-field"
          disabled={loading}
        />
      </div>

      <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: "4px" }}>
        {loading ? (
          <>
            <span className="spinner" /> Signing in...
          </>
        ) : (
          "Sign In"
        )}
      </button>

      <div style={{ textAlign: "center", marginTop: "12px", fontSize: "14px", color: "var(--text-secondary)" }}>
        Don&apos;t have an account?{" "}
        <Link
          href="/sign-up"
          style={{ color: "var(--accent-primary)", fontWeight: "600", textDecoration: "none" }}
        >
          Sign Up
        </Link>
      </div>
    </form>
  );
}
