import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { createDb } from '@/lib/server/db';
import { createContainer } from '@/lib/services';

/** Auth.js requires a secret; use AUTH_SECRET in all real environments. */
function resolveAuthSecret(): string | undefined {
  if (process.env.AUTH_SECRET?.trim()) return process.env.AUTH_SECRET.trim();
  if (process.env.NODE_ENV === 'development') {
    // Local-only fallback so `pnpm dev` works without .env.local; never used in production.
    return 'local-dev-auth-secret-min-32-chars-do-not-use-in-prod';
  }
  return undefined;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: resolveAuthSecret(),
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;
        try {
          const db = createDb();
          const { authService } = createContainer(db);
          const user = await authService.signIn(email, password);
          return {
            id: user.id,
            email: user.email ?? undefined,
            name: user.name,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = (token.name as string) ?? session.user.name;
        session.user.email = (token.email as string) ?? session.user.email;
      }
      return session;
    },
  },
});

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
  interface User {
    id: string;
  }
}

