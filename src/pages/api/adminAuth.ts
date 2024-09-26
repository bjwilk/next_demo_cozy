import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { username, password } = req.body;

    try {
      // Find user by email
      const admin = await prisma.admin.findUnique({ where: { username } });

      if (admin && bcrypt.compareSync(password, admin.password)) {
        // Successful authentication
        res.status(200).json({ authenticated: true });
      } else {
        // Authentication failed
        res.status(401).json({ authenticated: false });
      }
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    } finally {
      await prisma.$disconnect();
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
