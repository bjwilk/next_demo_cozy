import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function registerUser(email: string, password: string) {
  const hashedPassword = await bcrypt.hash(password, 10);
  return prisma.user.create({
    data: {
      email,
      password: hashedPassword,
    },
  });
}

export async function authenticateUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (user && await bcrypt.compare(password, user.password)) {
    // Authentication successful
    return { ...user, isAdmin: false };
  }
  // Authentication failed
  return null;
}

export async function authenticateAdmin(username: string, password: string) {
  // Fetch admin from the database
  const admin = await prisma.admin.findUnique({ where: { username } });

  if (admin && await bcrypt.compare(password, admin.password)) {
    // Admin authentication successful
    return { id: admin.id, username: admin.username, isAdmin: true };
  }
  // Admin authentication failed
  return null;
}

export async function authenticate(emailOrUsername: string, password: string) {
  // Try to authenticate as an admin using the username
  const adminUser = await authenticateAdmin(emailOrUsername, password);
  if (adminUser) {
    return adminUser;
  }

  // If admin authentication fails, check if it's a regular user by email
  return authenticateUser(emailOrUsername, password);
}

