import { getApiUser } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PATCH(request: Request) {
  const userId = (await getApiUser(request))?.id;

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { currentPassword, newPassword } = await request.json();

  if (!currentPassword || !newPassword) {
    return Response.json(
      { error: "Mevcut şifre ve yeni şifre gerekli." },
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
    where: { id: userId },
    select: { password_hash: true },
  });

  if (!user) {
    return Response.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
  }

  if (!user.password_hash) {
    return Response.json(
      { error: "Bu hesap Google ile giriş yapıyor; şifre değiştirilemez." },
      { status: 400 },
    );
  }

  const passwordMatches = await bcrypt.compare(
    String(currentPassword),
    user.password_hash,
  );

  if (!passwordMatches) {
    return Response.json({ error: "Mevcut şifre hatalı." }, { status: 400 });
  }

  const password_hash = await bcrypt.hash(String(newPassword), 12);
  await prisma.user.update({
    where: { id: userId },
    data: { password_hash },
  });

  return Response.json({ success: true });
}
