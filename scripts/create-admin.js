const { PrismaClient } = require('@prisma/client');
const { scryptSync, randomBytes } = require('crypto');

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  const email = 'admin@mybuddymaid.com';
  const password = 'AdminPassword123!';
  
  // Check if admin already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  
  if (existing) {
    console.log(`Admin user ${email} already exists!`);
    return;
  }

  await prisma.user.create({
    data: {
      email,
      passwordHash: hashPassword(password),
      name: 'System Admin',
      role: 'ADMIN'
    }
  });

  console.log('✅ Admin user created securely!');
  console.log(`📧 Email: ${email}`);
  console.log(`🔑 Password: ${password}`);
  console.log('You can now log in at http://localhost:3000/login');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });