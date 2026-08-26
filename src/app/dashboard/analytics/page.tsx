import { prisma } from "@/lib/db";
import { TrendingUp, Users, FileCheck, DollarSign, Activity, PieChart } from "lucide-react";

import { getSessionId } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AnalyticsPage() {
  const sessionId = await getSessionId();
  if (!sessionId) redirect('/login');
  const session = await prisma.session.findUnique({ where: { id: sessionId }, include: { user: true }});
  if (!session || session.user.role === 'EMPLOYEE') redirect('/dashboard');

  // Aggregate Data concurrently
  const [
    totalPlacements,
    activePlacements,
    totalCandidates,
    verifiedCandidates,
    totalClients
  ] = await Promise.all([
    prisma.placement.count(),
    prisma.placement.count({ where: { status: 'ACTIVE' } }),
    prisma.candidate.count(),
    prisma.candidate.count({ where: { isVerified: true, policeVerified: true } }),
    prisma.client.count()
  ]);

  // Aggregate Finances
  const placements = await prisma.placement.findMany();
  const collectedRevenue = placements.filter(p => p.feePaid).reduce((sum, p) => sum + p.placementFee, 0);
  const pendingRevenue = placements.filter(p => !p.feePaid).reduce((sum, p) => sum + p.placementFee, 0);
  
  // Ratios
  const placementRate = totalCandidates > 0 ? Math.round((totalPlacements / totalCandidates) * 100) : 0;
  const verificationRate = totalCandidates > 0 ? Math.round((verifiedCandidates / totalCandidates) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Analytics & Reporting</h1>
        <p className="text-gray-500 mt-1">Real-time enterprise metrics and business intelligence.</p>
      </div>

      {/* Financial Overview */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600" /> Revenue Forecast
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
            <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">Collected Revenue</p>
            <p className="text-4xl font-black text-green-900 mt-2">₹{collectedRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
            <p className="text-sm font-semibold text-amber-700 uppercase tracking-wide">Pending (In Trial)</p>
            <p className="text-4xl font-black text-amber-900 mt-2">₹{pendingRevenue.toLocaleString()}</p>
          </div>
        </div>
        
        {/* Revenue Progress Bar */}
        <div className="mt-8">
          <div className="flex justify-between text-sm font-bold text-gray-700 mb-2">
            <span>Collection Progress</span>
            <span>{Math.round((collectedRevenue / (collectedRevenue + pendingRevenue || 1)) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden border border-gray-200">
            <div 
              className="bg-green-500 h-4 rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${Math.max(5, Math.round((collectedRevenue / (collectedRevenue + pendingRevenue || 1)) * 100))}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Pipeline Analytics */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
           <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" /> Operational Pipeline
          </h2>
          <div className="space-y-6">
            
            <div>
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-sm font-bold text-gray-700">Total Registered Clients</p>
                  <p className="text-2xl font-black text-gray-900">{totalClients}</p>
                </div>
                <Users className="w-8 h-8 text-blue-100" />
              </div>
            </div>

            <div className="h-px bg-gray-100 w-full" />

            <div>
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-sm font-bold text-gray-700">Total Worker Placements</p>
                  <p className="text-2xl font-black text-gray-900">{totalPlacements}</p>
                </div>
                <FileCheck className="w-8 h-8 text-blue-100" />
              </div>
              <p className="text-xs text-gray-500 font-medium">{activePlacements} currently active (past trial)</p>
            </div>
          </div>
        </div>

        {/* Quality & Verification Metrics */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
           <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-purple-600" /> Worker Quality Metrics
          </h2>
          
          <div className="space-y-8">
            <div>
              <div className="flex justify-between text-sm font-bold text-gray-700 mb-2">
                <span>Fully Verified Candidates</span>
                <span>{verificationRate}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div className="bg-purple-500 h-3 rounded-full" style={{ width: `${verificationRate}%` }} />
              </div>
              <p className="text-xs text-gray-500 mt-2 font-medium">{verifiedCandidates} out of {totalCandidates} candidates hold verified Aadhaar & Police checks.</p>
            </div>

            <div>
              <div className="flex justify-between text-sm font-bold text-gray-700 mb-2">
                <span>Placement Success Rate</span>
                <span>{placementRate}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${placementRate}%` }} />
              </div>
              <p className="text-xs text-gray-500 mt-2 font-medium">{placementRate}% of registered candidates have been matched and placed with a client.</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}