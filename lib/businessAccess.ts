import { prisma } from "@/lib/prisma";

export const APPROVAL_PENDING = "APPROVAL_PENDING";
export const NO_BUSINESS = "NO_BUSINESS";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isApprovedUser(user?: { role?: string | null; approvalStatus?: string | null } | null) {
  return user?.role === "admin" || user?.approvalStatus === "APPROVED";
}

export async function getSessionUser(userId?: string | null, email?: string | null) {
  if (!userId && !email) return null;

  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        approvalStatus: true,
      },
    });
    if (user) return user;
  }

  if (!email) return null;
  return prisma.user.findUnique({
    where: { email: normalizeEmail(email) },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
      approvalStatus: true,
    },
  });
}

export async function getAccessibleBusiness(userId: string) {
  const ownedBusiness = await prisma.business.findFirst({
    where: { ownerId: userId },
    select: { id: true, slug: true, createdAt: true, botSettings: true },
    orderBy: { createdAt: "asc" },
  });

  if (ownedBusiness) {
    return { ...ownedBusiness, membershipRole: "owner" };
  }

  const membership = await prisma.businessMembership.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      business: { ownerId: { not: userId } },
    },
    select: {
      role: true,
      business: {
        select: { id: true, slug: true, createdAt: true, botSettings: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (!membership?.business) return null;
  return { ...membership.business, membershipRole: membership.role };
}

export async function canManageBusiness(userId: string, businessId: string) {
  const business = await prisma.business.findFirst({
    where: {
      id: businessId,
      OR: [
        { ownerId: userId },
        {
          memberships: {
            some: {
              userId,
              status: "ACTIVE",
              role: { in: ["owner", "employee"] },
            },
          },
        },
      ],
    },
    select: { id: true, ownerId: true, slug: true },
  });

  return business;
}

export function createSlugBase(input: string) {
  const ascii = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return ascii || "business";
}
