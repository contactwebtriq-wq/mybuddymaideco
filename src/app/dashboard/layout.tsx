import Link from "next/link";
import { Users, Briefcase, FileCheck, DollarSign, Home, LogOut, PieChart, Shield } from "lucide-react";

import { getSessionId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { logout } from "@/actions/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const sessionId = await getSessionId();
  if (!sessionId) redirect('/login');

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true }
  });

  if (!session || session.expiresAt < new Date()) {
    redirect('/login');
  }

  const user = session.user;
  
  return (
    <div className="flex h-screen bg-[#F7F7F8] font-sans">
      {/* Sidebar - Sleek Dark Enterprise Look */}
      <aside className="w-64 bg-[#0E1116] text-zinc-300 flex flex-col shrink-0 border-r border-zinc-800">
        <div className="h-14 px-6 flex items-center border-b border-white/5">
          <Shield className="w-5 h-5 text-blue-500 mr-2" strokeWidth={2.5} />
          <h1 className="text-sm font-semibold text-zinc-100 tracking-tight">MyBuddyMaid</h1>
          <span className="ml-2 text-[10px] font-bold bg-white/10 text-zinc-400 px-1.5 py-0.5 rounded uppercase tracking-wider">OS</span>
        </div>
        
        <nav className="flex-1 px-3 space-y-0.5 mt-4 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Dashboard</div>
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/5 hover:text-zinc-100 transition-colors text-sm font-medium">
            <Home className="w-4 h-4 text-zinc-400" />
            <span>Overview</span>
          </Link>
          
          {(user.role === 'ADMIN' || user.role === 'MANAGER') && (
            <Link href="/dashboard/analytics" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/5 hover:text-zinc-100 transition-colors text-sm font-medium">
              <PieChart className="w-4 h-4 text-zinc-400" />
              <span>Analytics Hub</span>
            </Link>
          )}
          
          <div className="px-3 pt-6 pb-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Operations</div>
          <Link href="/dashboard/match" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/5 hover:text-zinc-100 transition-colors text-sm font-medium">
            <Users className="w-4 h-4 text-zinc-400" />
            <span>Smart Match Engine</span>
          </Link>
          <Link href="/dashboard/candidates" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/5 hover:text-zinc-100 transition-colors text-sm font-medium">
            <Users className="w-4 h-4 text-zinc-400" />
            <span>Candidates CRM</span>
          </Link>
          <Link href="/dashboard/clients" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/5 hover:text-zinc-100 transition-colors text-sm font-medium">
            <Briefcase className="w-4 h-4 text-zinc-400" />
            <span>Client Leads</span>
          </Link>

          {(user.role === 'ADMIN' || user.role === 'MANAGER') && (
            <>
              <div className="px-3 pt-6 pb-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Management</div>
              <Link href="/dashboard/placements" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/5 hover:text-zinc-100 transition-colors text-sm font-medium">
                <FileCheck className="w-4 h-4 text-zinc-400" />
                <span>Placements & Trials</span>
              </Link>
              <Link href="/dashboard/finance" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/5 hover:text-zinc-100 transition-colors text-sm font-medium">
                <DollarSign className="w-4 h-4 text-zinc-400" />
                <span>Fees & Finance</span>
              </Link>
            </>
          )}

          {user.role === 'ADMIN' && (
            <>
              <div className="px-3 pt-6 pb-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">System</div>
              <Link href="/dashboard/security" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/5 hover:text-emerald-400 transition-colors text-sm font-medium">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-400">Cybersecurity</span>
              </Link>
            </>
          )}
        </nav>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 bg-white/5 p-2 rounded-md border border-white/5">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-xs font-semibold text-zinc-200 truncate">{user.name}</span>
              <span className="text-[10px] text-zinc-500 uppercase">{user.role}</span>
            </div>
            <form action={logout}>
              <button type="submit" className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-white/5 rounded transition-colors" title="Log out">
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header - Ultra Minimal */}
        <header className="h-14 bg-white border-b border-zinc-200 flex justify-between items-center px-6 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-800">Command Center</span>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded text-xs font-semibold">
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
               SYSTEM ONLINE
             </div>
          </div>
        </header>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}