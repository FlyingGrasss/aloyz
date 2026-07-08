export type PublicStaff = {
  id: string;
  name: string;
  role?: string;
  onlineBooking?: boolean;
  calendarVisible?: boolean;
  workingHours?: Record<string, string>;
  breakHours?: BreakHour[];
};

export type BreakHour = {
  id?: string;
  label?: string;
  start?: string;
  end?: string;
  days?: string[];
};

export type PublicService = {
  id: string;
  name: string;
  gender?: string;
  duration?: number;
  priceType?: "single" | "range";
  price?: number;
  minPrice?: number;
  maxPrice?: number;
  staffIds?: string[];
};

export const BOOKING_DAY_KEYS = [
  "pazar",
  "pazartesi",
  "sali",
  "carsamba",
  "persembe",
  "cuma",
  "cumartesi",
] as const;

export function parseBookingInterval(value: unknown) {
  const raw = String(value || "").trim();
  const match = raw.match(/\d+/);
  const parsed = match ? Number(match[0]) : 30;
  return [15, 30, 45, 60, 90, 120].includes(parsed) ? parsed : 30;
}

export function parseHourRange(value: unknown) {
  const text = String(value || "");
  if (!text || text.toLocaleLowerCase("tr-TR").includes("kapalı")) {
    return null;
  }
  const match = text.match(/(\d{2}:\d{2}).*?(\d{2}:\d{2})/);
  if (!match) return { start: "09:00", end: "18:00" };
  return { start: match[1], end: match[2] };
}

export function minutesFromTime(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + (minute || 0);
}

export function timeFromMinutes(total: number) {
  const hour = Math.floor(total / 60);
  const minute = total % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function rangesOverlap(
  start: number,
  end: number,
  busyStart: number,
  busyEnd: number,
) {
  return start < busyEnd && end > busyStart;
}

export function breakRangesForDate(
  date: string,
  ...breakSources: Array<unknown>
) {
  const key = dayKeyFromDate(date);
  if (!key) return [];
  return breakSources
    .flatMap((source) => (Array.isArray(source) ? source : []))
    .filter((item): item is BreakHour => !!item && typeof item === "object")
    .filter((item) => {
      if (!Array.isArray(item.days) || item.days.length === 0) return true;
      return item.days.includes(key);
    })
    .map((item) => {
      const start = item.start ? minutesFromTime(item.start) : NaN;
      const end = item.end ? minutesFromTime(item.end) : NaN;
      return { start, end };
    })
    .filter((item) => Number.isFinite(item.start) && Number.isFinite(item.end));
}

export function dayKeyFromDate(date: string) {
  const parsed = new Date(`${date}T12:00:00+03:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return BOOKING_DAY_KEYS[parsed.getDay()];
}

export function getWorkingRangeForDate(
  date: string,
  businessHours: Record<string, unknown> | null | undefined,
  staff?: PublicStaff | null,
) {
  const key = dayKeyFromDate(date);
  if (!key) return null;
  const source = staff?.workingHours?.[key] || businessHours?.[key];
  return parseHourRange(source || "Açık: 09:00 - 18:00");
}

export function buildBookingSlots({
  date,
  businessHours,
  interval,
  duration,
  busyTimes,
  breakHours,
  staff,
}: {
  date: string;
  businessHours: Record<string, unknown> | null | undefined;
  interval: number;
  duration: number;
  busyTimes: Array<{ start: string; end?: string | null }>;
  breakHours?: unknown[];
  staff?: PublicStaff | null;
}) {
  const range = getWorkingRangeForDate(date, businessHours, staff);
  if (!range) return [];

  const start = minutesFromTime(range.start);
  const end = minutesFromTime(range.end);
  const durationMinutes = Math.max(15, duration || interval);
  const now = new Date();

  const busyRanges = busyTimes
    .map((item) => ({
      start: minutesFromTime(item.start),
      end: minutesFromTime(item.end || item.start) + (item.end ? 0 : durationMinutes),
    }))
    .filter((item) => Number.isFinite(item.start) && Number.isFinite(item.end));
  const blockedRanges = [
    ...busyRanges,
    ...breakRangesForDate(date, breakHours, staff?.breakHours),
  ];

  const slots: string[] = [];
  for (let cursor = start; cursor + durationMinutes <= end; cursor += interval) {
    const time = timeFromMinutes(cursor);
    const slotStart = new Date(`${date}T${time}:00+03:00`);
    if (slotStart.getTime() < now.getTime()) continue;

    const slotEnd = cursor + durationMinutes;
    const overlaps = blockedRanges.some(
      (busy) => rangesOverlap(cursor, slotEnd, busy.start, busy.end),
    );
    if (!overlaps) slots.push(time);
  }

  return slots;
}

export function normalizePublicServices(value: unknown): PublicService[] {
  return Array.isArray(value)
    ? value
        .filter((item): item is PublicService => !!item && typeof item === "object")
        .filter((item) => !!item.name)
    : [];
}

export function normalizePublicStaff(value: unknown): PublicStaff[] {
  return Array.isArray(value)
    ? value
        .filter((item): item is PublicStaff => !!item && typeof item === "object")
        .filter((item) => !!item.name)
        .filter((item) => item.onlineBooking !== false)
    : [];
}
