"use client";
import LoginPanel from "./components/login";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-black text-center mb-8">Login / Sign Up</h1>
        <LoginPanel />
      </div>
    </main>
  );
}