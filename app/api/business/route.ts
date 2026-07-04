import { auth } from "@/auth";
import {
  APPROVAL_PENDING,
  NO_BUSINESS,
  createSlugBase,
  getAccessibleBusiness,
  getSessionUser,
  isApprovedUser,
} from "@/lib/businessAccess";
import { compileSystemPrompt } from "@/lib/promptCompiler";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

const PROFILE_FIELDS = [
  "name",
  "type",
  "phone",
  "email",
  "city",
  "district",
  "address",
  "website",
  "calendarId",
  "welcome_message",
  "hours",
  "menu_or_services",
  "faqs",
  "staff",
  "services",
  "customers",
  "checkouts",
  "promotions",
  "bookingSettings",
  "botSettings",
  "is_active",
  "test_mode",
  "special_instructions",
] as const;

const EMPLOYEE_PROFILE_FIELDS = [
  "customers",
  "checkouts",
  "promotions",
] as const;

function sanitizeProfilePayload(
  body: Record<string, unknown>,
  fields: readonly string[] = PROFILE_FIELDS,
  includeDefaults = true,
) {
  const updateData: Record<string, unknown> = {};

  for (const field of fields) {
    if (body[field] !== undefined) updateData[field] = body[field];
  }

  if (updateData.hours && typeof updateData.hours === "string") {
    try {
      updateData.hours = JSON.parse(updateData.hours as string);
    } catch {
      updateData.hours = {};
    }
  }

  for (const field of ["faqs", "staff", "services", "customers", "checkouts"] as const) {
    if (updateData[field] && typeof updateData[field] === "string") {
      try {
        updateData[field] = JSON.parse(updateData[field] as string);
      } catch {
        updateData[field] = [];
      }
    }
  }

  for (const field of ["promotions", "bookingSettings", "botSettings"] as const) {
    if (updateData[field] && typeof updateData[field] === "string") {
      try {
        updateData[field] = JSON.parse(updateData[field] as string);
      } catch {
        updateData[field] = {};
      }
    }
  }

  if (updateData.is_active !== undefined) updateData.is_active = !!updateData.is_active;
  if (updateData.test_mode !== undefined) updateData.test_mode = !!updateData.test_mode;
  if (includeDefaults && !updateData.faqs) updateData.faqs = [];
  return updateData;
}

function businessInclude(includeConversations: boolean, includeMemberships: boolean) {
  return {
    conversations: includeConversations
      ? {
          orderBy: {
            updatedAt: "desc" as const,
          },
        }
      : false,
    appointments: {
      orderBy: {
        createdAt: "desc" as const,
      },
    },
    memberships: includeMemberships
      ? {
          where: { status: "ACTIVE" },
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
          orderBy: { createdAt: "asc" as const },
        }
      : false,
  };
}

async function requireDashboardUser() {
  const session = await auth();
  const sessionUser = session?.user as { id?: string; email?: string | null; role?: string | null } | undefined;
  const user = await getSessionUser(sessionUser?.id, sessionUser?.email);
  if (!user) return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!isApprovedUser(user)) {
    return {
      error: Response.json(
        { code: APPROVAL_PENDING, error: "Hesabınız onay bekliyor." },
        { status: 403 },
      ),
    };
  }
  return { user };
}

// GET /api/business - get business by owner/member session or public slug/id.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const id = searchParams.get("id");

  let business = null;
  let currentMembershipRole: "owner" | "employee" | undefined;

  if (slug || id) {
    const session = await auth();
    const sessionUser = session?.user as { id?: string; email?: string | null; role?: string | null } | undefined;
    const isAdmin = sessionUser?.role === "admin";

    let includeMemberships = false;
    if (id && !isAdmin) {
      const authResult = await requireDashboardUser();
      if (authResult.error) return authResult.error;
      const accessibleBusiness = await getAccessibleBusiness(authResult.user.id);
      if (!accessibleBusiness || accessibleBusiness.id !== id) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
      includeMemberships = true;
      currentMembershipRole =
        accessibleBusiness.membershipRole === "owner" ? "owner" : "employee";
    }

    business = await prisma.business.findFirst({
      where: slug ? { slug } : { id: id! },
      include: businessInclude(!!(isAdmin && id), !!(isAdmin && id) || includeMemberships),
    });
    if (isAdmin && id) currentMembershipRole = "owner";
  } else {
    const session = await auth();
    const sessionUser = session?.user as { id?: string; email?: string | null } | undefined;
    const user = await getSessionUser(sessionUser?.id, sessionUser?.email);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const accessibleBusiness = await getAccessibleBusiness(user.id);
    if (!accessibleBusiness) {
      return Response.json(
        { code: NO_BUSINESS, error: "İşletme profili bulunamadı." },
        { status: 404 },
      );
    }
    if (!isApprovedUser(user)) {
      return Response.json(
        { code: APPROVAL_PENDING, error: "Hesabınız onay bekliyor." },
        { status: 403 },
      );
    }

    business = await prisma.business.findUnique({
      where: { id: accessibleBusiness.id },
      include: businessInclude(true, true),
    });
    currentMembershipRole =
      accessibleBusiness.membershipRole === "owner" ? "owner" : "employee";
  }

  if (!business) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const compiledPrompt = compileSystemPrompt(
    business as any,
    {
      timeStr:
        new Date().toLocaleTimeString("tr-TR") +
        " " +
        new Date().toLocaleDateString("tr-TR"),
      roadmap: "Müşterinin takvim müsaitliği doğrulanıyor...",
    },
    "+905321234567",
  );

  return Response.json({
    ...business,
    currentMembershipRole,
    compiledPrompt,
  });
}

// POST /api/business - create or update the signed-in user's accessible business.
export async function POST(request: NextRequest) {
  const authResult = await requireDashboardUser();
  if (authResult.error) return authResult.error;

  const body = await request.json();
  const {
    id: _id,
    ownerId: _ownerId,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    owner: _owner,
    conversations: _conversations,
    appointments: _appointments,
    memberships: _memberships,
    compiledPrompt: _compiledPrompt,
    instagram_page_id: _igId,
    instagram_access_token: _igToken,
    ...rest
  } = body;

  const accessibleBusiness = await getAccessibleBusiness(authResult.user.id);

  if (accessibleBusiness) {
    const canManageSetup = accessibleBusiness.membershipRole === "owner";
    const payload = sanitizeProfilePayload(
      rest,
      canManageSetup ? PROFILE_FIELDS : EMPLOYEE_PROFILE_FIELDS,
      canManageSetup,
    );
    try {
      const business = await prisma.business.update({
        where: { id: accessibleBusiness.id },
        data: payload,
      });
      return Response.json(business);
    } catch (error: any) {
      console.error("Business update error:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }
  }

  const payload = sanitizeProfilePayload(rest);

  try {
    const name = String(payload.name || authResult.user.name || "İşletme").trim();
    const uniqueSlug = `${createSlugBase(name)}-${authResult.user.id.slice(-6)}`;
    const business = await prisma.$transaction(async (tx) => {
      const created = await tx.business.create({
        data: {
          ...payload,
          ownerId: authResult.user.id,
          name,
          slug: uniqueSlug,
          type: String(payload.type || "İşletme"),
          hours: payload.hours || {},
          menu_or_services: String(payload.menu_or_services || ""),
        } as any,
      });
      await tx.businessMembership.create({
        data: {
          businessId: created.id,
          userId: authResult.user.id,
          role: "owner",
          status: "ACTIVE",
        },
      });
      return created;
    });
    return Response.json(business, { status: 201 });
  } catch (error: any) {
    console.error("Business create error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/business - quick-save calendarId, is_active, and test_mode.
export async function PATCH(request: NextRequest) {
  const authResult = await requireDashboardUser();
  if (authResult.error) return authResult.error;

  try {
    const body = await request.json();
    const accessibleBusiness = await getAccessibleBusiness(authResult.user.id);

    if (!accessibleBusiness) {
      return Response.json({ error: "Business profile not found." }, { status: 404 });
    }
    if (accessibleBusiness.membershipRole !== "owner") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.calendarId !== undefined) updateData.calendarId = body.calendarId;
    if (body.is_active !== undefined) updateData.is_active = !!body.is_active;
    if (body.test_mode !== undefined) updateData.test_mode = !!body.test_mode;

    const updated = await prisma.business.update({
      where: { id: accessibleBusiness.id },
      data: updateData,
    });

    return Response.json(updated);
  } catch (error: any) {
    console.error("Business PATCH error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
