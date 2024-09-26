import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create an admin
  const admin = await prisma.admin.create({
    data: {
      username: 'adminUser',
      password: bcrypt.hashSync('adminPassword', 10), // Hash the admin password
    },
  });

  console.log('Admin created:', admin);

  // Create users
  const users = [
    {
      email: 'demo1@user.io',
      password: bcrypt.hashSync('password', 10), // Hash user password
      adminId: admin.id, // Associate user with the created admin
    },
    // Add more users if needed
  ];

  for (const user of users) {
    await prisma.user.create({
      data: user,
    });
  }

  console.log('Users created and associated with the admin');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
