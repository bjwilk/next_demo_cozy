// src/types/next-auth.d.ts
import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      username?: string | null;
      isAdmin?: boolean; // Add the isAdmin property here
    };
  }
}
