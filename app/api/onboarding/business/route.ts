import { getApiUser } from "@/lib/apiAuth";
import { createSlugBase, normalizeEmail } from "@/lib/businessAccess";
import { defaultAccessTill } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const sessionUser = await getApiUser(request);

  if (!sessionUser?.id || !sessionUser.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const name = String(body.name || "").trim();
  const type = String(body.type || "İşletme").trim() || "İşletme";
  const phone = String(body.phone || "").trim();
  const instagram = String(body.instagram || "")
    .trim()
    .replace(/^@+/, "");

  if (!name) {
    return NextResponse.json({ error: "İşletme adı zorunludur." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, email: true, approvalStatus: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const existingBusiness = await prisma.business.findFirst({
    where: { ownerId: user.id },
    select: { id: true, slug: true },
  });

  if (existingBusiness) {
    return NextResponse.json({ business: existingBusiness, approvalStatus: user.approvalStatus });
  }

  const business = await prisma.$transaction(async (tx) => {
    const uniqueSlug = `${createSlugBase(name)}-${user.id.slice(-6)}`;
    const now = new Date();
    const created = await tx.business.create({
      data: {
        ownerId: user.id,
        name,
        slug: uniqueSlug,
        type,
        phone,
        email: normalizeEmail(sessionUser.email || user.email),
        city: "",
        district: "",
        address: "",
        website: "",
        welcome_message: "",
        hours: {},
        menu_or_services: "",
        faqs: [],
        botSettings: {
          instagram: false,
          whatsapp: false,
          instagramUsername: instagram,
          hasAccessTill: defaultAccessTill(now).toISOString(),
        },
        is_active: false,
        test_mode: false,
      },
    });

    await tx.businessMembership.create({
      data: {
        businessId: created.id,
        userId: user.id,
        role: "owner",
        status: "ACTIVE",
      },
    });

    return created;
  });

  return NextResponse.json({ business, approvalStatus: user.approvalStatus }, { status: 201 });
}
