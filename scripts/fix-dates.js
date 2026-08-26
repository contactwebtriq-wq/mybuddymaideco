const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log("Fetching original booking dates from external database...");
  
  // Hardcoding the env vars here just for this one-off script based on the .env we set earlier
  const url = "https://irqsjuwkbcmnooyivakq.supabase.co";
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlycXNqdXdrYmNtbm9veWl2YWtxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTIwMzcyMywiZXhwIjoyMDk0Nzc5NzIzfQ.KaxS-oizdFwlpBazTS15lVVcmgHmA8VrWocgd4RHBSk";

  try {
    const response = await fetch(`${url}/rest/v1/bookings?status=eq.pending`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });

    const bookings = await response.json();
    let updatedCount = 0;

    for (const b of bookings) {
      if (!b.email) continue;
      
      const originalDate = new Date(b.updated_at || b.created_at);

      // Update the Client
      const client = await prisma.client.findFirst({ where: { email: b.email } });
      if (client) {
        await prisma.client.update({
          where: { id: client.id },
          data: { createdAt: originalDate, updatedAt: originalDate }
        });

        // Update their Requirements
        await prisma.requirement.updateMany({
          where: { clientId: client.id },
          data: { createdAt: originalDate }
        });

        updatedCount++;
      }
    }

    console.log(`✅ Successfully corrected historical timestamps for ${updatedCount} imported leads!`);

  } catch (error) {
    console.error("Failed to fix dates:", error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
