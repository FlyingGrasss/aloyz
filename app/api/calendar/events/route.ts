import { auth } from "@/auth";
import {
  createGoogleCalendarEvent,
  isGoogleCalendarConfigured,
  listGoogleCalendarEvents,
  updateGoogleCalendarEvent,
} from "@/lib/googleCalendar";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

async function getBusiness(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  const userRole = (session?.user as any)?.role;
  if (!userId) return null;

  const businessId = request.nextUrl.searchParams.get("businessId");
  if (userRole === "admin" && businessId) {
    return prisma.business.findUnique({ where: { id: businessId } });
  }
  return prisma.business.findFirst({ where: { ownerId: userId } });
}

export async function GET(request: NextRequest) {
  const business = await getBusiness(request);
  if (!business) {
    return Response.json({ error: "Business not found" }, { status: 404 });
  }
  if (!business.calendarId) {
    return Response.json({ events: [] });
  }
  if (!isGoogleCalendarConfigured()) {
    return Response.json({
      events: [],
      warning: "Google service account credentials are not configured.",
    });
  }

  const from =
    request.nextUrl.searchParams.get("from") ||
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const to =
    request.nextUrl.searchParams.get("to") ||
    new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const data = await listGoogleCalendarEvents({
      calendarId: business.calendarId,
      timeMin: from,
      timeMax: to,
    });
    return Response.json({ events: data.items || [] });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const business = await getBusiness(request);
  if (!business) {
    return Response.json({ error: "Business not found" }, { status: 404 });
  }
  if (!business.calendarId) {
    return Response.json({ error: "Google Calendar email is missing" }, { status: 400 });
  }
  if (!isGoogleCalendarConfigured()) {
    return Response.json(
      { error: "Google service account credentials are not configured." },
      { status: 400 },
    );
  }

  try {
    const body = await request.json();
    const input = {
      summary: body.summary,
      description: body.description,
      start: body.start,
      end: body.end,
      checkoutId: body.checkoutId,
      lineId: body.lineId,
    };
    let existingEventId = "";
    if (body.checkoutId && body.lineId) {
      const start = new Date(body.start);
      const from = new Date(start);
      from.setDate(start.getDate() - 370);
      const to = new Date(start);
      to.setDate(start.getDate() + 370);
      const data = await listGoogleCalendarEvents({
        calendarId: business.calendarId,
        timeMin: from.toISOString(),
        timeMax: to.toISOString(),
      });
      const key = `${body.checkoutId}:${body.lineId}`;
      const existing = (data.items || []).find(
        (event: any) =>
          event.extendedProperties?.private?.checkoutLineKey === key ||
          String(event.description || "").includes(`Adisyon: ${body.checkoutId}`),
      );
      existingEventId = existing?.id || "";
    }
    const event = existingEventId
      ? await updateGoogleCalendarEvent(business.calendarId, existingEventId, input)
      : await createGoogleCalendarEvent(business.calendarId, input);
    return Response.json({ event });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
