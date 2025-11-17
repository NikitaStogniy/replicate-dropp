import NextAuth, { DefaultSession } from "next-auth";
import NeonAdapter from "@auth/neon-adapter";
import { Pool } from "@neondatabase/serverless";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { query, queryOne } from "./db";

// Extend NextAuth session type
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      teamId: string | null;
      isActive: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    teamId: string | null;
    isActive: boolean;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  return {
    adapter: NeonAdapter(pool),
    providers: [
      CredentialsProvider({
        name: "credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          // Find user by email
          const user = await queryOne<{
            id: string;
            email: string;
            password_hash: string;
            name: string | null;
            role: string;
            team_id: string | null;
            is_active: boolean;
          }>(
            'SELECT id, email, password_hash, name, role, team_id, is_active FROM users WHERE email = $1',
            [credentials.email]
          );

          if (!user) {
            return null;
          }

          // Check if user is active
          if (!user.is_active) {
            throw new Error('Account has been disabled');
          }

          // Verify password
          const passwordMatch = await bcrypt.compare(
            credentials.password as string,
            user.password_hash
          );

          if (!passwordMatch) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            teamId: user.team_id,
            isActive: user.is_active,
          };
        },
      }),
    ],
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          token.id = user.id;
          token.role = user.role;
          token.teamId = user.teamId;
          token.isActive = user.isActive;
        }
        return token;
      },
      async session({ session, token }) {
        if (session.user) {
          session.user.id = token.id as string;
          session.user.role = token.role as string;
          session.user.teamId = token.teamId as string | null;
          session.user.isActive = token.isActive as boolean;
        }
        return session;
      },
    },
    pages: {
      signIn: "/signin",
      error: "/signin",
    },
    session: {
      strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
  };
});
