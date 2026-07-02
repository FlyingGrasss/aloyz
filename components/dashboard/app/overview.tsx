"use client";

import { useMemo, useState } from "react";
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

export function OverviewPage({
  business,
  contacts,
  onUpdateAndSave,
  onSelectView,
  canManageSetup,
}: {
  business: Business;
  contacts: ContactRow[];
  onUpdateAndSave: (fields: Partial<Business>) => Promise<boolean>;
  onSelectView: (view: ViewId) => void;
  canManageSetup: boolean;
}) {
  const [tab, setTab] = useState<"appointments" | "receivables" | "birthdays">(
    "appointments",
  );
  const appointments = business.appointments || [];
  const checkouts = business.checkouts || [];
  const receivables = business.promotions?.receivables || [];
  const openReceivables = receivables.filter(
    (item) => Math.max(0, item.amount - item.paidAmount) > 0,
  );
  const upcomingBirthdays = useMemo(
    () => getUpcomingBirthdays(business.customers || []),
    [business.customers],
  );

  async function markReceivableReminder(id: string) {
    await onUpdateAndSave({
      promotions: {
        ...(business.promotions || {}),
        receivables: receivables.map((item) =>
          item.id === id
            ? {
                ...item,
                status: "Hatırlatıldı",
                reminderSentAt: new Date().toISOString(),
              }
            : item,
        ),
      },
    });
  }

  return (
    <div className="space-y-4">
      <Breadcrumb items={["Aloyz", "Özet"]} />
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Bugünkü randevu" value={appointments.length + checkouts.length} />
        <Metric
          label="Kişi sayısı"
          value={(business.customers || []).length + contacts.length}
        />
        <Metric
          label="Mesaj kanalı"
          value={business.instagram_page_id ? "2" : "1"}
        />
        <Metric
          label="Bot durumu"
          value={business.is_active ? "Aktif" : "Pasif"}
        />
      </div>
      <section className="rounded bg-white p-4 shadow-sm">
        <div className="flex border-b border-slate-200 text-sm">
          <button
            type="button"
            onClick={() => setTab("appointments")}
            className={`px-4 py-2 ${
              tab === "appointments"
                ? "border border-b-0 border-slate-200 bg-white font-medium"
                : "text-slate-600"
            }`}
          >
            Açık randevular
          </button>
          <button
            type="button"
            onClick={() => setTab("receivables")}
            className={`px-4 py-2 ${
              tab === "receivables"
                ? "border border-b-0 border-slate-200 bg-white font-medium"
                : "text-slate-600"
            }`}
          >
            Alacak hatırlatmaları
          </button>
          <button
            type="button"
            onClick={() => setTab("birthdays")}
            className={`px-4 py-2 ${
              tab === "birthdays"
                ? "border border-b-0 border-slate-200 bg-white font-medium"
                : "text-slate-600"
            }`}
          >
            Yaklaşan doğum günleri
          </button>
        </div>
        <div className="overflow-x-auto pt-4">
          {tab === "appointments" && (
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-y border-slate-200 text-slate-900">
                <tr>
                  <th className="px-3 py-3">Tarih</th>
                  <th className="px-3 py-3">Müşteri</th>
                  <th className="px-3 py-3">Kaynak</th>
                  <th className="px-3 py-3">Hizmetler</th>
                  <th className="px-3 py-3">Toplam tutar</th>
                </tr>
              </thead>
              <tbody>
                {appointments.slice(0, 6).map((appointment) => (
                  <tr key={appointment.id} className="border-b border-slate-100">
                    <td className="px-3 py-3">
                      {appointment.date} {appointment.time}
                    </td>
                    <td className="px-3 py-3 font-medium">
                      {appointment.customerName}
                    </td>
                    <td className="px-3 py-3 text-slate-500">Bot</td>
                    <td className="px-3 py-3 text-slate-600">
                      {appointment.description || "-"}
                    </td>
                    <td className="px-3 py-3 text-slate-500">-</td>
                  </tr>
                ))}
                {checkouts.slice(0, 6).map((checkout) => (
                  <tr key={checkout.id} className="border-b border-slate-100">
                    <td className="px-3 py-3">
                      {checkout.date} {checkout.hour}:{checkout.minute}
                    </td>
                    <td className="px-3 py-3 font-medium">
                      {checkout.customerName}
                    </td>
                    <td className="px-3 py-3 text-slate-500">Adisyon</td>
                    <td className="px-3 py-3 text-slate-600">
                      {checkout.notes || "-"}
                    </td>
                    <td className="px-3 py-3 text-slate-500">
                      {checkout.amount} TL
                    </td>
                  </tr>
                ))}
                {appointments.length === 0 && checkouts.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-10 text-center text-sm text-slate-400"
                    >
                      Henüz açık randevu yok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
          {tab === "receivables" && (
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-y border-slate-200 text-slate-900">
                <tr>
                  <th className="px-3 py-3">Tarih</th>
                  <th className="px-3 py-3">Müşteri</th>
                  <th className="px-3 py-3">Açıklama</th>
                  <th className="px-3 py-3">Kalan</th>
                  <th className="px-3 py-3">Durum</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {openReceivables.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="px-3 py-3">{formatInputDate(item.date)}</td>
                    <td className="px-3 py-3 font-medium">{item.personName}</td>
                    <td className="px-3 py-3 text-slate-600">
                      {item.description || "-"}
                    </td>
                    <td className="px-3 py-3">
                      {Math.max(0, item.amount - item.paidAmount)} TL
                    </td>
                    <td className="px-3 py-3">{item.status}</td>
                    <td className="px-3 py-3 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => markReceivableReminder(item.id)}
                      >
                        Hatırlatıldı
                      </Button>
                    </td>
                  </tr>
                ))}
                {openReceivables.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-10 text-center text-sm text-slate-400"
                    >
                      Hatırlatılacak açık alacak yok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
          {tab === "birthdays" && (
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-y border-slate-200 text-slate-900">
                <tr>
                  <th className="px-3 py-3">Müşteri</th>
                  <th className="px-3 py-3">Doğum günü</th>
                  <th className="px-3 py-3">Kalan gün</th>
                  <th className="px-3 py-3">İletişim</th>
                </tr>
              </thead>
              <tbody>
                {upcomingBirthdays.map((item) => (
                  <tr key={item.customer.id} className="border-b border-slate-100">
                    <td className="px-3 py-3 font-medium">
                      {item.customer.name}
                    </td>
                    <td className="px-3 py-3">{item.displayDate}</td>
                    <td className="px-3 py-3">{item.daysLeft}</td>
                    <td className="px-3 py-3 text-slate-600">
                      {item.customer.phone || item.customer.email || "-"}
                    </td>
                  </tr>
                ))}
                {upcomingBirthdays.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-10 text-center text-sm text-slate-400"
                    >
                      Önümüzdeki 30 gün içinde doğum günü yok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>
      <div className="grid gap-4 lg:grid-cols-2">
        <ActionPanel
          title="Kişiler"
          description="Tüm müşteri kayıtlarını telefon, kanal ve son görüşme bilgileriyle görüntüleyin."
          onClick={() => onSelectView("client/list")}
        />
        {canManageSetup && (
        <ActionPanel
          title="Kurulum"
          description="Temel bilgiler, çalışma saatleri ve entegrasyon ayarlarını düzenleyin."
          onClick={() => onSelectView("setup/general")}
        />
        )}
      </div>
    </div>
  );
}

function getUpcomingBirthdays(customers: CustomerProfile[]) {
  const today = new Date();
  const todayDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  return customers
    .map((customer) => {
      if (!customer.birthDate) return null;
      const source = new Date(`${customer.birthDate}T12:00:00`);
      if (Number.isNaN(source.getTime())) return null;
      let next = new Date(
        todayDate.getFullYear(),
        source.getMonth(),
        source.getDate(),
      );
      if (next < todayDate) {
        next = new Date(
          todayDate.getFullYear() + 1,
          source.getMonth(),
          source.getDate(),
        );
      }
      const daysLeft = Math.round(
        (next.getTime() - todayDate.getTime()) / 86_400_000,
      );
      if (daysLeft > 30) return null;
      return {
        customer,
        daysLeft,
        displayDate: new Intl.DateTimeFormat("tr-TR", {
          day: "numeric",
          month: "long",
        }).format(next),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a!.daysLeft - b!.daysLeft) as Array<{
    customer: CustomerProfile;
    daysLeft: number;
    displayDate: string;
  }>;
}
