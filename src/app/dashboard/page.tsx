import { Users, FileCheck, ShieldAlert, ArrowRight, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function DashboardOverview() {
  const [
    activePlacements, 
    pendingVerifications, 
    availableCandidates,
    latestClientRequirements
  ] = await Promise.all([
    prisma.placement.count({ where: { status: 'ACTIVE' } }),
    prisma.candidate.count({ where: { status: 'PENDING_VERIFICATION' } }),
    prisma.candidate.count({ where: { status: 'AVAILABLE' } }),
    prisma.requirement.findMany({ 
      where: { isFulfilled: false },
      include: { client: true },
      take: 5,
      orderBy: { createdAt: 'desc' }
    })
  ]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex justify-between items-end mb-8 border-b border-zinc-200 pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Overview</h1>
          <p className="text-sm text-zinc-500 mt-1">Real-time system metrics and operational alerts.</p>
        </div>
        <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* KPI Grid - High Density, Crisp */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-lg border border-zinc-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Active Placements</p>
            <FileCheck className="w-4 h-4 text-zinc-400" />
          </div>
          <div>
            <p className="text-3xl font-semibold text-zinc-900 tracking-tight">{activePlacements}</p>
            <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
              <span className="text-emerald-600 font-medium">+2%</span> from last week
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-zinc-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Pending Verification</p>
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <p className="text-3xl font-semibold text-zinc-900 tracking-tight">{pendingVerifications}</p>
            <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
              Requires documentation
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-zinc-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Available Pool</p>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-3xl font-semibold text-zinc-900 tracking-tight">{availableCandidates}</p>
            <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
              Verified and ready for matching
            </p>
          </div>
        </div>
      </div>

      {/* Action Items - List View rather than huge cards */}
      <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-200 flex justify-between items-center bg-zinc-50/50">
          <h2 className="text-sm font-semibold text-zinc-900">Requires Attention: Live Leads</h2>
          <Link href="/dashboard/clients" className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
            View CRM &rarr;
          </Link>
        </div>
        
        <div className="divide-y divide-zinc-100">
          {latestClientRequirements.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-zinc-500 font-medium">No pending client requirements.</p>
            </div>
          ) : (
            latestClientRequirements.map((req) => (
              <div key={req.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 hover:bg-zinc-50/50 transition-colors gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-zinc-900 text-sm">{req.client.fullName}</h3>
                    <span className="bg-blue-50 text-blue-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-blue-200 uppercase tracking-wider">
                      New Lead
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 font-medium">
                    Requested: <span className="text-zinc-700">{req.requestedType.replace('_', ' ')} {req.requestedRole}</span>
                  </p>
                  <p className="text-xs text-zinc-400">
                    Max Budget: ₹{req.budgetMax} • Source: External Sync
                  </p>
                </div>
                
                <Link 
                  href="/dashboard/match" 
                  className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 px-3 py-1.5 rounded-md transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Run Match Engine <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}