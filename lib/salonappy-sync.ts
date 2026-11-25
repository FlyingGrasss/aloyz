/* eslint-disable @typescript-eslint/no-explicit-any -- Prisma JSON and Salonappy payloads are dynamic */
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import {
  fetchBookingDetails,
  fetchCurrentBookings,
  fetchPackagePayments,
  fetchRecentPackageSales,
  type SalonappyBookingDetail,
  type SalonappyPackageSale,
  type SalonappyPayment,
} from "@/lib/salonappy-api";

const BUSINESS_ID = "cmsg51y28000004l6hacg2plq";

const SERVICE_TRANSLATIONS: Record<string, string> = {
  Manicure: "Manikür",
  Pedicure: "Pedikür",
  "Fake Nails": "Protez Tırnak",
  "Permanent Nail Polish (Foot)": "Kalıcı Oje (Ayak)",
  "Permanent Nail Removal": "Kalıcı Oje Çıkarma",
  "Permanent Nail Polish (Hand)": "Kalıcı Oje (El)",
  "Eyebrow Shaping": "Kaş Alımı",
  "False Eyelashes": "Takma Kirpik",
  Nails: "Tırnak",
  "Eyelash Lifting": "Kirpik Lifting",
  "Permanent Eyeliner": "Kalıcı Eyeliner",
  "Golden Ratio Eyebrow Shaping": "Altın Oran Kaş Şekillendirme",
  "Skin Tightening": "Cilt Sıkılaştırma",
  "Laser Hair Removal (Legs)": "Lazer Epilasyon (Bacak)",
  "Laser Hair Removal (Genital)": "Lazer Epilasyon (Genital)",
  "Laser Hair Removal (Neck)": "Lazer Epilasyon (Boyun)",
  "Laser Hair Removal (Chin)": "Lazer Epilasyon (Çene)",
  "Laser Hair Removal (Upper Lips)": "Lazer Epilasyon (Üst Dudak)",
  "Laser Hair Removal (Nape)": "Lazer Epilasyon (Ense)",
  "Laser Hair Removal (Chest)": "Lazer Epilasyon (Göğüs)",
  "Laser Hair Removal (Arms)": "Lazer Epilasyon (Kol)",
  "Laser Hair Removal (Armpit)": "Lazer Epilasyon (Koltuk Altı)",
  "Laser Hair Removal (Back)": "Lazer Epilasyon (Sırt)",
  "Laser Hair Removal (Whole Body)": "Lazer Epilasyon (Tüm Vücut)",
  "Laser Hair Removal (Face)": "Lazer Epilasyon (Yüz)",
};

const round2 = (value: number) => Math.round(value * 100) / 100;
const normalize = (value: unknown) =>
  String(value || "")
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/\s+/g, " ");

function normalizePhone(value: unknown) {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("90")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return digits.slice(-10);
}

function translate(value: unknown) {
  let text = String(value || "").trim();
  for (const [from, to] of Object.entries(SERVICE_TRANSLATIONS).sort(
    (a, b) => b[0].length - a[0].length,
  )) {
    text = text.split(from).join(to);
  }
  return text;
}

function mapMethod(value: unknown, text: unknown) {
  const raw = String(value || "").toLocaleLowerCase("tr-TR");
  const label = String(text || "").toLocaleLowerCase("tr-TR");
  if (raw === "nakit" || label.includes("cash")) return "Nakit";
  if (
    raw.includes("havale") ||
    raw.includes("eft") ||
    raw.includes("transfer") ||
    label.includes("transfer")
  ) {
    return "EFT";
  }
  if (
    raw.includes("kart") ||
    raw.includes("kredi") ||
    raw.includes("card") ||
    label.includes("card")
  ) {
    return "Kredi Kartı";
  }
  if (raw.includes("online")) return "Kredi Kartı";
  return String(text || value || "Diğer").trim() || "Diğer";
}

function parseCreatedAt(value: unknown, fallbackDate: string) {
  const raw = String(value || "").trim();
  if (raw) {
    const parsed = new Date(`${raw.replace(" ", "T")}+03:00`);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  const fallback = new Date(`${fallbackDate}T00:00:00+03:00`);
  return Number.isNaN(fallback.getTime())
    ? new Date().toISOString()
    : fallback.toISOString();
}

function turkeyDate(offsetDays = 0) {
  const shifted = Date.now() + (3 * 60 + offsetDays * 1440) * 60 * 1000;
  return new Date(shifted).toISOString().slice(0, 10);
}

function sessionFromEvent(eventId: string) {
  const match = String(eventId).match(
    /^salonappy:(\d+):(?:(?:calendar|summary):)?([^:]+)/,
  );
  return match ? match[2] : null;
}

function groupIdOf(sale: any) {
  const match = String(sale.id).match(/^(\d+)(?:-|$)/);
  return match ? match[1] : null;
}

function minutes(value: unknown) {
  const match = String(value || "").match(/(\d{1,2}):(\d{2})/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : 0;
}

function clock(value: number) {
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

function models(row: SalonappyPackageSale): any[] {
  if (Array.isArray(row.group_items) && row.group_items.length > 0) {
    return row.group_items;
  }
  return [row];
}

function allocatePayments(payments: SalonappyPayment[], weights: number[]) {
  const perRow: Array<Array<{ id: string; date: string; amount: number; method: string }>> =
    weights.map(() => []);
  if (weights.length === 0) return perRow;
  const weightSum = weights.reduce((sum, value) => sum + value, 0);
  for (const payment of payments) {
    const amount = Number(payment.amount) || 0;
    if (amount <= 0 || !payment.date) continue;
    let remaining = round2(amount);
    for (let index = 0; index < weights.length - 1; index += 1) {
      const weight = weightSum > 0 ? weights[index] / weightSum : 1 / weights.length;
      let part = round2(amount * weight);
      if (part > remaining) part = remaining;
      if (part > 0) {
        perRow[index].push({
          id: String(payment.id),
          date: String(payment.date),
          amount: part,
          method: mapMethod(payment.payment_method, payment.payment_method_text),
        });
      }
      remaining = round2(remaining - part);
    }
    if (remaining > 0) {
      perRow[weights.length - 1].push({
        id: String(payment.id),
        date: String(payment.date),
        amount: remaining,
        method: mapMethod(payment.payment_method, payment.payment_method_text),
      });
    }
  }
  const paymentTotal = round2(
    payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0),
  );
  const targetTotal = round2(weights.reduce((sum, value) => sum + value, 0));
  if (Math.abs(paymentTotal - targetTotal) < 0.01) {
    perRow.forEach((rowPayments, index) => {
      const current = round2(rowPayments.reduce((sum, payment) => sum + payment.amount, 0));
      const diff = round2(weights[index] - current);
      if (Math.abs(diff) < 0.005) return;
      const adjustable = rowPayments
        .filter((payment) => payment.amount + diff >= 0)
        .sort((left, right) => right.amount - left.amount)[0];
      if (adjustable) adjustable.amount = round2(adjustable.amount + diff);
    });
  }
  return perRow;
}

type BuiltState = {
  appointments: any[];
  cancelIds: string[];
  newlyCanceledRows: number;
  promotions: any;
  customers: any[];
  summary: SyncSummary;
};

export type SyncSummary = {
  currentBookings: number;
  newSessions: number;
  newAppointmentLines: number;
  newlyCanceledSessions: number;
  newlyCanceledRows: number;
  retainedEarlierToday: number;
  packageWindowStart: string;
  packageWindowEnd: string;
  sourcePackageGroups: number;
  newPackageGroups: number;
  newPackageRows: number;
  newPackageTotal: number;
  newPackagePaid: number;
  newCustomers: number;
  updatedPackageGroups: number;
  updatedPackageAmount: number;
  totalPackageSales: number;
};

function buildState(args: {
  business: any;
  appointments: any[];
  currentSessions: Set<string>;
  details: Record<string, SalonappyBookingDetail>;
  tomorrow: string;
  sourceGroups: Map<string, SalonappyPackageSale>;
  payments: Record<string, { totalPayment: number; payments: SalonappyPayment[] }>;
  today: string;
  packageWindowStart: string;
  currentBookings: number;
}): BuiltState {
  const { business, appointments, currentSessions, details, tomorrow } = args;
  const promotions = business.promotions && typeof business.promotions === "object" ? business.promotions : {};
  const sales: any[] = Array.isArray(promotions.packageSales) ? promotions.packageSales : [];
  const customers: any[] = Array.isArray(business.customers) ? business.customers : [];
  const services: any[] = Array.isArray(business.services) ? business.services : [];
  const staff: any[] = Array.isArray(business.staff) ? business.staff : [];

  const serviceByName = new Map(services.map((item) => [normalize(item.name), item]));
  const staffByName = new Map(staff.map((item) => [normalize(item.name), item]));
  const customerByPhone = new Map<string, any>();
  const customerByName = new Map<string, any>();
  for (const customer of customers) {
    const phone = normalizePhone(customer.phone);
    if (phone) customerByPhone.set(phone, customer);
    customerByName.set(normalize(customer.name), customer);
  }

  const dbGroups = new Map<string, any[]>();
  for (const sale of sales) {
    const groupId = groupIdOf(sale);
    if (!groupId) continue;
    const rows = dbGroups.get(groupId) || [];
    rows.push(sale);
    dbGroups.set(groupId, rows);
  }

  const appointmentsToCreate: any[] = [];
  let lineIndex = 0;
  for (const [session, detail] of Object.entries(details)) {
    if (!detail?.details || detail.details.is_cancelled) continue;
    const header = detail.details;
    const lines = Array.isArray(detail.services) ? detail.services : [];
    const groups = new Map<string, any[]>();
    for (const line of lines) {
      const key = String(line.staff_id || "unassigned");
      const group = groups.get(key) || [];
      group.push(line);
      groups.set(key, group);
    }
    for (const groupLines of groups.values()) {
      let cursor = minutes(header.time_text_24 || header.time_text);
      for (const line of groupLines) {
        const serviceName = translate(line.service_text);
        const service = serviceByName.get(normalize(serviceName));
        const member = staffByName.get(normalize(line.staff_name));
        const time = clock(cursor);
        cursor += Math.max(5, Number(line.duration) || 30);
        appointmentsToCreate.push({
          businessId: BUSINESS_ID,
          eventId: `salonappy:146599:${session}:${line.id || lineIndex}`,
          customerName: String(header.client_name || ""),
          phone: normalizePhone(header.client_phone_number),
          date: String(header.date || ""),
          time,
          serviceId: service?.id || null,
          staffId: member?.id || null,
          description: [
            serviceName,
            line.staff_name,
            header.notes,
            `Salonappy #${session}`,
          ]
            .filter(Boolean)
            .join(" · "),
          status: "CONFIRMED",
          source: "salonappy",
          createdAt: parseCreatedAt(header.created_at, String(header.date || "")),
        });
        lineIndex += 1;
      }
    }
  }

  const missingSessionRows = new Map<string, any[]>();
  for (const appointment of appointments) {
    const session = sessionFromEvent(String(appointment.eventId));
    if (!session || currentSessions.has(session)) continue;
    const rows = missingSessionRows.get(session) || [];
    rows.push(appointment);
    missingSessionRows.set(session, rows);
  }
  let newlyCanceledRows = 0;
  const cancelIds: string[] = [];
  let newlyCanceledSessions = 0;
  for (const [, rows] of missingSessionRows) {
    if (!rows.length || rows[0].date < tomorrow) continue;
    const fresh = rows.filter((row) => row.status !== "CANCELED");
    if (fresh.length === 0) continue;
    newlyCanceledSessions += 1;
    newlyCanceledRows += fresh.length;
    cancelIds.push(...fresh.map((row) => row.id));
  }
  const retainedEarlierToday = [...missingSessionRows.values()].reduce(
    (sum, rows) =>
      sum +
      (rows.length && rows[0].date < tomorrow
        ? rows.filter((row) => row.status !== "CANCELED").length
        : 0),
    0,
  );

  const nextSales: any[] = [];
  let newPackageGroups = 0;
  let newPackageRows = 0;
  let newPackageTotal = 0;
  let newPackagePaid = 0;
  let newCustomers = 0;

  for (const [groupId, row] of args.sourceGroups) {
    if (dbGroups.has(groupId)) continue;
    const data = args.payments[groupId];
    if (!data) continue;
    const items = models(row);
    const amounts = items.map((item) => Number(item.total_amount) || 0);
    const sourceTotal = round2(Number(row.total_amount) || 0);
    if (Math.abs(round2(amounts.reduce((sum, value) => sum + value, 0)) - sourceTotal) > 0.01) {
      continue;
    }
    const phone = normalizePhone(row.client_phone_number_local || row.client_phone_number);
    let customer = phone
      ? customerByPhone.get(phone) || null
      : customerByName.get(normalize(row.client_name)) || null;
    if (!customer) {
      customer = {
        id: randomUUID(),
        name: String(row.client_name || "").trim(),
        tags: [],
        email: "",
        notes: "",
        phone,
        gender: "Belirtilmemiş",
        birthDate: "",
        fileNumber: "",
        countryCode: "+90",
        discountRate: 0,
        discountEnabled: false,
        instagramUsername: "",
      };
      customers.push(customer);
      if (phone) customerByPhone.set(phone, customer);
      customerByName.set(normalize(customer.name), customer);
      newCustomers += 1;
    }
    const sellerText = String(row.seller_text || "").trim();
    const seller =
      sellerText && sellerText.toLocaleLowerCase("tr-TR") !== "salon"
        ? staffByName.get(normalize(sellerText)) || null
        : null;
    const perRow = allocatePayments(data.payments, amounts);
    items.forEach((item, index) => {
      const sourceName = translate(item.service_text).trim();
      const service = serviceByName.get(normalize(sourceName));
      const quantity = Math.max(0, Number(item.quantity) || 0);
      const rawRemaining = Number(item.remaining_usage);
      const remaining = Number.isFinite(rawRemaining)
        ? Math.min(quantity, Math.max(0, rawRemaining))
        : quantity;
      const used = Math.max(0, quantity - remaining);
      const rowPayments = perRow[index];
      const rowPaid = round2(rowPayments.reduce((sum, payment) => sum + payment.amount, 0));
      const saleId = items.length === 1 ? groupId : `${groupId}-${item.id}`;
      nextSales.push({
        id: saleId,
        date: String(row.date || ""),
        lines: [
          {
            id: String(item.id),
            name: service?.name || sourceName,
            used,
            amount: Number(item.total_amount) || 0,
            quantity,
            packageId: "",
            remaining,
            serviceId: service?.id || "",
            packageType: "Seans",
            usedCheckoutIds: [],
          },
        ],
        notes: String(row.notes || ""),
        total: Number(item.total_amount) || 0,
        payments: rowPayments,
        sellerId: seller?.id || "",
        createdAt: parseCreatedAt(row.created_at, String(row.date || "")),
        createdBy: String(row.created_by || "Salonappy"),
        hasExpiry: false,
        customerId: customer.id,
        paidAmount: rowPaid,
        customerName: String(row.client_name || ""),
        paymentMethod: rowPayments.length > 0 ? rowPayments[rowPayments.length - 1].method : "",
        createReceivable: false,
        openPaymentWindow: false,
      });
    });
    newPackageGroups += 1;
    newPackageRows += items.length;
    newPackageTotal = round2(newPackageTotal + sourceTotal);
    newPackagePaid = round2(newPackagePaid + data.totalPayment);
  }

  let updatedPackageGroups = 0;
  let updatedPackageAmount = 0;
  for (const [groupId, rows] of dbGroups) {
    const data = args.payments[groupId];
    if (!data) continue;
    const currentPaid = round2(
      rows.reduce((sum, sale) => sum + (Number(sale.paidAmount) || 0), 0),
    );
    const sourcePaid = round2(data.totalPayment);
    if (sourcePaid <= currentPaid + 0.01) continue;
    const weights = rows.map((sale) => Math.max(0, Number(sale.total) || 0));
    const perRow = allocatePayments(data.payments, weights);
    rows.forEach((sale, index) => {
      const rowPayments = perRow[index];
      sale.payments = rowPayments;
      sale.paidAmount = round2(rowPayments.reduce((sum, payment) => sum + payment.amount, 0));
      sale.paymentMethod =
        rowPayments.length > 0 ? rowPayments[rowPayments.length - 1].method : "";
    });
    updatedPackageGroups += 1;
    updatedPackageAmount = round2(updatedPackageAmount + sourcePaid - currentPaid);
  }

  promotions.packageSales = [...nextSales, ...sales];
  business.customers = customers;
  business.promotions = promotions;

  const summary: SyncSummary = {
    currentBookings: args.currentBookings,
    newSessions: Object.keys(details).length,
    newAppointmentLines: appointmentsToCreate.length,
    newlyCanceledSessions,
    newlyCanceledRows,
    retainedEarlierToday,
    packageWindowStart: args.packageWindowStart,
    packageWindowEnd: args.today,
    sourcePackageGroups: args.sourceGroups.size,
    newPackageGroups,
    newPackageRows,
    newPackageTotal,
    newPackagePaid,
    newCustomers,
    updatedPackageGroups,
    updatedPackageAmount,
    totalPackageSales: promotions.packageSales.length,
  };

  return {
    appointments: appointmentsToCreate,
    cancelIds,
    newlyCanceledRows,
    promotions,
    customers,
    summary,
  };
}

export async function runSalonappySync(): Promise<SyncSummary> {
  const today = turkeyDate();
  const tomorrow = turkeyDate(1);

  const initial = await prisma.business.findUnique({
    where: { id: BUSINESS_ID },
    select: { promotions: true, customers: true, services: true, staff: true },
  });
  if (!initial) throw new Error("İşletme bulunamadı");
  const sales: any[] = Array.isArray((initial.promotions as any)?.packageSales)
    ? (initial.promotions as any).packageSales
    : [];
  const datedSales = sales
    .filter((sale) => groupIdOf(sale))
    .map((sale) => String(sale.date || ""))
    .filter(Boolean)
    .sort();
  const packageWindowStart = datedSales.length
    ? datedSales[datedSales.length - 1]
    : turkeyDate(-7);

  const initialAppointments = await prisma.appointmentTrack.findMany({
    where: {
      businessId: BUSINESS_ID,
      date: { gte: today },
      source: "salonappy",
    },
    select: { id: true, eventId: true, date: true, status: true },
  });
  const initialSessions = new Set<string>();
  for (const appointment of initialAppointments) {
    const session = sessionFromEvent(String(appointment.eventId));
    if (session) initialSessions.add(session);
  }

  const [currentBookings, sourceRows] = await Promise.all([
    fetchCurrentBookings(today),
    fetchRecentPackageSales(packageWindowStart, today),
  ]);
  const currentSessions = new Set(
    currentBookings.map((row) => String(row.session)),
  );
  const extraSessions = currentBookings
    .map((row) => String(row.session))
    .filter((session) => !initialSessions.has(session));
  const details = await fetchBookingDetails(extraSessions);

  const sourceGroups = new Map<string, SalonappyPackageSale>();
  for (const row of sourceRows) {
    const groupId = String(row.group_id || row.id);
    const existing = sourceGroups.get(groupId);
    if (!existing || models(row).length > models(existing).length) {
      sourceGroups.set(groupId, row);
    }
  }
  const initialDbGroups = new Map<string, any[]>();
  for (const sale of sales) {
    const groupId = groupIdOf(sale);
    if (!groupId) continue;
    const rows = initialDbGroups.get(groupId) || [];
    rows.push(sale);
    initialDbGroups.set(groupId, rows);
  }
  const paymentTargets = new Set<string>();
  for (const groupId of sourceGroups.keys()) paymentTargets.add(groupId);
  for (const [groupId, rows] of initialDbGroups) {
    const total = rows.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0);
    const paid = rows.reduce((sum, sale) => sum + (Number(sale.paidAmount) || 0), 0);
    if (paid < total - 0.01) paymentTargets.add(groupId);
  }
  const payments = await fetchPackagePayments([...paymentTargets]);

  return prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Business" WHERE id = ${BUSINESS_ID} FOR UPDATE`;
      const business = await tx.business.findUnique({ where: { id: BUSINESS_ID } });
      if (!business) throw new Error("İşletme bulunamadı");
      const appointments = await tx.appointmentTrack.findMany({
        where: { businessId: BUSINESS_ID, date: { gte: today }, source: "salonappy" },
        select: { id: true, eventId: true, date: true, status: true },
      });
      const built = buildState({
        business,
        appointments,
        currentSessions,
        details,
        tomorrow,
        sourceGroups,
        payments,
        today,
        packageWindowStart,
        currentBookings: currentBookings.length,
      });

      if (built.cancelIds.length > 0) {
        await tx.appointmentTrack.updateMany({
          where: { id: { in: built.cancelIds } },
          data: { status: "CANCELED" },
        });
      }
      if (built.appointments.length > 0) {
        await tx.appointmentTrack.createMany({
          data: built.appointments,
          skipDuplicates: true,
        });
      }
      await tx.business.update({
        where: { id: BUSINESS_ID },
        data: { promotions: built.promotions, customers: built.customers },
      });
      return built.summary;
    },
    { timeout: 120_000, maxWait: 10_000 },
  );
}
