import { prisma } from "@/lib/db";
import ClientMatchPage from "./ClientMatchPage";

export default async function MatchEngineWrapper() {
  // Fetch active, unfulfilled requirements to show in the UI
  const requirements = await prisma.requirement.findMany({
    where: { isFulfilled: false },
    include: { client: true },
    orderBy: { createdAt: 'desc' }
  });

  return <ClientMatchPage openRequirements={requirements} />;
}