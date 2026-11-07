import { getApiUser } from "@/lib/apiAuth";
import {
  APPROVAL_PENDING,
  getAccessibleBusiness,
  isApprovedUser,
} from "@/lib/businessAccess";
import { applyAppointmentAttendanceUsage } from "@/lib/packageUsage";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

const ALLOWED_STATUSES = new Set(["REQUESTED", "CONFIRMED", "COMPLETED", "CANCELED"]);

type RouteContext = {
  params: Promise<{ id: string }>;
};

type BusinessCustomer = {
  id?: string;
  name?: string;
  phone?: string;
  countryCode?: string;
};

type BusinessService = {
  id?: string;
  name?: string;
};

type AppointmentRecord = {
  id: string;
  businessId: string;
  customerName: string;
  phone: string;
  date: string;
  time: string;
  serviceId: string | null;
  staffId: string | null;
  description: string;
  status: string;
};

function normalizePhone(value: unknown) {
  return String(value ?? "").replace(/\D/g, "").slice(-10);
}

function normalizeCustomerName(value: unknown) {
  return String(value ?? "").trim().toLocaleLowerCase("tr-TR");
}

function resolveCustomerId(
  customers: BusinessCustomer[],
  appointment: Pick<AppointmentRecord, "customerName" | "phone">,
) {
  const phone = normalizePhone(appointment.phone);
  if (phone) {
    const byPhone = customers.find(
      (customer) =>
        normalizePhone(`${customer.countryCode || ""}${customer.phone || ""}`) ===
        phone,
    );
    if (byPhone?.id) return byPhone.id;
  }
  const name = normalizeCustomerName(appointment.customerName);
  if (name) {
    const byName = customers.find(
      (customer) => normalizeCustomerName(customer.name) === name,
    );
    if (byName?.id) return byName.id;
  }
  return "";
}

function resolveServiceName(
  services: BusinessService[],
  appointment: Pick<AppointmentRecord, "serviceId" | "description">,
) {
  const direct = services.find(
    (service) => service.id && service.id === appointment.serviceId,
  );
  if (direct?.name) return String(direct.name);
  const description = String(appointment.description || "");
  const matched = services.find(
    (service) =>
      service.name && description.includes(String(service.name)),
  );
  return matched?.name ? String(matched.name) : "";
}

function toPackageUsageAppointment(
  appointment: AppointmentRecord,
  customerId: string,
  serviceName: string,
) {
  return {
    id: `appointment-${appointment.id}`,
    customerId,
    customerName: appointment.customerName,
    phone: appointment.phone,
    serviceId: appointment.serviceId || "",
    name: serviceName,
    status: appointment.status,
  };
}

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

  const appointment = (await prisma.appointmentTrack.findUnique({
    where: { id },
    select: {
      id: true,
      businessId: true,
      customerName: true,
      phone: true,
      date: true,
      time: true,
      serviceId: true,
      staffId: true,
      description: true,
      status: true,
    },
  })) as AppointmentRecord | null;

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
    select: {
      services: true,
      staff: true,
      promotions: true,
      customers: true,
    },
  });
  const services = Array.isArray(business?.services)
    ? (business.services as BusinessService[])
    : [];
  const staff = Array.isArray(business?.staff)
    ? (business.staff as Array<{ id?: string }>)
    : [];
  const customers = Array.isArray(business?.customers)
    ? (business.customers as BusinessCustomer[])
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

  const nextAppointment = { ...appointment, ...data } as AppointmentRecord;
  const previousCompleted = appointment.status === "COMPLETED";
  const nextStatus =
    typeof data.status === "string" ? data.status : appointment.status;
  const nextCompleted = nextStatus === "COMPLETED";
  const previousUsageAppointment = toPackageUsageAppointment(
    appointment,
    resolveCustomerId(customers, appointment),
    resolveServiceName(services, appointment),
  );
  const nextUsageAppointment = toPackageUsageAppointment(
    nextAppointment,
    resolveCustomerId(customers, nextAppointment),
    resolveServiceName(services, nextAppointment),
  );
  const usage =
    previousCompleted || nextCompleted
      ? applyAppointmentAttendanceUsage({
          previousAppointment: previousUsageAppointment,
          nextAppointment: nextUsageAppointment,
          promotions: business?.promotions,
        })
      : { promotions: business?.promotions, changes: [] };

  let updated;
  if (usage.changes.length > 0) {
    const [, appointmentResult] = await prisma.$transaction([
      prisma.business.update({
        where: { id: appointment.businessId },
        data: {
          promotions: usage.promotions as Prisma.InputJsonValue,
        },
      }),
      prisma.appointmentTrack.update({
        where: { id },
        data,
      }),
    ]);
    updated = appointmentResult;
  } else {
    updated = await prisma.appointmentTrack.update({
      where: { id },
      data,
    });
  }

  return Response.json({
    appointment: updated,
    packageUsage: {
      changes: usage.changes,
      wasCompleted: appointment.status === "COMPLETED",
      isCompleted: updated.status === "COMPLETED",
    },
  });
}
