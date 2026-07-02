import { auth } from "@/auth";
import { createSlugBase, normalizeEmail } from "@/lib/businessAccess";
import { defaultAccessTill } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;

    if (!session || userRole !== "admin") {
      return NextResponse.json(
        { error: "Bu işlem sadece sistem yöneticileri tarafından gerçekleştirilebilir." },
        { status: 403 },
      );
    }

    const { email, name, type, phone, address, website, city, district } = await request.json();
    const normalizedEmail = normalizeEmail(String(email || ""));
    const businessName = String(name || "").trim();

    if (!normalizedEmail || !businessName) {
      return NextResponse.json(
        { error: "E-posta ve işletme adı zorunludur." },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.upsert({
        where: { email: normalizedEmail },
        update: {
          name: businessName,
          role: "business",
          approvalStatus: "APPROVED",
        },
        create: {
          email: normalizedEmail,
          name: businessName,
          role: "business",
          approvalStatus: "APPROVED",
        },
      });

      const existingBusiness = await tx.business.findFirst({
        where: { ownerId: user.id },
        select: { id: true, slug: true },
      });

      if (existingBusiness) {
        await tx.businessMembership.upsert({
          where: {
            businessId_userId: {
              businessId: existingBusiness.id,
              userId: user.id,
            },
          },
          update: { role: "owner", status: "ACTIVE" },
          create: {
            businessId: existingBusiness.id,
            userId: user.id,
            role: "owner",
            status: "ACTIVE",
          },
        });
        return { user, business: existingBusiness };
      }

      const uniqueSlug = `${createSlugBase(businessName)}-${user.id.slice(-6)}`;
      const now = new Date();
      const business = await tx.business.create({
        data: {
          ownerId: user.id,
          name: businessName,
          slug: uniqueSlug,
          type: type || "İşletme",
          phone: phone || "",
          email: normalizedEmail,
          city: city || "",
          district: district || "",
          address: address || "",
          website: website || "",
          welcome_message: "",
          hours: {},
          menu_or_services: "",
          faqs: [],
          botSettings: {
            instagram: false,
            whatsapp: false,
            hasAccessTill: defaultAccessTill(now).toISOString(),
          },
          is_active: false,
          test_mode: false,
        },
      });

      await tx.businessMembership.create({
        data: {
          businessId: business.id,
          userId: user.id,
          role: "owner",
          status: "ACTIVE",
        },
      });

      return { user, business };
    });

    return NextResponse.json(
      {
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
        },
        business: {
          id: result.business.id,
          slug: result.business.slug,
        },
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Signup Error:", error);
    return NextResponse.json({ error: "Sunucu hatası oluştu." }, { status: 500 });
  }
}
