"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ActionPanel,
  Appointment,
  BotSettings,
  Breadcrumb,
  Business,
  ChannelBadge,
  CheckoutItem,
  ContactRow,
  CustomerProfile,
  DAYS,
  EmptyState,
  InfoRow,
  Metric,
  ModalHeader,
  NativeSelect,
  PlaceholderPage,
  PromotionsSettings,
  ServiceItem,
  SettingsPanel,
  SettingsSelect,
  SettingsToggle,
  StatusBanner,
  StaffMember,
  ToggleRow,
  ViewId,
  SetupViewId,
  BookingSettings,
  formatDateLong,
  formatInputDate,
  formatLastUpdate,
  formatServicePrice,
  getConversationMessages,
  getViewLabel,
  normalizeContactKey,
  parseHourValue,
  formatHourValue,
  parseLooseNumber,
  emptyStaff,
  emptyService,
  sanitizeStaffMember,
  contactToCustomerProfile,
  setupItems,
  TIME_OPTIONS,
  GOOGLE_SERVICE_ACCOUNT_EMAIL,
} from "./shared";

import { CheckoutModal } from "./checkouts";
import { CustomerModal } from "./customers";

export function CalendarPage({
  selectedDate,
  business,
  appointments,
  calendarId,
  contacts,
  saving,
  onDateChange,
  onUpdateAndSave,
  onSelectView,
  onAppointmentUpdated,
}: {
  selectedDate: string;
  business: Business;
  appointments: Appointment[];
  calendarId: string;
  contacts: ContactRow[];
  saving: boolean;
  onDateChange: (date: string) => void;
  onUpdateAndSave: (fields: Partial<Business>) => Promise<boolean>;
  onSelectView: (view: ViewId) => void;
  onAppointmentUpdated?: (appointment: Appointment) => void;
}) {
  const [modal, setModal] = useState<"checkout" | "customer" | null>(null);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState("all");
  const [googleAppointments, setGoogleAppointments] = useState<Appointment[]>([]);
  const [googleSyncing, setGoogleSyncing] = useState(false);
  const [googleSyncMessage, setGoogleSyncMessage] = useState("");
  const [refreshNonce, setRefreshNonce] = useState(0);
  const calendarScrollRef = useRef<HTMLDivElement | null>(null);
  const staff = business.staff || [];
  const calendarSettings = business.bookingSettings || {};
  const calendarView = normalizeCalendarView(calendarSettings.calendarView);
  const calendarWidth = Number(calendarSettings.calendarWidth || "80");
  const slotInterval = Number(
    String(calendarSettings.calendarSlotInterval || "60 Dakika").match(/\d+/)?.[0] ||
      "60",
  );
  const calendarTextClass =
    calendarSettings.calendarTextColor === "Açık"
      ? "text-white"
      : calendarSettings.calendarTextColor === "Koyu"
        ? "text-slate-950"
        : "text-slate-800";
  const weekStart = getWeekStart(selectedDate);
  const visibleDates =
    calendarView === "Haftalık görünüm"
      ? Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))
      : [selectedDate];
  const monthDates = getMonthGridDates(selectedDate);
  const today = formatDateInIstanbul(new Date());
  const currentTime = formatTimeInIstanbul(new Date());
  const visibleAppointments = [...appointments, ...googleAppointments].filter(
    (appointment) => appointment.status !== "CANCELED",
  );
  const checkouts = business.checkouts || [];

  useEffect(() => {
    if (!calendarId) {
      setGoogleAppointments([]);
      setGoogleSyncMessage("");
      return;
    }
    setGoogleSyncing(true);
    const start = new Date(`${selectedDate}T00:00:00+03:00`);
    start.setDate(start.getDate() - 7);
    const end = new Date(`${selectedDate}T23:59:59+03:00`);
    end.setDate(end.getDate() + 14);
    fetch(
      `/api/calendar/events?from=${encodeURIComponent(
        start.toISOString(),
      )}&to=${encodeURIComponent(
        end.toISOString(),
      )}&businessId=${encodeURIComponent(business.id)}`,
    )
      .then((res) => (res.ok ? res.json() : { events: [] }))
      .then((data) => {
        const events = (data.events || []).filter(
          (event: any) =>
            !event.extendedProperties?.private?.checkoutId &&
            !String(event.description || "").includes("Adisyon:"),
        );
        setGoogleAppointments(
          events.map((event: any) => {
            const startValue = event.start?.dateTime || event.start?.date;
            const startDate = new Date(startValue);
            return {
              id: `google-${event.id}`,
              customerName: event.summary || "Google Takvim",
              phone: "",
              date: formatDateInIstanbul(startDate),
              time: formatTimeInIstanbul(startDate),
              description: event.description || "Google Calendar",
              status: "GOOGLE",
              createdAt: event.created || new Date().toISOString(),
            };
          }),
        );
        setGoogleSyncMessage(
          `Google Takvim senkronize edildi (${events.length} etkinlik).`,
        );
      })
      .catch(() => {
        setGoogleAppointments([]);
        setGoogleSyncMessage("Google Takvim senkronizasyonu başarısız.");
      })
      .finally(() => setGoogleSyncing(false));
  }, [calendarId, selectedDate, refreshNonce]);
  async function createCheckout(checkout: CheckoutItem) {
    setModal(null);
    onUpdateAndSave({ checkouts: [checkout, ...checkouts] });
    syncCheckoutToGoogleCalendar(business, checkout);
  }
  async function createCustomer(customer: CustomerProfile) {
    await onUpdateAndSave({
      customers: [customer, ...(business.customers || [])],
    });
    setModal("checkout");
  }
  const slots = Array.from(
    { length: Math.ceil((24 * 60) / slotInterval) },
    (_, index) => {
      const totalMinutes = index * slotInterval;
      const hour = Math.floor(totalMinutes / 60);
      const minute = totalMinutes % 60;
      return {
        hour,
        minute,
        label: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
      };
    },
  );
  const shiftDate = (days: number) => {
    const date = new Date(`${selectedDate}T12:00:00`);
    date.setDate(date.getDate() + days);
    onDateChange(date.toISOString().slice(0, 10));
  };

  function openAppointment(appointment: Appointment) {
    if (appointment.id.startsWith("google-")) {
      onSelectView("booking/list");
      return;
    }
    setSelectedAppointment(appointment);
  }

  useEffect(() => {
    const container = calendarScrollRef.current;
    if (!container || calendarView === "Aylık görünüm") return;
    if (!visibleDates.includes(today)) return;
    window.setTimeout(() => {
      const currentRow = container.querySelector<HTMLElement>(
        "[data-current-time-slot='true']",
      );
      currentRow?.scrollIntoView({ block: "center" });
    }, 50);
  }, [calendarView, selectedDate, slotInterval, today, visibleDates.join("|")]);
  return (
    <div className="space-y-3">
      <Breadcrumb
        items={[
          { label: "Aloyz", view: "dashboard" },
          { label: "Randevu takvimi", view: "calendar" },
        ]}
        onSelectView={onSelectView}
      />
      <section className="rounded bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 py-3 sm:px-4">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <NativeSelect
              value={selectedStaffId}
              onChange={setSelectedStaffId}
              className="w-full sm:w-44"
              options={[
                { value: "all", label: "Tüm personel" },
                ...staff.map((member) => ({
                  value: member.id,
                  label: member.name,
                })),
              ]}
            />
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => shiftDate(-1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <div className="min-w-0 flex-1 rounded border border-slate-300 px-3 py-1.5 text-center text-sm font-medium sm:min-w-[260px] sm:flex-none">
              {formatDateLong(selectedDate)}
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => shiftDate(1)}
            >
              <ChevronRight className="size-4" />
            </Button>
            <Input
              type="date"
              value={selectedDate}
              onChange={(event) => onDateChange(event.target.value)}
              className="h-8 w-full sm:w-36"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                onDateChange(new Date().toISOString().slice(0, 10))
              }
            >
              Bugün
            </Button>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="size-4" />
            </Button>
            <span className="min-w-0 flex-1 truncate rounded border border-slate-200 px-3 py-1.5 text-xs text-slate-500 sm:flex-none">
              {calendarId
                ? `Google Takvim bağlı: ${calendarId}`
                : "Google Takvim bağlı değil"}
            </span>
            {calendarId && (
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                disabled={googleSyncing}
                onClick={() => setRefreshNonce((value) => value + 1)}
                title="Google Takvim'i yenile"
              >
                <RefreshCw className="size-4" />
              </Button>
            )}
            <Button
              type="button"
              className="w-full bg-[#24a647] text-white sm:w-auto"
              onClick={() => setModal("checkout")}
            >
              <Plus className="size-4" />
              Yeni adisyon
            </Button>
          </div>
        </div>
        {googleSyncMessage && (
          <div className="border-b border-slate-200 bg-emerald-50 px-4 py-2 text-xs font-medium text-emerald-700">
            {googleSyncMessage}
          </div>
        )}
        <div ref={calendarScrollRef} className="max-h-[calc(100vh-220px)] overflow-auto sm:max-h-[calc(100vh-180px)]">
          {calendarView === "Aylık görünüm" ? (
            <div
              className="grid"
              style={{
                minWidth: Math.round(840 * (calendarWidth / 100)),
                gridTemplateColumns: "repeat(7, minmax(90px, 1fr))",
              }}
            >
              {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((day) => (
                <div
                  key={day}
                  className="border-b border-r border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs font-semibold text-slate-600"
                >
                  {day}
                </div>
              ))}
              {monthDates.map((date) => {
                const dateAppointments = visibleAppointments.filter(
                  (appointment) =>
                    appointment.date === date &&
                    (selectedStaffId === "all" ||
                      (appointment as Appointment & { staffId?: string }).staffId ===
                        selectedStaffId),
                );
                const dateCheckouts = checkouts.filter(
                  (checkout) =>
                    checkout.date === date &&
                    (selectedStaffId === "all" ||
                      getCheckoutStaffIds(checkout).includes(selectedStaffId)),
                );
                const inSelectedMonth = date.slice(0, 7) === selectedDate.slice(0, 7);
                const isToday = date === today;
                return (
                  <div
                    key={date}
                    className={[
                      "min-h-[118px] border-b border-r border-slate-200 p-1.5",
                      isToday ? "bg-[#f4efcf]" : "bg-white",
                      !inSelectedMonth ? "text-slate-300" : "text-slate-700",
                    ].join(" ")}
                  >
                    <div className="mb-1 text-right text-xs font-medium">
                      {Number(date.slice(-2))}
                    </div>
                    {dateAppointments.map((appointment) => (
                      <button
                        key={appointment.id}
                        type="button"
                        onClick={() => openAppointment(appointment)}
                        className="mb-1 block w-full truncate rounded bg-[#5f86b6] px-1.5 py-0.5 text-left text-[11px] font-medium text-white"
                      >
                        {appointment.time} {appointment.customerName}
                      </button>
                    ))}
                    {dateCheckouts.map((checkout) => (
                      <button
                        key={checkout.id}
                        type="button"
                        onClick={() => onSelectView("visit/list")}
                        className="mb-1 block w-full truncate rounded bg-[#24a647] px-1.5 py-0.5 text-left text-[11px] font-medium text-white"
                      >
                        {checkout.hour}:{checkout.minute} {checkout.customerName}{" "}
                        {getCheckoutServiceSummary(business, checkout)}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              className="grid"
              style={{
                minWidth: Math.round(
                  (calendarView === "Haftalık görünüm" ? 980 : 680) *
                    (calendarWidth / 100),
                ),
                gridTemplateColumns:
                  "52px repeat(" + visibleDates.length + ", minmax(100px, 1fr))",
              }}
            >
              <div className="border-r border-slate-200 bg-slate-50" />
              {visibleDates.map((date) => (
                <div
                  key={date}
                  className={[
                    "sticky top-0 z-10 border-b border-r border-slate-200 px-4 py-2 text-center text-xs font-semibold",
                    date === today
                      ? "bg-[#f4efcf] text-slate-800"
                      : "bg-[#e8f4e3] text-green-800",
                  ].join(" ")}
                >
                  <div>{formatDateLong(date)}</div>
                  <div className="font-normal">{calendarId || "Takvim"}</div>
                </div>
              ))}
              {slots.map((slot) => {
                const isCurrentSlot = isInSlot(
                  currentTime,
                  slot.hour,
                  slot.minute,
                  slotInterval,
                );
                const slotCells = visibleDates.map((date) => {
                  const slotAppointments = visibleAppointments.filter(
                    (appointment) =>
                      appointment.date === date &&
                      isInSlot(
                        appointment.time,
                        slot.hour,
                        slot.minute,
                        slotInterval,
                      ) &&
                      (selectedStaffId === "all" ||
                        (appointment as Appointment & { staffId?: string })
                          .staffId === selectedStaffId),
                  );
                  const slotCheckouts = checkouts.filter(
                    (checkout) =>
                      checkout.date === date &&
                      isInSlot(
                        checkout.hour + ":" + checkout.minute,
                        slot.hour,
                        slot.minute,
                        slotInterval,
                      ) &&
                      (selectedStaffId === "all" ||
                        getCheckoutStaffIds(checkout).includes(selectedStaffId)),
                  );
                  return { date, slotAppointments, slotCheckouts };
                });
                const slotHasItems = slotCells.some(
                  (cell) =>
                    cell.slotAppointments.length > 0 ||
                    cell.slotCheckouts.length > 0,
                );
                const rowHeight = slotHasItems ? 64 : 20;
                return (
                  <div
                    key={slot.label}
                    className="contents"
                    data-current-time-slot={isCurrentSlot ? "true" : undefined}
                  >
                    <div
                      className={[
                        "border-r border-b border-slate-200 px-2 text-right text-xs text-slate-500",
                        slotHasItems ? "py-2" : "py-0.5 text-[10px]",
                        isCurrentSlot
                          ? "bg-[#f4efcf] font-semibold dark:bg-amber-500/25 dark:text-amber-100"
                          : "bg-slate-50",
                      ].join(" ")}
                      style={{ minHeight: rowHeight }}
                    >
                      {slot.label}
                    </div>
                    {slotCells.map(({ date, slotAppointments, slotCheckouts }) => (
                      <div
                        key={date + "-" + slot.label}
                        className={[
                          "border-b border-r border-slate-200",
                          slotHasItems ? "py-1" : "py-0",
                          date === today
                            ? isCurrentSlot
                              ? "bg-[#f7efc0] dark:bg-amber-500/20"
                              : "bg-[#fff8d8]"
                            : "bg-[#fffde9]",
                        ].join(" ")}
                        style={{ minHeight: rowHeight }}
                      >
                        {slotAppointments.map((appointment) => (
                          <div
                            key={appointment.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => openAppointment(appointment)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                openAppointment(appointment);
                              }
                            }}
                            className={[
                              "mx-2 mt-1 cursor-pointer rounded border-l-4 border-[#5f86b6] bg-white px-2 py-1.5 text-xs shadow-sm transition-colors hover:bg-slate-50",
                              calendarTextClass,
                            ].join(" ")}
                          >
                            <div className="font-semibold">
                              {appointment.time} - {appointment.customerName}
                            </div>
                            <div className="line-clamp-2 leading-snug text-slate-500">
                              {appointment.description || appointment.status}
                            </div>
                          </div>
                        ))}
                        {slotCheckouts.map((checkout) => (
                          <div
                            key={checkout.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => onSelectView("visit/list")}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                onSelectView("visit/list");
                              }
                            }}
                            className={[
                              "mx-2 mt-1 cursor-pointer rounded border-l-4 border-[#24a647] bg-white px-2 py-1.5 text-xs shadow-sm transition-colors hover:bg-slate-50",
                              calendarTextClass,
                            ].join(" ")}
                          >
                            <div className="font-semibold">
                              {checkout.hour}:{checkout.minute} - {checkout.customerName}
                            </div>
                            <div className="line-clamp-2 leading-snug text-slate-500">
                              {getCheckoutServiceSummary(business, checkout)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
      {modal === "checkout" && (
        <CheckoutModal
          business={business}
          contacts={contacts}
          saving={saving}
          initialDate={selectedDate}
          initialCustomerName={newCustomerName}
          onClose={() => setModal(null)}
          onCreateCustomer={(name) => {
            setNewCustomerName(name);
            setModal("customer");
          }}
          onSubmit={createCheckout}
        />
      )}
      {modal === "customer" && (
        <CustomerModal
          saving={saving}
          initialName={newCustomerName}
          onClose={() => setModal("checkout")}
          onSubmit={createCustomer}
        />
      )}
      {selectedAppointment && (
        <AppointmentEditModal
          appointment={selectedAppointment}
          business={business}
          onClose={() => setSelectedAppointment(null)}
          onSaved={(updated) => {
            onAppointmentUpdated?.(updated);
            setSelectedAppointment(null);
          }}
        />
      )}
      {settingsOpen && (
        <CalendarSettingsModal
          settings={business.bookingSettings || {}}
          saving={saving}
          onClose={() => setSettingsOpen(false)}
          onSave={async (settings) => {
            await onUpdateAndSave({
              bookingSettings: {
                ...(business.bookingSettings || {}),
                ...settings,
              },
            });
            setSettingsOpen(false);
          }}
        />
      )}
    </div>
  );
}

function AppointmentEditModal({
  appointment,
  business,
  onClose,
  onSaved,
}: {
  appointment: Appointment;
  business: Business;
  onClose: () => void;
  onSaved: (appointment: Appointment) => void;
}) {
  const currentService = (business.services || []).find(
    (service) => service.id === appointment.serviceId,
  );
  const currentStaff = (business.staff || []).find(
    (staff) => staff.id === appointment.staffId,
  );
  const parts = String(appointment.description || "")
    .split(" · ")
    .map((part) => part.trim())
    .filter(Boolean);
  const sourceRef =
    parts.find((part) => part.startsWith("Salonappy #")) || "";
  const initialNote = parts
    .filter(
      (part) =>
        part !== currentService?.name &&
        part !== currentStaff?.name &&
        part !== sourceRef,
    )
    .join(" · ");

  const [form, setForm] = useState({
    customerName: appointment.customerName || "",
    phone: appointment.phone || "",
    date: appointment.date || "",
    time: appointment.time || "",
    serviceId: appointment.serviceId || "",
    staffId: appointment.staffId || "",
    note: initialNote,
    status: appointment.status || "CONFIRMED",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    return () => previous?.focus();
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, saving]);

  async function cancelAppointment() {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELED" }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Randevu iptal edilemedi.");
      }
      onSaved(data.appointment as Appointment);
    } catch (cancelError) {
      setError(
        cancelError instanceof Error
          ? cancelError.message
          : "Randevu iptal edilemedi.",
      );
      setConfirmCancel(false);
    } finally {
      setSaving(false);
    }
  }

  async function save() {
    if (!form.customerName.trim()) {
      setError("Müşteri adı zorunlu.");
      return;
    }
    if (!form.date || !form.time) {
      setError("Tarih ve saat zorunlu.");
      return;
    }
    setSaving(true);
    setError("");
    const serviceName = (business.services || []).find(
      (service) => service.id === form.serviceId,
    )?.name;
    const staffName = (business.staff || []).find(
      (staff) => staff.id === form.staffId,
    )?.name;
    const description = [
      serviceName,
      staffName,
      form.note.trim(),
      sourceRef,
    ]
      .filter(Boolean)
      .join(" · ");
    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.customerName,
          phone: form.phone,
          date: form.date,
          time: form.time,
          serviceId: form.serviceId || null,
          staffId: form.staffId || null,
          description,
          status: form.status,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Randevu güncellenemedi.");
      }
      onSaved(data.appointment as Appointment);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Randevu güncellenemedi.",
      );
      setConfirmCancel(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Randevuyu düzenle"
    >
      <section className="w-full max-w-2xl rounded bg-white shadow-xl">
        <ModalHeader title="Randevuyu düzenle" onClose={onClose} />
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Müşteri
            <Input
              autoFocus
              value={form.customerName}
              onChange={(event) =>
                setForm({ ...form, customerName: event.target.value })
              }
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Telefon
            <Input
              value={form.phone}
              inputMode="tel"
              onChange={(event) =>
                setForm({ ...form, phone: event.target.value })
              }
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Tarih
            <Input
              type="date"
              value={form.date}
              onChange={(event) =>
                setForm({ ...form, date: event.target.value })
              }
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Saat
            <Input
              type="time"
              value={form.time}
              onChange={(event) =>
                setForm({ ...form, time: event.target.value })
              }
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Hizmet
            <NativeSelect
              value={form.serviceId}
              onChange={(value) => setForm({ ...form, serviceId: value })}
              options={[
                { value: "", label: "Hizmet seçilmedi" },
                ...(business.services || []).map((service) => ({
                  value: service.id,
                  label: service.name,
                })),
              ]}
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Personel
            <NativeSelect
              value={form.staffId}
              onChange={(value) => setForm({ ...form, staffId: value })}
              options={[
                { value: "", label: "Personel seçilmedi" },
                ...(business.staff || []).map((staff) => ({
                  value: staff.id,
                  label: staff.name,
                })),
              ]}
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700 sm:col-span-2">
            Not
            <Textarea
              rows={3}
              value={form.note}
              onChange={(event) =>
                setForm({ ...form, note: event.target.value })
              }
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Durum
            <NativeSelect
              value={form.status}
              onChange={(value) => setForm({ ...form, status: value })}
              options={[
                { value: "REQUESTED", label: "Talep" },
                { value: "CONFIRMED", label: "Onaylı" },
                { value: "COMPLETED", label: "Tamamlandı" },
                { value: "CANCELED", label: "İptal" },
              ]}
            />
          </label>
        </div>
        {error && (
          <div className="mx-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {confirmCancel && (
          <div className="mx-4 mt-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <p className="font-semibold">Bu randevu iptal edilsin mi?</p>
            <p className="mt-1">
              Randevu takvimden kaldırılır; kayıt geçmişte “İptal” olarak kalır.
            </p>
            <div className="mt-3 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmCancel(false)}
              >
                Vazgeç
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={saving}
                onClick={cancelAppointment}
              >
                Evet, iptal et
              </Button>
            </div>
          </div>
        )}
        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 px-4 py-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Kapat
          </Button>
          {form.status !== "CANCELED" && !confirmCancel && (
            <Button
              type="button"
              variant="destructive"
              disabled={saving}
              onClick={() => setConfirmCancel(true)}
            >
              İptal et
            </Button>
          )}
          <Button
            type="button"
            disabled={saving || confirmCancel}
            onClick={() => save()}
            className="bg-[#24a647] text-white"
          >
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </section>
    </div>
  );
}

export function AppointmentsPage({
  appointments,
  business,
  onAppointmentUpdated,
}: {
  appointments: Appointment[];
  business: Business;
  onAppointmentUpdated?: (appointment: Appointment) => void;
}) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [staffFilter, setStaffFilter] = useState("all");
  const [selectedRow, setSelectedRow] = useState<AppointmentListRow | null>(null);
  const [editingAppointment, setEditingAppointment] =
    useState<Appointment | null>(null);
  const [statusSavingId, setStatusSavingId] = useState<string | null>(null);
  const [statusError, setStatusError] = useState("");

  const checkoutRows = (business.checkouts || []).map((checkout) => {
    const customer = (business.customers || []).find(
      (item) =>
        item.id === checkout.customerId || item.name === checkout.customerName,
    );
    const staffIds = getCheckoutStaffIds(checkout);
    return {
      id: `checkout-${checkout.id}`,
      rawId: checkout.id,
      rawIds: [],
      appointments: [],
      kind: "checkout" as const,
      customerName: checkout.customerName,
      phone: customer?.phone || "-",
      date: checkout.date,
      time: `${checkout.hour}:${checkout.minute}`,
      description: getCheckoutServiceSummary(business, checkout) || "Adisyon",
      status: checkout.attendance || checkout.status || "-",
      staffId: staffIds[0] || "",
      serviceId: checkout.serviceId || "",
    };
  });
  const appointmentGroups = new Map<string, Appointment[]>();
  for (const appointment of appointments) {
    const key = getAppointmentGroupKey(appointment);
    const group = appointmentGroups.get(key) || [];
    group.push(appointment);
    appointmentGroups.set(key, group);
  }
  const appointmentRows = [...appointmentGroups.entries()].map(
    ([key, group]) => {
      const first = group[0];
      const serviceNames = Array.from(
        new Set(
          group.map((appointment) =>
            getAppointmentServiceName(business, appointment),
          ),
        ),
      );
      const notes = Array.from(
        new Set(
          group
            .map((appointment) => getAppointmentNoteText(business, appointment))
            .filter(Boolean),
        ),
      );
      const statuses = Array.from(
        new Set(group.map((appointment) => appointment.status)),
      );
      const times = Array.from(
        new Set(group.map((appointment) => appointment.time)),
      ).sort();
      const staffIds = Array.from(
        new Set(group.map((appointment) => appointment.staffId).filter(Boolean)),
      );
      const serviceIds = Array.from(
        new Set(
          group.map((appointment) => appointment.serviceId).filter(Boolean),
        ),
      );
      return {
        id: `appointment-group-${key}`,
        rawId: first.id,
        rawIds: group.map((appointment) => appointment.id),
        appointments: group,
        kind: "appointment" as const,
        customerName: first.customerName,
        phone: group.find((appointment) => appointment.phone)?.phone || "-",
        date: first.date,
        time: times.join(" / "),
        description:
          [serviceNames.join(" + "), notes.join(" · ")]
            .filter(Boolean)
            .join(" · ") || first.description,
        status: statuses.length === 1 ? statuses[0] || "CONFIRMED" : "MIXED",
        staffId: staffIds.length === 1 ? staffIds[0] || "" : "",
        serviceId: serviceIds.length === 1 ? serviceIds[0] || "" : "",
      };
    },
  );
  const rows: AppointmentListRow[] = [...checkoutRows, ...appointmentRows].sort((a, b) =>
    `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`),
  );
  const filteredRows = rows.filter((row) => {
    const statusMatches =
      statusFilter === "all" ||
      row.status === statusFilter ||
      row.appointments.some((appointment) => appointment.status === statusFilter);
    const staffMatches =
      staffFilter === "all" ||
      row.staffId === staffFilter ||
      row.appointments.some((appointment) => appointment.staffId === staffFilter);
    return statusMatches && staffMatches;
  });

  async function updateAppointmentStatus(
    appointment: Appointment,
    status: string,
  ) {
    setStatusError("");
    setStatusSavingId(appointment.id);
    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Randevu güncellenemedi.");
      }
      if (data.appointment) {
        const updated = data.appointment as Appointment;
        onAppointmentUpdated?.(updated);
        setSelectedRow((current) => {
          if (!current) return current;
          const appointments = current.appointments.map((item) =>
            item.id === updated.id ? { ...item, ...updated } : item,
          );
          const statuses = new Set(
            appointments.map((appointment) => appointment.status),
          );
          return {
            ...current,
            appointments,
            status:
              statuses.size === 1
                ? Array.from(statuses)[0] || "CONFIRMED"
                : "MIXED",
          };
        });
      }
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : "Randevu güncellenemedi.");
    } finally {
      setStatusSavingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          { label: "Aloyz", view: "dashboard" },
          { label: "Randevular", view: "booking/list" },
        ]}
      />
      <section className="rounded bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-700">
              Randevular ({filteredRows.length})
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Randevuları ve adisyon kayıtlarını burada görüntüleyin; düzenleme
              ve iptal işlemleri satır detayından yapılır.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-9 rounded border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="all">Tüm durumlar</option>
              <option value="REQUESTED">Talep</option>
              <option value="CONFIRMED">Onaylı</option>
              <option value="COMPLETED">Tamamlandı</option>
              <option value="CANCELED">İptal</option>
            </select>
            <select
              value={staffFilter}
              onChange={(event) => setStaffFilter(event.target.value)}
              className="h-9 rounded border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="all">Tüm personel</option>
              {(business.staff || []).map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        {statusError && (
          <div className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {statusError}
          </div>
        )}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="border-y border-slate-200 text-slate-600">
              <tr>
                <th className="px-3 py-3">Müşteri</th>
                <th className="px-3 py-3">Telefon</th>
                <th className="px-3 py-3">Tarih</th>
                <th className="px-3 py-3">Saat</th>
                <th className="px-3 py-3">Hizmetler</th>
                <th className="px-3 py-3">Durum</th>
                <th className="px-3 py-3 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.map((appointment) => (
                <tr key={appointment.id}>
                  <td className="px-3 py-3 font-medium">
                    {appointment.customerName}
                  </td>
                  <td className="px-3 py-3">{appointment.phone}</td>
                  <td className="px-3 py-3">{appointment.date}</td>
                  <td className="px-3 py-3">{appointment.time}</td>
                  <td className="px-3 py-3">{appointment.description}</td>
                  <td className="px-3 py-3">{formatAppointmentStatus(appointment.status)}</td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedRow(appointment)}
                      >
                        Detay
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-10 text-center text-slate-400"
                  >
                    Randevu yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      {selectedRow && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
          <div className="w-full max-w-xl rounded bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Randevu detayı
                </h2>
                <p className="text-sm text-slate-500">
                  {selectedRow.customerName}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={() => setSelectedRow(null)}
              >
                <X className="size-4" />
              </Button>
            </div>
            {statusError && (
              <div className="mx-4 mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {statusError}
              </div>
            )}
            <div className="grid gap-3 p-4 text-sm sm:grid-cols-2">
              <InfoRow label="Telefon" value={selectedRow.phone} />
              <InfoRow
                label="Tarih"
                value={`${selectedRow.date} ${selectedRow.time}`}
              />
              <InfoRow
                label="Durum"
                value={formatAppointmentStatus(selectedRow.status)}
              />
              {selectedRow.kind === "checkout" && (
                <div className="sm:col-span-2">
                  <InfoRow label="Not" value={selectedRow.description || "-"} />
                </div>
              )}
            </div>
            {selectedRow.kind === "appointment" && (
              <div className="border-t border-slate-200 px-4 py-3">
                <h3 className="mb-2 text-sm font-semibold text-slate-700">
                  Hizmetler
                </h3>
                <div className="divide-y divide-slate-100">
                  {selectedRow.appointments.map((appointment) => {
                    const serviceName = getAppointmentServiceName(
                      business,
                      appointment,
                    );
                    const staffName = getAppointmentStaffName(
                      business,
                      appointment,
                    );
                    const note = getAppointmentNoteText(business, appointment);
                    return (
                      <div
                        key={appointment.id}
                        className="flex flex-wrap items-start justify-between gap-2 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-slate-800">
                            {serviceName}
                          </div>
                          <div className="text-xs text-slate-500">
                            {appointment.time} ·{" "}
                            {staffName || "Personel belirtilmemiş"} ·{" "}
                            {formatAppointmentStatus(appointment.status)}
                          </div>
                          {note && (
                            <div className="mt-1 text-xs text-slate-500">
                              {note}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingAppointment(appointment)}
                          >
                            Düzenle
                          </Button>
                          {appointment.status !== "CANCELED" && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={statusSavingId === appointment.id}
                              onClick={() =>
                                updateAppointmentStatus(appointment, "CANCELED")
                              }
                            >
                              İptal
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {editingAppointment && (
        <AppointmentEditModal
          appointment={editingAppointment}
          business={business}
          onClose={() => setEditingAppointment(null)}
          onSaved={(updated) => {
            onAppointmentUpdated?.(updated);
            setEditingAppointment(null);
            setSelectedRow(null);
          }}
        />
      )}
    </div>
  );
}

type AppointmentListRow = {
  id: string;
  rawId: string;
  rawIds: string[];
  appointments: Appointment[];
  kind: "appointment" | "checkout";
  customerName: string;
  phone: string;
  date: string;
  time: string;
  description: string;
  status: string;
  staffId: string;
  serviceId: string;
};

function formatAppointmentStatus(status: string) {
  if (status === "REQUESTED") return "Talep";
  if (status === "CONFIRMED") return "Onaylı";
  if (status === "COMPLETED") return "Tamamlandı";
  if (status === "CANCELED") return "İptal";
  if (status === "MIXED") return "Karma";
  return status || "-";
}

function getAppointmentGroupKey(appointment: Appointment) {
  const eventId = String(appointment.eventId || "");
  const match = eventId.match(
    /^salonappy:(\d+):(?:(?:calendar|summary):)?([^:]+)/,
  );
  if (match) return `salonappy:${match[1]}:${match[2]}`;
  return `appointment:${appointment.id}`;
}

function getAppointmentServiceName(
  business: Business,
  appointment: Appointment,
) {
  return (
    (business.services || []).find(
      (service) => service.id === appointment.serviceId,
    )?.name ||
    String(appointment.description || "").split(" · ")[0] ||
    "Hizmet belirtilmemiş"
  );
}

function getAppointmentStaffName(business: Business, appointment: Appointment) {
  return (
    (business.staff || []).find((staff) => staff.id === appointment.staffId)
      ?.name || ""
  );
}

function getAppointmentNoteText(business: Business, appointment: Appointment) {
  const serviceName = getAppointmentServiceName(business, appointment);
  const staffName = getAppointmentStaffName(business, appointment);
  return String(appointment.description || "")
    .split(" · ")
    .map((part) => part.trim())
    .filter(
      (part) =>
        part &&
        part !== serviceName &&
        part !== staffName &&
        !part.startsWith("Salonappy #"),
    )
    .join(" · ");
}

function getCheckoutLines(checkout: CheckoutItem) {
  if (checkout.lines && checkout.lines.length > 0) {
    return checkout.lines;
  }
  return [
    {
      id: `${checkout.id}-line`,
      staffId: checkout.staffId,
      serviceId: checkout.serviceId,
      duration: checkout.duration,
      amount: checkout.amount,
    },
  ];
}

function getCheckoutStaffIds(checkout: CheckoutItem) {
  return Array.from(new Set(getCheckoutLines(checkout).map((line) => line.staffId)));
}

function getCheckoutServiceSummary(business: Business, checkout: CheckoutItem) {
  return getCheckoutLines(checkout)
    .map((line) => {
      const service = (business.services || []).find(
        (item) => item.id === line.serviceId,
      );
      return service?.name;
    })
    .filter(Boolean)
    .join(", ");
}

function isInSlot(
  time: string,
  slotHour: number,
  slotMinute: number,
  interval: number,
) {
  const [hourText, minuteText] = time.split(":");
  const total = Number(hourText) * 60 + Number(minuteText || "0");
  const slotStart = slotHour * 60 + slotMinute;
  return total >= slotStart && total < slotStart + interval;
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function getWeekStart(value: string) {
  const date = new Date(`${value}T12:00:00`);
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  return date.toISOString().slice(0, 10);
}

function normalizeCalendarView(value: string | undefined) {
  if (value === "Günlük görünüm" || value === "Aylık görünüm") return value;
  return "Haftalık görünüm";
}

function getMonthGridDates(value: string) {
  const selected = new Date(`${value}T12:00:00`);
  const firstOfMonth = new Date(selected.getFullYear(), selected.getMonth(), 1, 12);
  const startDay = firstOfMonth.getDay() || 7;
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - startDay + 1);
  return Array.from({ length: 35 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date.toISOString().slice(0, 10);
  });
}

function formatDateInIstanbul(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function formatTimeInIstanbul(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function syncCheckoutToGoogleCalendar(business: Business, checkout: CheckoutItem) {
  if (!business.calendarId) return;
  for (const line of getCheckoutLines(checkout)) {
    const service = (business.services || []).find(
      (item) => item.id === line.serviceId,
    );
    const staff = (business.staff || []).find((item) => item.id === line.staffId);
    const start = new Date(
      `${checkout.date}T${checkout.hour}:${checkout.minute}:00+03:00`,
    );
    const end = new Date(start.getTime() + line.duration * 60 * 1000);
    fetch(`/api/calendar/events?businessId=${encodeURIComponent(business.id)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        summary: `${checkout.customerName} - ${service?.name || "Hizmet"}`,
        description: [
          checkout.notes,
          staff ? `Personel: ${staff.name}` : null,
          `Adisyon: ${checkout.id}`,
        ]
          .filter(Boolean)
          .join("\n"),
        start: start.toISOString(),
        end: end.toISOString(),
        checkoutId: checkout.id,
        lineId: line.id,
      }),
    }).catch(() => undefined);
  }
}

function CalendarSettingsModal({
  settings,
  saving,
  onClose,
  onSave,
}: {
  settings: BookingSettings;
  saving: boolean;
  onClose: () => void;
  onSave: (settings: Partial<BookingSettings>) => Promise<void>;
}) {
  const [view, setView] = useState(normalizeCalendarView(settings.calendarView));
  const [width, setWidth] = useState(settings.calendarWidth || "80");
  const [slotInterval, setSlotInterval] = useState(
    settings.calendarSlotInterval || "60 Dakika",
  );
  const [textColor, setTextColor] = useState(
    settings.calendarTextColor || "Dinamik",
  );

  function resetDefaults() {
    setView("Haftalık görünüm");
    setWidth("80");
    setSlotInterval("60 Dakika");
    setTextColor("Dinamik");
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-start bg-slate-950/35 p-6">
      <section className="mx-auto mt-4 w-full max-w-md rounded bg-white shadow-xl">
        <ModalHeader title="Takvim ayarları" onClose={onClose} />
        <div className="grid gap-4 p-4">
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Takvim görünümü
            <NativeSelect
              value={view}
              onChange={setView}
              options={[
                { value: "Günlük görünüm", label: "Günlük görünüm" },
                { value: "Haftalık görünüm", label: "Haftalık görünüm" },
                { value: "Aylık görünüm", label: "Aylık görünüm" },
              ]}
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Takvim genişliği
            <span className="text-sm text-slate-700">{width} ↔</span>
            <input
              type="range"
              min="60"
              max="140"
              value={width}
              onChange={(event) => setWidth(event.target.value)}
              className="accent-[#5f86b6]"
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Takvim saat aralığı
            <NativeSelect
              value={slotInterval}
              onChange={setSlotInterval}
              options={["15 Dakika", "30 Dakika", "60 Dakika"].map((value) => ({
                value,
                label: value,
              }))}
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Takvim yazı rengi
            <NativeSelect
              value={textColor}
              onChange={setTextColor}
              options={["Dinamik", "Koyu", "Açık"].map((value) => ({
                value,
                label: value,
              }))}
            />
          </label>
          <Button type="button" onClick={resetDefaults} className="bg-cyan-600 text-white">
            Varsayılan ayarlara dön
          </Button>
          <Button
            type="button"
            disabled={saving}
            onClick={() =>
              onSave({
                calendarView: view,
                calendarWidth: width,
                calendarSlotInterval: slotInterval,
                calendarTextColor: textColor,
              })
            }
            className="bg-[#24a647] text-white"
          >
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </section>
    </div>
  );
}
