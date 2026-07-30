"use client";

import { useState } from "react";
import { useAuth } from "../providers";
import { Eye, EyeOff, Loader2, Mail, Lock, User } from "lucide-react";

export default function LoginPanel() {
  const { user, login, signup, googleLogin, logout, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<"signin" | "signup" | "google" | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="text-center space-y-6 max-w-sm mx-auto">
        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-semibold shadow-md">
          {(user.name || user.email).charAt(0).toUpperCase()}
        </div>
        <div className="space-y-1">
          <p className="text-gray-500 text-sm">Welcome back</p>
          <p className="text-lg font-semibold text-gray-900">
            {user.name || user.email}
          </p>
        </div>
        <button
          onClick={logout}
          className="w-full bg-red-600 text-white py-3 rounded-xl font-medium hover:bg-red-700 active:scale-[0.98] transition shadow-sm"
        >
          Sign Out
        </button>
      </div>
    );
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
    <div className="max-w-sm mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-1.5">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Welcome
        </h1>
        <p className="text-sm text-gray-500">
          Sign in to your account or create a new one
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Google */}
      <button
        type="button"
        onClick={handleGoogle}
        disabled={submitting !== null}
        className="w-full flex items-center justify-center gap-3 border border-gray-300 bg-white py-3 rounded-xl hover:bg-gray-50 font-medium text-gray-800 transition disabled:opacity-60 shadow-sm"
      >
        {submitting === "google" ? (
          <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
        ) : (
          <img
            src="https://www.google.com/favicon.ico"
            alt=""
            className="w-5 h-5"
          />
        )}
        Continue with Google
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs uppercase tracking-wider text-gray-400 font-medium">
          or
        </span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      {/* Form fields */}
      <div className="space-y-3.5">
        {/* Name */}
        <div className="relative">
          <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition"
          />
        </div>

        {/* Email */}
        <div className="relative">
          <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="email"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition"
          />
        </div>

        {/* Password */}
        <div className="relative">
          <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-10 pr-11 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Create Account */}
        <button
          type="button"
          onClick={handleSignup}
          disabled={submitting !== null}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 active:scale-[0.98] transition disabled:opacity-60 shadow-sm mt-1"
        >
          {submitting === "signup" && (
            <Loader2 className="w-4 h-4 animate-spin" />
          )}
          Create Account
        </button>

        {/* Sign In */}
        <button
          type="button"
          onClick={handleLogin}
          disabled={submitting !== null}
          className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-xl font-medium hover:bg-black active:scale-[0.98] transition disabled:opacity-60 shadow-sm"
        >
          {submitting === "signin" && (
            <Loader2 className="w-4 h-4 animate-spin" />
          )}
          Sign In
        </button>
      </div>
    </div>
  );
}