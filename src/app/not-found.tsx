import Link from "next/link";
import { Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F7F7F8] flex flex-col items-center justify-center p-6">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-zinc-100 text-zinc-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <Search className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 mb-2">Page Not Found</h2>
        <p className="text-sm text-zinc-500 mb-8">
          The module or record you are looking for does not exist or you do not have permission to view it.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex w-full items-center justify-center py-3 px-4 bg-zinc-900 text-white rounded-xl font-medium hover:bg-zinc-800 transition-colors focus:ring-4 focus:ring-zinc-200"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
