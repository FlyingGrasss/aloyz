import { getApiUser } from "@/lib/apiAuth";
import { normalizeEmail } from "@/lib/businessAccess";
import { hashInviteToken } from "@/lib/invites";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const user = await getApiUser(request);

  if (!user?.id || !user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { token } = await request.json();
  const rawToken = String(token || "").trim();
  if (!rawToken) {
    return NextResponse.json({ error: "Davet bağlantısı eksik." }, { status: 400 });
  }

  const invite = await prisma.businessInvite.findUnique({
    where: { tokenHash: hashInviteToken(rawToken) },
    include: {
      business: {
        select: { id: true, name: true, slug: true },
      },
    },
  });

  if (!invite || invite.status !== "PENDING") {
    return NextResponse.json({ error: "Davet geçersiz veya daha önce kullanılmış." }, { status: 400 });
  }

  if (invite.expiresAt.getTime() <= Date.now()) {
    await prisma.businessInvite.update({
      where: { id: invite.id },
      data: { status: "EXPIRED" },
    });
    return NextResponse.json({ error: "Davet süresi dolmuş." }, { status: 400 });
  }

  if (normalizeEmail(user.email) !== normalizeEmail(invite.email)) {
    return NextResponse.json(
      { error: `Bu davet ${invite.email} adresi için oluşturulmuş. Lütfen o Google hesabıyla giriş yapın.` },
      { status: 403 },
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.businessMembership.upsert({
      where: {
        businessId_userId: {
          businessId: invite.businessId,
          userId: user.id,
        },
      },
      update: {
        role: invite.role,
        status: "ACTIVE",
      },
      create: {
        businessId: invite.businessId,
        userId: user.id,
        role: invite.role,
        status: "ACTIVE",
      },
    });

    await tx.businessInvite.update({
      where: { id: invite.id },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
        acceptedById: user.id,
      },
    });

    await tx.user.update({
      where: { id: user.id },
      data: { approvalStatus: "APPROVED" },
    });
  });

  return NextResponse.json({
    business: invite.business,
    redirectTo: "/dashboard",
  });
}
