import {
  buildBookingSlots,
  minutesFromTime,
  normalizePublicServices,
  normalizePublicStaff,
  parseBookingInterval,
  timeFromMinutes,
  type PublicService,
  type PublicStaff,
} from "@/lib/booking";
import {
  createGoogleCalendarEvent,
  isGoogleCalendarConfigured,
  listGoogleCalendarEvents,
} from "@/lib/googleCalendar";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const ANY_STAFF = "any";
const BOOKING_HORIZON_DAYS = 21;
const PUBLIC_BOOKING_MARKER = "Aloyz online randevu sayfasından oluşturuldu.";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

type BusyTime = {
  start: string;
  end?: string | null;
};

type BusinessRecord = NonNullable<Awaited<ReturnType<typeof getBusiness>>>;

function jsonRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMinutes(time: string, minutes: number) {
  return timeFromMinutes(minutesFromTime(time) + minutes);
}

function businessBreakHours(business: BusinessRecord) {
  const bookingSettings = jsonRecord(business.bookingSettings);
  return Array.isArray(bookingSettings.breakHours) ? bookingSettings.breakHours : [];
}

function getEligibleStaff(staffList: PublicStaff[], service: PublicService | null) {
  if (!service) return [];
  if (!service.staffIds?.length) return staffList;
  return staffList.filter((staff) => service.staffIds?.includes(staff.id));
}

function publicBusinessPayload(business: BusinessRecord) {
  return {
    id: business.id,
    name: business.name,
    slug: business.slug,
    type: business.type,
    phone: business.phone,
    email: business.email,
    city: business.city,
    district: business.district,
    address: business.address,
    website: business.website,
    hours: business.hours,
    bookingSettings: business.bookingSettings,
    hasCalendar: !!business.calendarId,
    services: normalizePublicServices(business.services),
    staff: normalizePublicStaff(business.staff),
  };
}

async function getBusiness(slug: string) {
  return prisma.business.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      phone: true,
      email: true,
      city: true,
      district: true,
      address: true,
      website: true,
      hours: true,
      services: true,
      staff: true,
      bookingSettings: true,
      calendarId: true,
      appointments: {
        where: { status: { not: "CANCELED" } },
        orderBy: { createdAt: "desc" },
        take: 1000,
        select: {
          date: true,
          time: true,
          serviceId: true,
          staffId: true,
          status: true,
        },
      },
    },
  });
}

function getInternalBusyTimes({
  business,
  date,
  staffId,
  services,
  fallbackDuration,
}: {
  business: BusinessRecord;
  date: string;
  staffId: string;
  services: PublicService[];
  fallbackDuration: number;
}) {
  return business.appointments
    .filter((appointment) => appointment.date === date)
    .filter((appointment) => !appointment.staffId || appointment.staffId === staffId)
    .map((appointment) => {
      const bookedService = appointment.serviceId
        ? services.find((service) => service.id === appointment.serviceId)
        : null;
      const duration = Number(bookedService?.duration || fallbackDuration);
      return {
        start: appointment.time,
        end: addMinutes(appointment.time, duration),
      };
    });
}

async function getGoogleBusyTimes(business: BusinessRecord, date: string) {
  if (!business.calendarId || !isGoogleCalendarConfigured()) return [];

  try {
    const timeMin = new Date(`${date}T00:00:00+03:00`).toISOString();
    const timeMax = new Date(`${date}T23:59:59+03:00`).toISOString();
    const data = await listGoogleCalendarEvents({
      calendarId: business.calendarId,
      timeMin,
      timeMax,
    });

    return (data.items || [])
      .filter((event: any) => !String(event.description || "").includes(PUBLIC_BOOKING_MARKER))
      .map((event: any) => {
        const start = event.start?.dateTime ? new Date(event.start.dateTime) : null;
        const end = event.end?.dateTime ? new Date(event.end.dateTime) : null;
        if (!start || Number.isNaN(start.getTime())) return null;
        return {
          start: formatTime(start),
          end: end && !Number.isNaN(end.getTime()) ? formatTime(end) : null,
        };
      })
      .filter(Boolean) as BusyTime[];
  } catch {
    return [];
  }
}

async function getBusyTimesForStaff({
  business,
  date,
  staffId,
  services,
  fallbackDuration,
  googleBusyTimes,
}: {
  business: BusinessRecord;
  date: string;
  staffId: string;
  services: PublicService[];
  fallbackDuration: number;
  googleBusyTimes: BusyTime[];
}) {
  return [
    ...getInternalBusyTimes({
      business,
      date,
      staffId,
      services,
      fallbackDuration,
    }),
    ...googleBusyTimes,
  ];
}

async function getStaffSlots({
  business,
  date,
  service,
  staff,
  services,
  interval,
  googleBusyTimes,
}: {
  business: BusinessRecord;
  date: string;
  service: PublicService;
  staff: PublicStaff;
  services: PublicService[];
  interval: number;
  googleBusyTimes: BusyTime[];
}) {
  const duration = Number(service.duration || interval);
  const busyTimes = await getBusyTimesForStaff({
    business,
    date,
    staffId: staff.id,
    services,
    fallbackDuration: duration,
    googleBusyTimes,
  });

  return buildBookingSlots({
    date,
    businessHours: jsonRecord(business.hours),
    interval,
    duration,
    busyTimes,
    breakHours: businessBreakHours(business),
    staff,
  });
}

async function getAvailability({
  business,
  date,
  service,
  requestedStaffId,
}: {
  business: BusinessRecord;
  date: string;
  service: PublicService | null;
  requestedStaffId: string;
}) {
  if (!service) {
    return { slots: [] as string[], slotStaff: {} as Record<string, string[]>, selectedStaffId: ANY_STAFF };
  }

  const services = normalizePublicServices(business.services);
  const eligibleStaff = getEligibleStaff(normalizePublicStaff(business.staff), service);
  if (!eligibleStaff.length) {
    return { slots: [] as string[], slotStaff: {} as Record<string, string[]>, selectedStaffId: ANY_STAFF };
  }

  const selectedStaff =
    requestedStaffId && requestedStaffId !== ANY_STAFF
      ? eligibleStaff.find((staff) => staff.id === requestedStaffId) || null
      : null;
  const interval = parseBookingInterval(jsonRecord(business.bookingSettings).interval);
  const googleBusyTimes = await getGoogleBusyTimes(business, date);
  const slotStaff = new Map<string, string[]>();
  const staffToCheck = selectedStaff ? [selectedStaff] : eligibleStaff;

  for (const staff of staffToCheck) {
    const slots = await getStaffSlots({
      business,
      date,
      service,
      staff,
      services,
      interval,
      googleBusyTimes,
    });
    for (const slot of slots) {
      slotStaff.set(slot, [...(slotStaff.get(slot) || []), staff.id]);
    }
  }

  const slots = [...slotStaff.keys()].sort(
    (left, right) => minutesFromTime(left) - minutesFromTime(right),
  );

  return {
    slots,
    slotStaff: Object.fromEntries(slotStaff),
    selectedStaffId: selectedStaff?.id || ANY_STAFF,
  };
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;
  const business = await getBusiness(slug);
  if (!business) {
    return NextResponse.json({ error: "İşletme bulunamadı." }, { status: 404 });
  }

  const { searchParams } = request.nextUrl;
  const today = formatDate(new Date());
  const date = searchParams.get("date") || today;
  const services = normalizePublicServices(business.services);
  const service =
    services.find((item) => item.id === searchParams.get("serviceId")) ||
    services[0] ||
    null;
  const requestedStaffId = searchParams.get("staffId") || ANY_STAFF;
  const availability = await getAvailability({
    business,
    date,
    service,
    requestedStaffId,
  });

  const dates = Array.from({ length: BOOKING_HORIZON_DAYS }, (_, index) => {
    const value = formatDate(addDays(new Date(), index));
    return {
      value,
      label: new Intl.DateTimeFormat("tr-TR", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        timeZone: "Europe/Istanbul",
      }).format(new Date(`${value}T12:00:00+03:00`)),
    };
  });

  return NextResponse.json({
    business: publicBusinessPayload(business),
    dates,
    slots: availability.slots,
    slotStaff: availability.slotStaff,
    selected: {
      date,
      serviceId: service?.id || "",
      staffId: availability.selectedStaffId,
    },
  });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;
  const business = await getBusiness(slug);
  if (!business) {
    return NextResponse.json({ error: "İşletme bulunamadı." }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const services = normalizePublicServices(business.services);
  const staffList = normalizePublicStaff(business.staff);
  const service = services.find((item) => item.id === String(body.serviceId || ""));
  const requestedStaffId = String(body.staffId || ANY_STAFF);
  const date = String(body.date || "").trim();
  const time = String(body.time || "").trim();
  const customerName = String(body.customerName || "").trim();
  const phone = String(body.phone || "").trim();
  const note = String(body.note || "").trim();

  if (!service || !date || !time || !customerName || !phone) {
    return NextResponse.json(
      { error: "Lütfen hizmet, tarih, saat, ad soyad ve telefon bilgisini doldurun." },
      { status: 400 },
    );
  }

  const eligibleStaff = getEligibleStaff(staffList, service);
  if (!eligibleStaff.length) {
    return NextResponse.json(
      { error: "Bu hizmet için online randevuya uygun personel bulunamadı." },
      { status: 400 },
    );
  }

  const availability = await getAvailability({
    business,
    date,
    service,
    requestedStaffId,
  });

  const availableStaffIds = availability.slotStaff[time] || [];
  if (!availability.slots.includes(time) || !availableStaffIds.length) {
    return NextResponse.json(
      { error: "Bu saat artık uygun değil. Lütfen başka bir saat seçin." },
      { status: 409 },
    );
  }

  const selectedStaffId =
    requestedStaffId !== ANY_STAFF && availableStaffIds.includes(requestedStaffId)
      ? requestedStaffId
      : availableStaffIds[0];
  const selectedStaff = eligibleStaff.find((staff) => staff.id === selectedStaffId);
  if (!selectedStaff) {
    return NextResponse.json(
      { error: "Bu saat için uygun personel bulunamadı." },
      { status: 409 },
    );
  }

  const interval = parseBookingInterval(jsonRecord(business.bookingSettings).interval);
  const start = new Date(`${date}T${time}:00+03:00`);
  const end = new Date(
    start.getTime() + Number(service.duration || interval) * 60 * 1000,
  );
  const summary = `${customerName} - ${service.name}`;
  const description = [
    `Telefon: ${phone}`,
    `Hizmet: ${service.name}`,
    `Personel: ${selectedStaff.name}`,
    note ? `Not: ${note}` : null,
    PUBLIC_BOOKING_MARKER,
  ]
    .filter(Boolean)
    .join("\n");

  let eventId = `public-${randomUUID()}`;
  let calendarSynced = false;
  if (business.calendarId && isGoogleCalendarConfigured()) {
    try {
      const event = await createGoogleCalendarEvent(business.calendarId, {
        summary,
        description,
        start: start.toISOString(),
        end: end.toISOString(),
      });
      if (event?.id) {
        eventId = event.id;
        calendarSynced = true;
      }
    } catch {
      calendarSynced = false;
    }
  }

  const appointment = await prisma.appointmentTrack.create({
    data: {
      businessId: business.id,
      eventId,
      customerName,
      phone,
      date,
      time,
      serviceId: service.id,
      staffId: selectedStaff.id,
      description: [service.name, selectedStaff.name, note].filter(Boolean).join(" · "),
      status: calendarSynced ? "CONFIRMED" : "REQUESTED",
      source: "public",
    },
  });

  return NextResponse.json({
    appointment: {
      id: appointment.id,
      date: appointment.date,
      time: appointment.time,
      staffId: selectedStaff.id,
      staffName: selectedStaff.name,
      status: appointment.status,
      calendarSynced,
    },
  });
}
