"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const back = () => {
    window.location.href = '/';
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full bg-surface border border-hairline rounded-xl shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">⚠️</div>

        <h1 className="text-3xl font-bold text-foreground">
          Something went wrong
        </h1>

        <p className="mt-3 text-ink-soft">
          An unexpected error occurred. Please try again.
        </p>

        <button
          onClick={back}
          className="mt-6 px-6 py-3 rounded-lg bg-accent text-white hover:bg-accent-hover transition"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
