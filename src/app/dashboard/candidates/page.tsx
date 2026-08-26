import { prisma } from "@/lib/db";
import CandidatesClientPage from "./ClientPage";

export default async function CandidatesPage() {
  // Fetch real data from the database, including their active placement context
  const candidates = await prisma.candidate.findMany({
    include: {
      placements: {
        where: { status: { in: ['ACTIVE', 'TRIAL'] } },
        include: { client: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Safe casting logic avoiding 'any'
  return <CandidatesClientPage initialCandidates={candidates as unknown as React.ComponentProps<typeof CandidatesClientPage>['initialCandidates']} />;
}