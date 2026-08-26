import SidebarNav from "./SidebarNav";

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
    <div className="flex flex-col md:flex-row h-screen bg-[#F7F7F8] font-sans">
      <SidebarNav user={{ name: user.name, role: user.role }} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header - Ultra Minimal */}
        <header className="hidden md:flex h-14 bg-white border-b border-zinc-200 justify-between items-center px-6 shrink-0">
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