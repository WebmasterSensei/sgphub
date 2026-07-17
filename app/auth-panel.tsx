"use client";

import { useState } from "react";
import { useAuth } from "./providers";
import { useRouter } from "next/navigation";
import { OAuthProvider } from "appwrite";

export default function LoginPanel() {
const { user, login, signup, googleLogin, logout } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleGoogle = () => {
    signIn.oauth2({
      provider: OAuthProvider.Google,
      onSuccess: () => router.refresh(),
    });
  };

  if (user) {
    return (
      <div className="text-center space-y-4">
        <p>Welcome, <strong>{user.name || user.email}</strong>!</p>
        <button
          onClick={() => signOut.signOut({ onSuccess: () => router.refresh() })}
          className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Google Sign In */}
      <button
        onClick={handleGoogle}
        className="w-full flex items-center justify-center gap-3 border border-gray-300 bg-white py-3 rounded-lg hover:bg-gray-50 font-medium"
      >
        <img src="https://www.google.com/favicon.ico" alt="G" className="w-5 h-5" />
        Continue with Google
      </button>

      <div className="relative text-center text-sm text-gray-500">
        ───────────── or ─────────────
      </div>

      {/* Email/Password */}
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3 border rounded-lg"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 border rounded-lg"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 border rounded-lg"
        />

        <button
          onClick={() => signUp.emailPassword({ email, password, name, onSuccess: () => router.refresh() })}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
        >
          Create Account
        </button>

        <button
          onClick={() => signIn.emailPassword({ email, password, onSuccess: () => router.refresh() })}
          className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-black"
        >
          Sign In
        </button>
      </div>

      {error && <p className="text-red-500 text-center text-sm">{error.message}</p>}
    </div>
  );
}