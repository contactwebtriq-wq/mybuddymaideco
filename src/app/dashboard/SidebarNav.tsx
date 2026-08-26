'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Briefcase, FileCheck, DollarSign, Home, LogOut, PieChart, Shield, Menu, X } from 'lucide-react';
import { logout } from '@/actions/auth';

export default function SidebarNav({ user }: { user: { name: string; role: string } }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const closeMenu = () => setIsOpen(false);

  const NavContent = () => (
    <>
      <div className="h-14 px-6 flex items-center justify-between border-b border-white/5 shrink-0">
        <div className="flex items-center">
          <Shield className="w-5 h-5 text-blue-500 mr-2" strokeWidth={2.5} />
          <h1 className="text-sm font-semibold text-zinc-100 tracking-tight">MyBuddyMaid</h1>
          <span className="ml-2 text-[10px] font-bold bg-white/10 text-zinc-400 px-1.5 py-0.5 rounded uppercase tracking-wider">OS</span>
        </div>
        <button onClick={closeMenu} className="md:hidden text-zinc-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <nav className="flex-1 px-3 space-y-0.5 mt-4 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Dashboard</div>
        <Link onClick={closeMenu} href="/dashboard" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium ${pathname === '/dashboard' ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-zinc-100 text-zinc-400'}`}>
          <Home className="w-4 h-4" />
          <span>Overview</span>
        </Link>
        
        {(user.role === 'ADMIN' || user.role === 'MANAGER') && (
          <Link onClick={closeMenu} href="/dashboard/analytics" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium ${pathname === '/dashboard/analytics' ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-zinc-100 text-zinc-400'}`}>
            <PieChart className="w-4 h-4" />
            <span>Analytics Hub</span>
          </Link>
        )}
        
        <div className="px-3 pt-6 pb-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Operations</div>
        <Link onClick={closeMenu} href="/dashboard/match" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium ${pathname === '/dashboard/match' ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-zinc-100 text-zinc-400'}`}>
          <Users className="w-4 h-4" />
          <span>Smart Match Engine</span>
        </Link>
        <Link onClick={closeMenu} href="/dashboard/candidates" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium ${pathname === '/dashboard/candidates' ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-zinc-100 text-zinc-400'}`}>
          <Users className="w-4 h-4" />
          <span>Candidates CRM</span>
        </Link>
        <Link onClick={closeMenu} href="/dashboard/clients" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium ${pathname === '/dashboard/clients' ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-zinc-100 text-zinc-400'}`}>
          <Briefcase className="w-4 h-4" />
          <span>Client Leads</span>
        </Link>

        {(user.role === 'ADMIN' || user.role === 'MANAGER') && (
          <>
            <div className="px-3 pt-6 pb-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Management</div>
            <Link onClick={closeMenu} href="/dashboard/placements" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium ${pathname === '/dashboard/placements' ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-zinc-100 text-zinc-400'}`}>
              <FileCheck className="w-4 h-4" />
              <span>Placements & Trials</span>
            </Link>
            <Link onClick={closeMenu} href="/dashboard/finance" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium ${pathname === '/dashboard/finance' ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-zinc-100 text-zinc-400'}`}>
              <DollarSign className="w-4 h-4" />
              <span>Fees & Finance</span>
            </Link>
          </>
        )}

        {user.role === 'ADMIN' && (
          <>
            <div className="px-3 pt-6 pb-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">System</div>
            <Link onClick={closeMenu} href="/dashboard/security" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium ${pathname === '/dashboard/security' ? 'bg-white/10 text-emerald-400' : 'hover:bg-white/5 hover:text-emerald-400 text-zinc-400'}`}>
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>Cybersecurity</span>
            </Link>
          </>
        )}
      </nav>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-white/5 shrink-0">
        <div className="flex items-center gap-3 bg-white/5 p-2 rounded-md border border-white/5">
          <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-xs font-semibold text-zinc-200 truncate">{user.name}</span>
            <span className="text-[10px] text-zinc-500 uppercase">{user.role}</span>
          </div>
          <form action={logout}>
            <button type="submit" className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-white/5 rounded transition-colors shrink-0" title="Log out">
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between bg-[#0E1116] h-14 px-4 border-b border-zinc-800 shrink-0">
        <div className="flex items-center">
          <Shield className="w-5 h-5 text-blue-500 mr-2" strokeWidth={2.5} />
          <h1 className="text-sm font-semibold text-zinc-100">MyBuddyMaid</h1>
        </div>
        <button onClick={() => setIsOpen(true)} className="text-zinc-300 hover:text-white p-1">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={closeMenu} />
      )}

      {/* Sidebar - Desktop & Mobile */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0E1116] text-zinc-300 flex flex-col border-r border-zinc-800 transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <NavContent />
      </aside>
    </>
  );
}
