import { getApiUser } from "@/lib/apiAuth";
import { normalizeEmail } from "@/lib/businessAccess";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

async function getInviteUser(request: Request) {
  const user = await getApiUser(request);
  if (!user?.id || !user.email) return null;
  return user;
}

export async function GET(request: Request) {
  const user = await getInviteUser(request);
  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invites = await prisma.businessInvite.findMany({
    where: {
      email: normalizeEmail(user.email),
      status: "PENDING",
      expiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      email: true,
      role: true,
      expiresAt: true,
      createdAt: true,
      business: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ invites });
}

export async function POST(request: Request) {
  const user = await getInviteUser(request);
  if (!user?.id || !user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { inviteId } = await request.json().catch(() => ({}));
  const id = String(inviteId || "").trim();
  if (!id) {
    return NextResponse.json({ error: "Davet seçilmedi." }, { status: 400 });
  }

  const invite = await prisma.businessInvite.findFirst({
    where: {
      id,
      email: normalizeEmail(user.email),
      status: "PENDING",
    },
    include: {
      business: {
        select: { id: true, name: true, slug: true },
      },
    },
  });

  if (!invite) {
    return NextResponse.json(
      { error: "Davet bulunamadı veya daha önce kullanıldı." },
      { status: 404 },
    );
  }

  if (invite.expiresAt.getTime() <= Date.now()) {
    await prisma.businessInvite.update({
      where: { id: invite.id },
      data: { status: "EXPIRED" },
    });
    return NextResponse.json({ error: "Davet süresi dolmuş." }, { status: 400 });
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
