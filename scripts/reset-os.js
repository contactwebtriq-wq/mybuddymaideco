const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetOS() {
  console.log("Starting OS Data Reset...");
  try {
    // Delete in correct relational order to respect foreign keys
    console.log("Deleting Placements...");
    await prisma.placement.deleteMany();

    console.log("Deleting Requirements...");
    await prisma.requirement.deleteMany();

    console.log("Deleting Candidates (Workers)...");
    await prisma.candidate.deleteMany();

    console.log("Deleting Clients...");
    await prisma.client.deleteMany();

    // Note: We intentionally do NOT delete Users or Sessions 
    // so the admin does not get logged out of the Command Center!

    console.log("✅ Data wiped successfully! The OS is fresh.");
  } catch (error) {
    console.error("Reset failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

resetOS();
