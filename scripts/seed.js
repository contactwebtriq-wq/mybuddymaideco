const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning database...");
  await prisma.placement.deleteMany();
  await prisma.requirement.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.client.deleteMany();

  console.log("Seeding real candidate profiles into Database...");
  
  const candidates = await prisma.candidate.createMany({
    data: [
      { firstName: "Aarav", lastName: "Patel", phone: "+919876543210", roleCategory: "COOK", workType: "LIVE_IN", salaryExpected: 18000, isVerified: true, policeVerified: true, status: "AVAILABLE" },
      { firstName: "Sunita", lastName: "Devi", phone: "+919876543211", roleCategory: "MAID", workType: "EIGHT_HOUR", salaryExpected: 12000, isVerified: true, policeVerified: false, status: "AVAILABLE" },
      { firstName: "Rani", lastName: "Kaur", phone: "+919876543212", roleCategory: "NANNY", workType: "TWELVE_HOUR", salaryExpected: 22000, isVerified: true, policeVerified: true, status: "PLACED" },
      { firstName: "Vikram", lastName: "Singh", phone: "+919876543213", roleCategory: "CAREGIVER", workType: "LIVE_IN", salaryExpected: 25000, isVerified: false, policeVerified: false, status: "PENDING_VERIFICATION" },
      { firstName: "Lakshmi", lastName: "Iyer", phone: "+919876543214", roleCategory: "COOK", workType: "EIGHT_HOUR", salaryExpected: 15000, isVerified: true, policeVerified: true, status: "AVAILABLE" },
    ]
  });

  console.log("Seeding clients & requirements...");
  const client1 = await prisma.client.create({
    data: {
      fullName: "Rajesh Sharma",
      phone: "+919998887776",
      email: "rajesh.sharma@example.com",
      address: "101, Horizon Towers",
      city: "Mumbai",
      requirements: {
        create: {
          requestedRole: "MAID",
          requestedType: "LIVE_IN",
          budgetMax: 20000,
          notes: "Needs to know how to manage large apartments."
        }
      }
    }
  });

  console.log("Database successfully seeded with LIVE data objects!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
