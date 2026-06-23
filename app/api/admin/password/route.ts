import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  const session = await auth();
  const userRole = (session?.user as any)?.role;

  if (!session || userRole !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, newPassword } = await request.json();

  if (!userId || !newPassword) {
    return Response.json(
      { error: "userId ve yeni şifre gerekli." },
      { status: 400 },
    );
  }

  if (String(newPassword).length < 8) {
    return Response.json(
      { error: "Yeni şifre en az 8 karakter olmalı." },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: String(userId) },
    select: { id: true, email: true },
  });

  if (!user) {
    return Response.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
  }

  const password_hash = await bcrypt.hash(String(newPassword), 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { password_hash },
  });

  return Response.json({ success: true, email: user.email });
}
