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
}) {
  const [modal, setModal] = useState<"checkout" | "customer" | null>(null);
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
  const calendarWidth = Number(calendarSettings.calendarWidth || "100");
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
  const visibleAppointments = [...appointments, ...googleAppointments];
  const dayAppointments = visibleAppointments.filter(
    (appointment) =>
      appointment.date === selectedDate &&
      (selectedStaffId === "all" ||
        (appointment as Appointment & { staffId?: string }).staffId ===
          selectedStaffId),
  );
  const checkouts = business.checkouts || [];
  const dayCheckouts = checkouts.filter(
    (checkout) =>
      checkout.date === selectedDate &&
      (selectedStaffId === "all" ||
        getCheckoutStaffIds(checkout).includes(selectedStaffId)),
  );

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
                gridTemplateColumns: "repeat(7, minmax(116px, 1fr))",
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
                        onClick={() => onSelectView("booking/list")}
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
                  "52px repeat(" + visibleDates.length + ", minmax(128px, 1fr))",
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
                return (
                  <div
                    key={slot.label}
                    className="contents"
                    data-current-time-slot={isCurrentSlot ? "true" : undefined}
                  >
                    <div
                      className={[
                        "border-r border-b border-slate-200 px-2 py-2 text-right text-xs text-slate-500",
                        isCurrentSlot
                          ? "bg-[#f4efcf] font-semibold dark:bg-amber-500/25 dark:text-amber-100"
                          : "bg-slate-50",
                      ].join(" ")}
                    >
                      {slot.label}
                    </div>
                    {visibleDates.map((date) => {
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
                      return (
                        <div
                          key={date + "-" + slot.label}
                          className={[
                            "min-h-[64px] border-b border-r border-slate-200 py-1",
                            date === today
                              ? isCurrentSlot
                                ? "bg-[#f7efc0] dark:bg-amber-500/20"
                                : "bg-[#fff8d8]"
                              : "bg-[#fffde9]",
                          ].join(" ")}
                        >
                          {slotAppointments.map((appointment) => (
                            <div
                              key={appointment.id}
                              role="button"
                              tabIndex={0}
                              onClick={() => onSelectView("booking/list")}
                              onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                  onSelectView("booking/list");
                                }
                              }}
                              className={[
                                "mx-2 mt-1 rounded border-l-4 border-[#5f86b6] bg-white px-3 py-2 text-xs shadow-sm",
                                calendarTextClass,
                              ].join(" ")}
                            >
                              <div className="font-semibold">
                                {appointment.time} - {appointment.customerName}
                              </div>
                              <div className="truncate text-slate-500">
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
                                "mx-2 mt-1 rounded border-l-4 border-[#24a647] bg-white px-3 py-2 text-xs shadow-sm",
                                calendarTextClass,
                              ].join(" ")}
                            >
                              <div className="font-semibold">
                                {checkout.hour}:{checkout.minute} - {checkout.customerName}
                              </div>
                              <div className="truncate text-slate-500">
                                {getCheckoutServiceSummary(business, checkout)}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
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

export function AppointmentsPage({
  appointments,
  business,
}: {
  appointments: Appointment[];
  business: Business;
}) {
  const [sourceFilter, setSourceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [staffFilter, setStaffFilter] = useState("all");
  const [selectedRow, setSelectedRow] = useState<AppointmentListRow | null>(null);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({});
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
      kind: "checkout" as const,
      customerName: checkout.customerName,
      phone: customer?.phone || "-",
      date: checkout.date,
      time: `${checkout.hour}:${checkout.minute}`,
      description: getCheckoutServiceSummary(business, checkout) || "Adisyon",
      status: checkout.attendance || checkout.status || "-",
      staffId: staffIds[0] || "",
      serviceId: checkout.serviceId || "",
      sourceKey: "checkout",
      source: "Adisyon",
    };
  });
  const appointmentRows = appointments.map((appointment) => {
    const sourceKey = getAppointmentSourceKey(appointment);
    return {
      id: `appointment-${appointment.id}`,
      rawId: appointment.id,
      kind: "appointment" as const,
      customerName: appointment.customerName,
      phone: appointment.phone || "-",
      date: appointment.date,
      time: appointment.time,
      description: appointment.description,
      status: statusOverrides[appointment.id] || appointment.status,
      staffId: appointment.staffId || "",
      serviceId: appointment.serviceId || "",
      sourceKey,
      source: getAppointmentSourceLabel(sourceKey),
    };
  });
  const rows: AppointmentListRow[] = [...checkoutRows, ...appointmentRows].sort((a, b) =>
    `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`),
  );
  const filteredRows = rows.filter((row) => {
    const sourceMatches = sourceFilter === "all" || row.sourceKey === sourceFilter;
    const statusMatches = statusFilter === "all" || row.status === statusFilter;
    const staffMatches = staffFilter === "all" || row.staffId === staffFilter;
    return sourceMatches && statusMatches && staffMatches;
  });

  async function updateAppointmentStatus(row: AppointmentListRow, status: string) {
    if (row.kind !== "appointment") return;
    setStatusError("");
    setStatusSavingId(row.id);
    try {
      const response = await fetch(`/api/appointments/${row.rawId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Randevu güncellenemedi.");
      }
      const nextStatus = data.appointment?.status || status;
      setStatusOverrides((current) => ({ ...current, [row.rawId]: nextStatus }));
      setSelectedRow((current) =>
        current?.id === row.id ? { ...current, status: nextStatus } : current,
      );
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
              Adisyon kaynaklı kayıtlar burada görünür; durum işlemleri gerçek randevu kayıtlarında yapılır.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={sourceFilter}
              onChange={(event) => setSourceFilter(event.target.value)}
              className="h-9 rounded border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="all">Tüm kaynaklar</option>
              <option value="checkout">Adisyon</option>
              <option value="public">Online randevu</option>
              <option value="bot">Bot</option>
              <option value="google">Google / diğer</option>
            </select>
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
                <th className="px-3 py-3">Not</th>
                <th className="px-3 py-3">Durum</th>
                <th className="px-3 py-3">Kaynak</th>
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
                  <td className="px-3 py-3">{appointment.source}</td>
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
                      {appointment.kind === "appointment" && appointment.status === "REQUESTED" && (
                        <Button
                          type="button"
                          size="sm"
                          disabled={statusSavingId === appointment.id}
                          onClick={() => updateAppointmentStatus(appointment, "CONFIRMED")}
                        >
                          Onayla
                        </Button>
                      )}
                      {appointment.kind === "appointment" && appointment.status === "CONFIRMED" && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={statusSavingId === appointment.id}
                          onClick={() => updateAppointmentStatus(appointment, "COMPLETED")}
                        >
                          Tamamlandı
                        </Button>
                      )}
                      {appointment.kind === "appointment" && appointment.status !== "CANCELED" && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={statusSavingId === appointment.id}
                          onClick={() => updateAppointmentStatus(appointment, "CANCELED")}
                        >
                          İptal
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
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
                <h2 className="text-lg font-semibold text-slate-800">Randevu detayı</h2>
                <p className="text-sm text-slate-500">{selectedRow.customerName}</p>
              </div>
              <Button type="button" variant="outline" size="icon-sm" onClick={() => setSelectedRow(null)}>
                <X className="size-4" />
              </Button>
            </div>
            <div className="grid gap-3 p-4 text-sm sm:grid-cols-2">
              <InfoRow label="Telefon" value={selectedRow.phone} />
              <InfoRow label="Tarih" value={`${selectedRow.date} ${selectedRow.time}`} />
              <InfoRow label="Durum" value={formatAppointmentStatus(selectedRow.status)} />
              <InfoRow label="Kaynak" value={selectedRow.source} />
              <InfoRow
                label="Personel"
                value={
                  (business.staff || []).find((staff) => staff.id === selectedRow.staffId)?.name ||
                  "Belirtilmemiş"
                }
              />
              <InfoRow
                label="Hizmet"
                value={
                  (business.services || []).find((service) => service.id === selectedRow.serviceId)?.name ||
                  selectedRow.description
                }
              />
              <div className="sm:col-span-2">
                <InfoRow label="Not" value={selectedRow.description || "-"} />
              </div>
            </div>
            {selectedRow.kind === "appointment" && (
              <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 px-4 py-3">
                {selectedRow.status === "REQUESTED" && (
                  <Button
                    type="button"
                    disabled={statusSavingId === selectedRow.id}
                    onClick={() => updateAppointmentStatus(selectedRow, "CONFIRMED")}
                  >
                    Onayla
                  </Button>
                )}
                {selectedRow.status === "CONFIRMED" && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={statusSavingId === selectedRow.id}
                    onClick={() => updateAppointmentStatus(selectedRow, "COMPLETED")}
                  >
                    Tamamlandı
                  </Button>
                )}
                {selectedRow.status !== "CANCELED" && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={statusSavingId === selectedRow.id}
                    onClick={() => updateAppointmentStatus(selectedRow, "CANCELED")}
                  >
                    İptal et
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type AppointmentListRow = {
  id: string;
  rawId: string;
  kind: "appointment" | "checkout";
  customerName: string;
  phone: string;
  date: string;
  time: string;
  description: string;
  status: string;
  staffId: string;
  serviceId: string;
  sourceKey: string;
  source: string;
};

function getAppointmentSourceKey(appointment: Appointment) {
  const source = String(appointment.source || "").toLowerCase();
  const eventId = String(appointment.eventId || "").toLowerCase();
  if (source === "public" || eventId.startsWith("public-")) return "public";
  if (source === "bot" || eventId.startsWith("bot-")) return "bot";
  return "google";
}

function getAppointmentSourceLabel(sourceKey: string) {
  if (sourceKey === "public") return "Online randevu";
  if (sourceKey === "bot") return "Bot";
  return "Google / diğer";
}

function formatAppointmentStatus(status: string) {
  if (status === "REQUESTED") return "Talep";
  if (status === "CONFIRMED") return "Onaylı";
  if (status === "COMPLETED") return "Tamamlandı";
  if (status === "CANCELED") return "İptal";
  return status || "-";
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
  if (value === "Haftalık görünüm" || value === "Aylık görünüm") return value;
  return "Günlük görünüm";
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
  const [width, setWidth] = useState(settings.calendarWidth || "100");
  const [slotInterval, setSlotInterval] = useState(
    settings.calendarSlotInterval || "15 Dakika",
  );
  const [textColor, setTextColor] = useState(
    settings.calendarTextColor || "Dinamik",
  );

  function resetDefaults() {
    setView("Günlük görünüm");
    setWidth("100");
    setSlotInterval("15 Dakika");
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
