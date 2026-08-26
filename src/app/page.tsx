import Link from "next/link";
import { Shield, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F7F7F8] flex flex-col items-center justify-center p-4">
      <div className="max-w-sm w-full bg-white border border-zinc-200 rounded-lg shadow-sm p-8 space-y-8">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-700 text-white rounded-md shadow-sm">
            <Shield className="w-6 h-6" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">MyBuddyMaid OS</h1>
            <p className="text-sm text-zinc-500 mt-1">Internal Operations Platform</p>
          </div>
        </div>
        
        <div className="pt-2">
          <Link 
            href="/dashboard" 
            className="flex items-center justify-center w-full gap-2 bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2.5 rounded-md text-sm font-medium transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900"
          >
            Authenticate Session
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
      
      <div className="mt-8 text-xs text-zinc-400 font-medium">
        Secured System • Authorized Personnel Only
      </div>
    </div>
  );
}