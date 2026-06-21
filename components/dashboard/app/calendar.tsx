"use client";

import { useState } from "react";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Pencil,
  Plus,
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
  const staff = business.staff || [];
  const dayAppointments = appointments.filter(
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
      (selectedStaffId === "all" || checkout.staffId === selectedStaffId),
  );
  async function createCheckout(checkout: CheckoutItem) {
    setModal(null);
    await onUpdateAndSave({ checkouts: [checkout, ...checkouts] });
  }
  async function createCustomer(customer: CustomerProfile) {
    await onUpdateAndSave({
      customers: [customer, ...(business.customers || [])],
    });
    setModal("checkout");
  }
  const hours = Array.from({ length: 24 }, (_, hour) => hour);
  const shiftDate = (days: number) => {
    const date = new Date(`${selectedDate}T12:00:00`);
    date.setDate(date.getDate() + days);
    onDateChange(date.toISOString().slice(0, 10));
  };
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <NativeSelect
              value={selectedStaffId}
              onChange={setSelectedStaffId}
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
            <div className="min-w-[260px] rounded border border-slate-300 px-3 py-1.5 text-center text-sm font-medium">
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
              className="h-8 w-36"
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
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="size-4" />
            </Button>
            <span className="rounded border border-slate-200 px-3 py-1.5 text-xs text-slate-500">
              {calendarId || "Google Takvim bağlı değil"}
            </span>
            <Button
              type="button"
              className="bg-[#24a647] text-white"
              onClick={() => setModal("checkout")}
            >
              <Plus className="size-4" />
              Yeni adisyon
            </Button>
          </div>
        </div>
        <div className="max-h-[calc(100vh-180px)] overflow-auto">
          <div className="grid min-w-[860px] grid-cols-[64px_1fr]">
            <div className="border-r border-slate-200 bg-slate-50" />
            <div className="sticky top-0 z-10 border-b border-slate-200 bg-[#e8f4e3] px-4 py-2 text-center text-xs font-semibold text-green-800">
              {calendarId || "Takvim"}
            </div>
            {hours.map((hour) => (
              <div key={hour} className="contents">
                <div className="border-r border-b border-slate-200 bg-slate-50 px-2 py-2 text-right text-xs text-slate-500">
                  {String(hour).padStart(2, "0")}:00
                </div>
                <div className="relative min-h-[56px] border-b border-slate-200 bg-[#fffde9]">
                  {dayAppointments
                    .filter(
                      (appointment) =>
                        Number(appointment.time.slice(0, 2)) === hour,
                    )
                    .map((appointment) => (
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
                        className="absolute left-2 right-2 top-2 rounded border-l-4 border-[#5f86b6] bg-white px-3 py-2 text-xs shadow-sm"
                      >
                        <div className="font-semibold">
                          {appointment.time} - {appointment.customerName}
                        </div>
                        <div className="truncate text-slate-500">
                          {appointment.description || appointment.status}
                        </div>
                      </div>
                    ))}
                  {dayCheckouts
                    .filter((checkout) => Number(checkout.hour) === hour)
                    .map((checkout) => (
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
                        className="absolute left-2 right-2 top-2 rounded border-l-4 border-[#24a647] bg-white px-3 py-2 text-xs shadow-sm"
                      >
                        <div className="font-semibold">
                          {checkout.hour}:{checkout.minute} -{" "}
                          {checkout.customerName}
                        </div>
                        <div className="truncate text-slate-500">
                          {checkout.notes || checkout.status}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
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
        <CalendarSettingsModal onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  );
}

export function AppointmentsPage({ appointments }: { appointments: Appointment[] }) {
  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          { label: "Aloyz", view: "dashboard" },
          { label: "Randevular", view: "booking/list" },
        ]}
      />
      <section className="rounded bg-white p-4 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-700">
          Randevular ({appointments.length})
        </h1>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-y border-slate-200 text-slate-600">
              <tr>
                <th className="px-3 py-3">Müşteri</th>
                <th className="px-3 py-3">Telefon</th>
                <th className="px-3 py-3">Tarih</th>
                <th className="px-3 py-3">Saat</th>
                <th className="px-3 py-3">Not</th>
                <th className="px-3 py-3">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {appointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td className="px-3 py-3 font-medium">
                    {appointment.customerName}
                  </td>
                  <td className="px-3 py-3">{appointment.phone}</td>
                  <td className="px-3 py-3">{appointment.date}</td>
                  <td className="px-3 py-3">{appointment.time}</td>
                  <td className="px-3 py-3">{appointment.description}</td>
                  <td className="px-3 py-3">{appointment.status}</td>
                </tr>
              ))}
              {appointments.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
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
    </div>
  );
}

function CalendarSettingsModal({ onClose }: { onClose: () => void }) {
  const [width, setWidth] = useState("100");
  return (
    <div className="fixed inset-0 z-50 grid place-items-start bg-slate-950/35 p-6">
      <section className="mx-auto mt-4 w-full max-w-md rounded bg-white shadow-xl">
        <ModalHeader title="Takvim ayarları" onClose={onClose} />
        <div className="grid gap-4 p-4">
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Takvim görünümü
            <NativeSelect
              value="Günlük görünüm"
              onChange={() => undefined}
              options={[
                { value: "Günlük görünüm", label: "Günlük görünüm" },
                { value: "Haftalık görünüm", label: "Haftalık görünüm" },
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
              value="15 Dakika"
              onChange={() => undefined}
              options={["15 Dakika", "30 Dakika", "60 Dakika"].map((value) => ({
                value,
                label: value,
              }))}
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Takvim yazı rengi
            <NativeSelect
              value="Dinamik"
              onChange={() => undefined}
              options={["Dinamik", "Koyu", "Açık"].map((value) => ({
                value,
                label: value,
              }))}
            />
          </label>
          <Button type="button" className="bg-cyan-600 text-white">
            Varsayılan ayarlara dön
          </Button>
          <Button
            type="button"
            onClick={onClose}
            className="bg-[#24a647] text-white"
          >
            Kaydet
          </Button>
        </div>
      </section>
    </div>
  );
}
