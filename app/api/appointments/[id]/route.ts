import { getApiUser } from "@/lib/apiAuth";
import {
  APPROVAL_PENDING,
  getAccessibleBusiness,
  isApprovedUser,
} from "@/lib/businessAccess";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

const ALLOWED_STATUSES = new Set(["REQUESTED", "CONFIRMED", "COMPLETED", "CANCELED"]);

type RouteContext = {
  params: Promise<{ id: string }>;
};

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function cleanText(value: unknown, maxLength: number) {
  return String(value || "").trim().slice(0, maxLength);
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  const user = await getApiUser(request);
  const userId = user?.id;
  const userRole = user?.role;

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isApprovedUser(user)) {
    return Response.json(
      { code: APPROVAL_PENDING, error: "Hesabınız onay bekliyor." },
      { status: 403 },
    );
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  if (body.status !== undefined) {
    const status = String(body.status || "").toUpperCase();
    if (!ALLOWED_STATUSES.has(status)) {
      return Response.json({ error: "Invalid status" }, { status: 400 });
    }
    data.status = status;
  }

  if (body.customerName !== undefined) {
    const customerName = cleanText(body.customerName, 120);
    if (!customerName) {
      return Response.json({ error: "Customer name is required" }, { status: 400 });
    }
    data.customerName = customerName;
  }

  if (body.phone !== undefined) {
    data.phone = cleanText(body.phone, 32);
  }

  if (body.description !== undefined) {
    data.description = cleanText(body.description, 2000);
  }

  if (body.date !== undefined) {
    const date = String(body.date || "").trim();
    if (!isValidDate(date)) {
      return Response.json({ error: "Invalid date" }, { status: 400 });
    }
    data.date = date;
  }

  if (body.time !== undefined) {
    const time = String(body.time || "").trim();
    if (!isValidTime(time)) {
      return Response.json({ error: "Invalid time" }, { status: 400 });
    }
    data.time = time;
  }

  for (const field of ["serviceId", "staffId"] as const) {
    if (body[field] !== undefined) {
      data[field] = body[field] ? String(body[field]) : null;
    }
  }

  if (Object.keys(data).length === 0) {
    return Response.json({ error: "No fields to update" }, { status: 400 });
  }

  const appointment = await prisma.appointmentTrack.findUnique({
    where: { id },
    select: { id: true, businessId: true },
  });

  if (!appointment) {
    return Response.json({ error: "Appointment not found" }, { status: 404 });
  }

  if (userRole !== "admin") {
    const accessibleBusiness = await getAccessibleBusiness(userId);
    if (!accessibleBusiness || accessibleBusiness.id !== appointment.businessId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const business = await prisma.business.findUnique({
    where: { id: appointment.businessId },
    select: { services: true, staff: true },
  });
  const services = Array.isArray(business?.services)
    ? (business.services as Array<{ id?: string }>)
    : [];
  const staff = Array.isArray(business?.staff)
    ? (business.staff as Array<{ id?: string }>)
    : [];

  if (
    data.serviceId !== undefined &&
    data.serviceId !== null &&
    !services.some((service) => service.id === data.serviceId)
  ) {
    return Response.json({ error: "Invalid service" }, { status: 400 });
  }
  if (
    data.staffId !== undefined &&
    data.staffId !== null &&
    !staff.some((member) => member.id === data.staffId)
  ) {
    return Response.json({ error: "Invalid staff" }, { status: 400 });
  }

  const updated = await prisma.appointmentTrack.update({
    where: { id },
    data,
  });

  return Response.json({ appointment: updated });
}
