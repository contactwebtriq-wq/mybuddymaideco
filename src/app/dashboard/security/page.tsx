import { prisma } from "@/lib/db";
import { Shield, AlertTriangle, UserX, Activity } from "lucide-react";
import { getSessionId } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: 'Cybersecurity System | MyBuddyMaid',
};

export default async function SecurityDashboard() {
  const sessionId = await getSessionId();
  if (!sessionId) redirect('/login');

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true }
  });

  if (!session || session.user.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-zinc-800">Access Denied</h2>
        <p className="text-zinc-500">You must be an Administrator to view the Cybersecurity Dashboard.</p>
      </div>
    );
  }

  if (!session.sudoExpiresAt || session.sudoExpiresAt < new Date()) {
    redirect('/dashboard/security/verify');
  }

  // Fetch Security Stats
  const recentLogs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { user: true }
  });
  // eslint-disable-next-line react-hooks/purity
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const failedLoginsCount = await prisma.auditLog.count({
    where: {
      action: 'FAILED_LOGIN',
      createdAt: { gte: oneDayAgo } // last 24 hours
    }
  });

  const lockedAccountsCount = await prisma.user.count({
    where: {
      lockedUntil: { gt: new Date() }
    }
  });

  const activeSessions = await prisma.session.count({
    where: { expiresAt: { gt: new Date() } }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-600" />
            Cybersecurity Command Center
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Real-time threat monitoring and system health.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold">DEFENSE ACTIVE</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 text-red-600 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-semibold text-sm">Threats Blocked (24h)</h3>
          </div>
          <p className="text-3xl font-bold text-zinc-900">{failedLoginsCount}</p>
          <p className="text-xs text-zinc-500 mt-1">Failed login attempts</p>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 text-amber-600 mb-2">
            <UserX className="w-5 h-5" />
            <h3 className="font-semibold text-sm">Locked Accounts</h3>
          </div>
          <p className="text-3xl font-bold text-zinc-900">{lockedAccountsCount}</p>
          <p className="text-xs text-zinc-500 mt-1">Due to suspicious activity</p>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 text-blue-600 mb-2">
            <Activity className="w-5 h-5" />
            <h3 className="font-semibold text-sm">Active Sessions</h3>
          </div>
          <p className="text-3xl font-bold text-zinc-900">{activeSessions}</p>
          <p className="text-xs text-zinc-500 mt-1">Currently verified connections</p>
        </div>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden mt-8">
        <div className="px-5 py-4 border-b bg-zinc-50/50">
          <h2 className="font-semibold text-zinc-800 text-sm">System Audit Log</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-zinc-500 bg-zinc-50 border-b uppercase">
              <tr>
                <th className="px-5 py-3 font-medium">Timestamp</th>
                <th className="px-5 py-3 font-medium">Action</th>
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">IP Address</th>
                <th className="px-5 py-3 font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {recentLogs.map(log => (
                <tr key={log.id} className="hover:bg-zinc-50/50">
                  <td className="px-5 py-3 text-zinc-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.action === 'FAILED_LOGIN' ? 'bg-red-100 text-red-700' :
                      log.action === 'SUCCESSFUL_LOGIN' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-zinc-700 font-medium">
                    {log.user ? log.user.email : 'System / Unknown'}
                  </td>
                  <td className="px-5 py-3 text-zinc-500 font-mono text-xs">
                    {log.ipAddress || 'Unknown'}
                  </td>
                  <td className="px-5 py-3 text-zinc-600 text-xs">
                    {log.details || '-'}
                  </td>
                </tr>
              ))}
              {recentLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-zinc-500">
                    No security events recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
