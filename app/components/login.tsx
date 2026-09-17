"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../providers";
import { Eye, EyeOff, Loader2, Mail, Lock, Feather } from "lucide-react";

const GoogleIcon = (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path
      fill="#FFC107"
      d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
    />
    <path
      fill="#FF3D00"
      d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
    />
    <path
      fill="#4CAF50"
      d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
    />
    <path
      fill="#1976D2"
      d="M43.611 20.083H42V20H24v8h11.303C33.57 32.14 29.144 34.48 24 34.48c-3.672 0-7.041-1.447-9.532-3.778l-6.162 4.632C10.857 39.619 17.06 44 24 44c9.841 0 18-7.159 18-16 0-.642-.062-1.283-.183-1.917z"
    />
  </svg>
);

type AnyError = { type?: string; message?: string } | null | undefined;

function friendlyError(e: unknown): string {
  const raw = e as AnyError;
  const message = raw?.message ?? "";
  const type = raw?.type ?? "";
  const lower = `${type} ${message}`.toLowerCase();

  if (!raw || (!type && !message)) {
    return "Something went wrong. Please try again.";
  }

  if (
    lower.includes("fetch") ||
    lower.includes("network") ||
    lower.includes("failed to parse") ||
    lower.includes("socket") ||
    lower.includes("502") ||
    lower.includes("504")
  ) {
    return "Can't reach Appwrite. Check your internet or NEXT_PUBLIC_APPWRITE_ENDPOINT in .env.local.";
  }

  if (lower.includes("project")) {
    return "Wrong project ID. Verify NEXT_PUBLIC_APPWRITE_PROJECT_ID in .env.local matches your Appwrite project.";
  }

  if (
    lower.includes("auth method") ||
    lower.includes("method not allowed") ||
    lower.includes("method_disabled") ||
    (lower.includes("login_with_") && lower.includes("disabled"))
  ) {
    return "Email & Password sign-in is disabled. Enable it in the Appwrite Console → Authentication → Settings → Login Methods.";
  }

  if (
    lower.includes("invalid credentials") ||
    type === "user_not_found" ||
    lower.includes("credentials")
  ) {
    return "No account matches that email & password. Signed up with Google? Use “Continue with Google”, or set a password for your user in the Appwrite Console (Authentication → Users → your user).";
  }

  if (
    lower.includes("verification") ||
    lower.includes("email not verified") ||
    lower.includes("unverified")
  ) {
    return "Please verify your email first. Check your inbox for the verification email.";
  }

  if (lower.includes("aborted") || lower.includes("cancel")) {
    return "Google sign-in was cancelled. Try again.";
  }

  return message || "Something went wrong. Please try again.";
}

export default function LoginPanel() {
  const { user, login, googleLogin, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<"signin" | "google" | null>(
    null
  );

  useEffect(() => {
    if (user) window.location.href = "/components/";
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0B0B0E]">
        <Loader2 className="h-7 w-7 animate-spin text-[#6C63FF]" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0B0B0E]">
        <Loader2 className="h-7 w-7 animate-spin text-[#6C63FF]" />
      </div>
    );
  }

  const handleGoogle = async () => {
    setError(null);
    setSubmitting("google");
    try {
      googleLogin();
    } catch (e) {
      setError(friendlyError(e));
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
    } catch (e) {
      setError(friendlyError(e));
      setSubmitting(null);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#0B0B0E] px-4 py-10">
      {/* Aurora background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full bg-[#6C63FF]/25 blur-[120px]" />
        <div className="absolute top-1/3 -right-24 h-[380px] w-[380px] rounded-full bg-[#FF7A6B]/15 blur-[120px]" />
        <div className="absolute -bottom-40 left-1/3 h-[400px] w-[400px] rounded-full bg-[#3DDCFF]/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_45%,black,transparent)]" />
      </div>

      {/* Glass card */}
      <div className="relative w-full max-w-[420px]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-[0_24px_60px_rgba(0,0,0,0.55)] backdrop-blur-2xl sm:p-10">
          {/* Brand */}
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6C63FF] to-[#9B6BF0] shadow-lg shadow-[#6C63FF]/30">
              <Feather className="h-7 w-7 text-white" strokeWidth={2.2} />
            </div>
            <h1 className="text-[22px] font-semibold tracking-tight text-white">
              Welcome back
            </h1>
            <p className="mt-1.5 text-[13px] text-white/50">
              Sign in to MisFits Community to continue
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-[13px] leading-relaxed text-red-200">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Google */}
            <button
              type="button"
              onClick={handleGoogle}
              disabled={submitting !== null}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white py-3 font-medium text-[#1A1A1A] transition hover:bg-white/90 active:scale-[0.99] disabled:opacity-60"
            >
              {submitting === "google" ? (
                <Loader2 className="h-5 w-5 animate-spin text-white/70" />
              ) : (
                GoogleIcon
              )}
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-[11px] font-medium uppercase tracking-wider text-white/30">
                or
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            {/* Email */}
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <input
                type="email"
                placeholder="Email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
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
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 pl-10 pr-11 text-white placeholder:text-white/35 transition focus:border-[#6C63FF]/60 focus:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/25"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/35 transition hover:text-white/70"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Options */}
            <div className="flex items-center justify-between text-[13px]">
              <label className="flex cursor-pointer items-center gap-2 text-white/50 transition hover:text-white/80">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-white/5 accent-[#6C63FF]"
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={() =>
                  setError(
                    "Password reset isn't set up yet. Ask the admin to set a new password in the Appwrite Console."
                  )
                }
                className="font-medium text-[#8F86FF] transition hover:text-[#AAA3FF]"
              >
                Forgot password?
              </button>
            </div>

            {/* Sign In */}
            <button
              type="button"
              onClick={handleLogin}
              disabled={submitting !== null}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6C63FF] to-[#8F6BF0] py-3 font-semibold text-white shadow-lg shadow-[#6C63FF]/25 transition hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
            >
              {submitting === "signin" && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Sign In
            </button>
          </div>
        </div>

        {/* Footer hint */}
        <p className="mt-6 text-center text-[12px] leading-relaxed text-white/30">
          New here? An admin can create your account from the Appwrite Console →
          Authentication → Users.
        </p>
      </div>
    </div>
  );
}