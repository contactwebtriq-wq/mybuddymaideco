'use client';

import { AlertTriangle, RefreshCcw } from "lucide-react";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service if we had one
    console.error("[GLOBAL_ERROR_BOUNDARY] Caught error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#F7F7F8] flex flex-col items-center justify-center p-6">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 mb-2">Something went wrong</h2>
        <p className="text-sm text-zinc-500 mb-8">
          A critical system error prevented this page from loading. Our team has been notified.
        </p>
        <button
          onClick={() => reset()}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-zinc-900 text-white rounded-xl font-medium hover:bg-zinc-800 transition-colors focus:ring-4 focus:ring-zinc-200"
        >
          <RefreshCcw className="w-4 h-4" />
          Try to recover
        </button>
      </div>
    </div>
  );
}
