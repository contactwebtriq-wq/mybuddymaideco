const { PrismaClient } = require('@prisma/client');
const { scryptSync, randomBytes } = require('crypto');

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  const usersToSetup = [
    {
      email: 'admin@mybuddymaid.com',
      password: 'Being_indexed.1.1.1',
      name: 'System Admin',
      role: 'ADMIN',
      twoFactorPin: '999999' // 6 digit PIN
    },
    {
      email: 'manager@mybuddymaid.com',
      password: 'Manager_Secure!2024',
      name: 'Operations Manager',
      role: 'MANAGER',
      twoFactorPin: '555555'
    },
    {
      email: 'employee@mybuddymaid.com',
      password: 'Emp_Access#2024',
      name: 'Desk Employee',
      role: 'EMPLOYEE',
      twoFactorPin: '111111'
    }
  ];

  for (const u of usersToSetup) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    
    if (existing) {
      await prisma.user.update({
        where: { email: u.email },
        data: {
          passwordHash: hashPassword(u.password),
          role: u.role,
          twoFactorPin: u.twoFactorPin,
          isTwoFactorEnabled: true,
          failedLoginAttempts: 0,
          lockedUntil: null
        }
      });
      console.log(`✅ Updated existing user: ${u.email}`);
    } else {
      await prisma.user.create({
        data: {
          email: u.email,
          passwordHash: hashPassword(u.password),
          name: u.name,
          role: u.role,
          twoFactorPin: u.twoFactorPin,
          isTwoFactorEnabled: true
        }
      });
      console.log(`✅ Created new user: ${u.email}`);
    }
  }

  console.log('\\n--- CREDENTIALS ---');
  for (const u of usersToSetup) {
    console.log(`Role: ${u.role}`);
    console.log(`Email: ${u.email}`);
    console.log(`Password: ${u.password}`);
    console.log(`2FA Secure PIN: ${u.twoFactorPin}`);
    console.log('-------------------');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });