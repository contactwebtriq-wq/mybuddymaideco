import { prisma } from "@/lib/db";
import ClientsClientPage from "./ClientPage";

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    include: { requirements: true },
    orderBy: { createdAt: 'desc' } // SORT: Newest first based on Time and Date
  });

  return <ClientsClientPage initialClients={clients} />;
}