import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      if (!profile?.email) return false;
      const emailVerified = (profile as { email_verified?: boolean }).email_verified;
      return emailVerified !== false;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }

      if (!token.id && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: { id: true },
        });
        if (dbUser) token.id = dbUser.id;
      }

      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, approvalStatus: true },
        });
        token.role = dbUser?.role ?? "business";
        token.approvalStatus = dbUser?.approvalStatus ?? "PENDING";
      }

      return token;
    },
    session({ session, token }) {
      (session.user as any).id = token.id as string;
      (session.user as any).role = token.role as string;
      (session.user as any).approvalStatus = token.approvalStatus as string;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});
