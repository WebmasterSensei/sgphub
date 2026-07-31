"use client";

import { useState } from "react";
import { useAuth } from "../providers";
import { Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";

const SIDE_IMAGE =
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1400&q=80";

export default function LoginPanel() {
  const { user, login, signup, googleLogin, logout, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<
    "signin" | "signup" | "google" | null
  >(null);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-[#0B0B0E]">
        <Loader2 className="w-7 h-7 animate-spin text-[#6C63FF]" />
      </div>
    );
  }

  if (user) {
    window.location.href = "/components/";
    return null;
  }

  const handleGoogle = async () => {
    setError(null);
    setSubmitting("google");
    try {
      googleLogin();
    } catch (e: any) {
      setError(e?.message ?? "Google sign-in failed");
      setSubmitting(null);
    }
  };

  const handleSignup = async () => {
    setError(null);
    if (!email.trim() || !password || !name.trim()) {
      setError("Please fill in your name, email, and password.");
      return;
    }
    setSubmitting("signup");
    try {
      await signup(email, password, name);
    } catch (e: any) {
      setError(e?.message ?? "Could not create account");
    } finally {
      setSubmitting(null);
    }
  };

  const handleLogin = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setSubmitting("signin");
    try {
      await login(email, password);
    } catch (e: any) {
      setError(e?.message ?? "Invalid email or password");
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-[#0B0B0E]">
      {/* Form side */}
      <div className="flex w-full flex-1 items-center justify-center px-6 py-12 sm:px-10 lg:w-1/2 lg:px-16">
        <div className="w-full max-w-sm space-y-7">
          {/* Header */}
          <div className="space-y-1.5">
            <h1 className="text-[26px] font-semibold tracking-tight text-white">
              Welcome back
            </h1>
            <p className="text-[14px] text-white/50">
              Sign in to your account to continue
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={submitting !== null}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] py-3 font-medium text-white transition hover:bg-white/[0.07] disabled:opacity-60"
          >
            {submitting === "google" ? (
              <Loader2 className="h-5 w-5 animate-spin text-white/70" />
            ) : (
              <img
                src="https://www.google.com/favicon.ico"
                alt=""
                className="h-5 w-5"
              />
            )}
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[11px] font-medium uppercase tracking-wider text-white/30">
              or
            </span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Form fields */}
          <div className="space-y-3.5">
            {/* Email */}
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <input
                type="email"
                placeholder="Email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 pl-10 pr-4 text-white placeholder:text-white/35 transition focus:border-[#6C63FF]/60 focus:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/25"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 pl-10 pr-11 text-white placeholder:text-white/35 transition focus:border-[#6C63FF]/60 focus:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/25"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/35 transition hover:text-white/70"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Create Account */}
            {/* <button
              type="button"
              onClick={handleSignup}
              disabled={submitting !== null}
              className="w-full flex items-center justify-center gap-2 bg-[#6C63FF] text-white py-3 rounded-xl font-medium hover:bg-[#5A52E0] active:scale-[0.98] transition disabled:opacity-60 shadow-sm mt-1"
            >
              {submitting === "signup" && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              Create Account
            </button> */}

            {/* Sign In */}
            <button
              type="button"
              onClick={handleLogin}
              disabled={submitting !== null}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#6C63FF] py-3 font-medium text-white shadow-sm shadow-[#6C63FF]/20 transition hover:bg-[#5A52E0] active:scale-[0.98] disabled:opacity-60"
            >
              {submitting === "signin" && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Sign In
            </button>
          </div>
        </div>
      </div>

      {/* Image side — hidden below lg, revealed on large screens */}
      <div className="relative hidden w-1/2 lg:block">
        <img
          src={SIDE_IMAGE}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0E]/40 to-transparent" />

        <div className="relative flex h-full flex-col justify-end p-12">
          <p className="max-w-md text-[22px] font-medium leading-snug text-white">
            "Switching over took an afternoon. It felt like the product had
            always worked this way."
          </p>
          <p className="mt-4 text-[14px] text-white/60">
            Amara Chen · Head of Product
          </p>
        </div>
      </div>
    </div>
  );
}