import { getApiUser } from "@/lib/apiAuth";
import { normalizeEmail } from "@/lib/businessAccess";
import { escapeHtml, sendAloyzEmail } from "@/lib/email";
import { createInviteToken, hashInviteToken, inviteExpiresAt } from "@/lib/invites";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

async function getInviteBusiness(request: NextRequest) {
  const user = await getApiUser(request);
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const requestedBusinessId = request.nextUrl.searchParams.get("businessId");
  const business = requestedBusinessId && user.role === "admin"
    ? await prisma.business.findUnique({
        where: { id: requestedBusinessId },
        select: { id: true, name: true, ownerId: true },
      })
    : await prisma.business.findFirst({
        where: {
          OR: [
            { ownerId: user.id },
            {
              memberships: {
                some: {
                  userId: user.id,
                  role: "owner",
                  status: "ACTIVE",
                },
              },
            },
          ],
        },
        select: { id: true, name: true, ownerId: true },
      });

  if (!business) {
    return { error: NextResponse.json({ error: "Business not found" }, { status: 404 }) };
  }

  const ownerMembership =
    business.ownerId === user.id
      ? true
      : await prisma.businessMembership.findFirst({
          where: {
            businessId: business.id,
            userId: user.id,
            role: "owner",
            status: "ACTIVE",
          },
          select: { id: true },
        });
  const canInvite = user.role === "admin" || !!ownerMembership;
  if (!canInvite) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { user, business };
}

export async function GET(request: NextRequest) {
  const result = await getInviteBusiness(request);
  if (result.error) return result.error;

  const [memberships, invites] = await Promise.all([
    prisma.businessMembership.findMany({
      where: { businessId: result.business.id, status: "ACTIVE" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            approvalStatus: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.businessInvite.findMany({
      where: {
        businessId: result.business.id,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({ memberships, invites });
}

export async function POST(request: NextRequest) {
  const result = await getInviteBusiness(request);
  if (result.error) return result.error;

  const body = await request.json();
  const email = normalizeEmail(String(body.email || ""));
  const role = String(body.role || "employee") === "owner" ? "owner" : "employee";

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Geçerli bir e-posta adresi girin." }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    const existingMembership = await prisma.businessMembership.findUnique({
      where: {
        businessId_userId: {
          businessId: result.business.id,
          userId: existingUser.id,
        },
      },
      select: { id: true, status: true },
    });
    if (existingMembership?.status === "ACTIVE") {
      const membership = await prisma.businessMembership.update({
        where: { id: existingMembership.id },
        data: { role, status: "ACTIVE" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              approvalStatus: true,
            },
          },
        },
      });
      return NextResponse.json({ membership, invite: null, alreadyMember: true });
    }
    if (existingMembership?.status === "ACTIVE") {
      return NextResponse.json({ error: "Bu kullanıcı zaten işletmeye ekli." }, { status: 400 });
    }
  }

  await prisma.businessInvite.updateMany({
    where: {
      businessId: result.business.id,
      email,
      status: "PENDING",
    },
    data: { status: "REVOKED" },
  });

  const token = createInviteToken();
  const invite = await prisma.businessInvite.create({
    data: {
      businessId: result.business.id,
      email,
      role,
      tokenHash: hashInviteToken(token),
      expiresAt: inviteExpiresAt(),
      invitedById: result.user.id,
    },
  });

  const acceptUrl = `${request.nextUrl.origin}/invite/accept?token=${encodeURIComponent(token)}`;
  const businessName = escapeHtml(result.business.name || "Aloyz");
  const html = `
    <div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#111827">
      <h1 style="font-size:20px;margin:0 0 12px">Aloyz davetiniz var</h1>
      <p style="margin:0 0 16px">${businessName} sizi Aloyz işletme paneline davet etti.</p>
      <p style="margin:0 0 20px">Davet 14 gün geçerlidir. Devam etmek için Google hesabınızla giriş yapın.</p>
      <a href="${acceptUrl}" style="display:inline-block;background:#111827;color:#fff;padding:10px 14px;border-radius:8px;text-decoration:none;font-weight:700">Daveti kabul et</a>
      <p style="margin:20px 0 0;color:#6b7280;font-size:12px">Buton çalışmazsa bu bağlantıyı tarayıcınıza yapıştırın: ${acceptUrl}</p>
    </div>
  `;

  try {
    await sendAloyzEmail({
      from: "hello",
      senderName: "Aloyz",
      to: email,
      subject: `${result.business.name} Aloyz daveti`,
      html,
      userId: result.user.id,
    });
  } catch (error: any) {
    await prisma.businessInvite.update({
      where: { id: invite.id },
      data: { status: "REVOKED" },
    });
    return NextResponse.json({ error: error.message || "Davet e-postası gönderilemedi." }, { status: 500 });
  }

  return NextResponse.json({
    invite: {
      id: invite.id,
      email: invite.email,
      role: invite.role,
      status: invite.status,
      expiresAt: invite.expiresAt,
      createdAt: invite.createdAt,
    },
  }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const result = await getInviteBusiness(request);
  if (result.error) return result.error;

  const body = await request.json().catch(() => ({}));
  const email = normalizeEmail(String(body.email || ""));

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Geçerli bir e-posta adresi girin." }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  await prisma.businessInvite.updateMany({
    where: {
      businessId: result.business.id,
      email,
      status: "PENDING",
    },
    data: { status: "REVOKED" },
  });

  if (existingUser) {
    await prisma.businessMembership.updateMany({
      where: {
        businessId: result.business.id,
        userId: existingUser.id,
      },
      data: { status: "REMOVED" },
    });
  }

  return NextResponse.json({ ok: true });
}
