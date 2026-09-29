// components/auth/SignUpForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignUpForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const redirectUrl = `${window.location.origin}/auth/callback`;

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      // If Supabase has email confirmation enabled, session will be null and user is created
      if (data?.user && !data?.session) {
        setSuccessMessage(
          "Account created! Please check your email inbox to verify your account before signing in."
        );
        return;
      }

      // If email confirmation is disabled, user is immediately logged in
      router.push("/dashboard");
      router.refresh();
    } catch {
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      {errorMessage && (
        <div className="alert-error" role="alert">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="alert-success" role="alert">
          {successMessage}
        </div>
      )}

      <div>
        <label
          htmlFor="signup-email"
          style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "500", color: "var(--text-secondary)" }}
        >
          Email Address
        </label>
        <input
          id="signup-email"
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
        <label
          htmlFor="signup-password"
          style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "500", color: "var(--text-secondary)" }}
        >
          Password
        </label>
        <input
          id="signup-password"
          type="password"
          required
          autoComplete="new-password"
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-field"
          disabled={loading}
        />
      </div>

      <div>
        <label
          htmlFor="confirm-password"
          style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "500", color: "var(--text-secondary)" }}
        >
          Confirm Password
        </label>
        <input
          id="confirm-password"
          type="password"
          required
          autoComplete="new-password"
          placeholder="Repeat your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="input-field"
          disabled={loading}
        />
      </div>

      <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: "6px" }}>
        {loading ? (
          <>
            <span className="spinner" /> Creating account...
          </>
        ) : (
          "Create Account"
        )}
      </button>

      <div style={{ textAlign: "center", marginTop: "12px", fontSize: "14px", color: "var(--text-secondary)" }}>
        Already have an account?{" "}
        <Link
          href="/sign-in"
          style={{ color: "var(--accent-primary)", fontWeight: "600", textDecoration: "none" }}
        >
          Sign In
        </Link>
      </div>
    </form>
  );
}
