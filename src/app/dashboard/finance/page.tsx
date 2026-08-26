import { prisma } from "@/lib/db";
import FinanceClientPage from "./FinanceClientPage";

import { getSessionId } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function FinancePage() {
  const sessionId = await getSessionId();
  if (!sessionId) redirect('/login');
  const session = await prisma.session.findUnique({ where: { id: sessionId }, include: { user: true }});
  if (!session || session.user.role === 'EMPLOYEE') redirect('/dashboard');

  const placements = await prisma.placement.findMany({
    include: { candidate: true, client: true },
    orderBy: { createdAt: 'desc' }
  });

  return <FinanceClientPage placements={placements} />;
}