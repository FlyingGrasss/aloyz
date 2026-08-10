import { compare } from "bcryptjs";
import { normalizeEmail } from "@/lib/businessAccess";
import { prisma } from "@/lib/prisma";

export async function authenticatePassword(emailInput: string, passwordInput: string) {
  const email = normalizeEmail(emailInput);
  const password = passwordInput;
  if (!email || !password || !email.includes("@")) return null;

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
      approvalStatus: true,
      password_hash: true,
    },
  });

  if (!user?.password_hash || !(await compare(password, user.password_hash))) {
    return null;
  }

  const { password_hash: _passwordHash, ...safeUser } = user;
  return safeUser;
}
