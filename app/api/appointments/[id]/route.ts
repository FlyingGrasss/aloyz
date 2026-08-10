import { getApiUser } from "@/lib/apiAuth";
import { getAccessibleBusiness } from "@/lib/businessAccess";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

const ALLOWED_STATUSES = new Set(["REQUESTED", "CONFIRMED", "COMPLETED", "CANCELED"]);

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const status = String(body.status || "").toUpperCase();

  if (!ALLOWED_STATUSES.has(status)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
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

  const updated = await prisma.appointmentTrack.update({
    where: { id },
    data: { status },
  });

  return Response.json({ appointment: updated });
}
