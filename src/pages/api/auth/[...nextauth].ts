import NextAuth, { NextAuthOptions, User as NextAuthUser } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { JWT } from 'next-auth/jwt';

const prisma = new PrismaClient();

interface CustomUser {
  id: string;
  email?: string | null;
  username?: string | null;
  isAdmin?: boolean;
}

interface CustomJWT extends JWT {
  id: string;
  email?: string | null;
  username?: string | null;
  isAdmin?: boolean;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: 'Email', type: 'text' },
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials) return null;

        const { email, username, password } = credentials;

        let user: CustomUser | null = null;

        // Check if email is provided (regular user login)
        if (email) {
          user = await prisma.user.findUnique({
            where: { email },
          });

          // Ensure user and password are defined
          // The error occurs because the 'password' property is not defined in the CustomUser interface.
          // We need to access the password from the User model returned by Prisma, not from CustomUser.
          // Let's cast the user to any to bypass TypeScript's type checking for this specific property.
          if (user && (user as any).password && await bcrypt.compare(password, (user as any).password)) {
            return { id: user.id, email: user.email, isAdmin: false };
          }
        }

        // Check if username is provided (admin login)
        if (username) {
          const admin = await prisma.admin.findUnique({
            where: { username },
          });

          // Ensure admin and password are defined
          if (admin && admin.password && await bcrypt.compare(password, admin.password)) {
            return { id: admin.id, username: admin.username, isAdmin: true };
          }
        }

        return null; // Return null if authentication fails
      },
    }),
  ],
  pages: {
    signIn: '/enter', // Set a single default sign-in page
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: CustomUser | null }) {
      if (user) {
        token.id = user.id;
        token.email = user.email || null;
        token.username = user.username || null; // Ensure username is accessed correctly
        token.isAdmin = user.isAdmin;
      }
      return token as CustomJWT; // Cast token to CustomJWT
    },
    async session({ session, token }: { session: any; token: JWT }): Promise<any> {
      session.user = {
        id: token.id,
        email: token.email || null,
        username: token.username || null,
        isAdmin: token.isAdmin,
      };
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
