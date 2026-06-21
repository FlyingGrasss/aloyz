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

export function OverviewPage({
  business,
  contacts,
  onSelectView,
}: {
  business: Business;
  contacts: ContactRow[];
  onSelectView: (view: ViewId) => void;
}) {
  const appointments = business.appointments || [];
  return (
    <div className="space-y-4">
      <Breadcrumb items={["Aloyz", "Özet"]} />
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Bugünkü randevu" value={appointments.length} />
        <Metric label="Kişi sayısı" value={contacts.length} />
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
          <button className="border border-b-0 border-slate-200 bg-white px-4 py-2 font-medium">
            Açık randevular
          </button>
          <button className="px-4 py-2 text-slate-600">
            Alacak hatırlatmaları
          </button>
          <button className="px-4 py-2 text-slate-600">
            Yaklaşan doğum günleri
          </button>
        </div>
        <div className="overflow-x-auto pt-4">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-y border-slate-200 text-slate-900">
              <tr>
                <th className="px-3 py-3">Tarih</th>
                <th className="px-3 py-3">Müşteri</th>
                <th className="px-3 py-3">Hizmetler</th>
                <th className="px-3 py-3">Ürünler</th>
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
                  <td className="px-3 py-3 text-slate-600">
                    {appointment.description || "-"}
                  </td>
                  <td className="px-3 py-3 text-slate-500">-</td>
                  <td className="px-3 py-3 text-slate-500">-</td>
                </tr>
              ))}
              {appointments.length === 0 && (
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
        </div>
      </section>
      <div className="grid gap-4 lg:grid-cols-2">
        <ActionPanel
          title="Kişiler"
          description="Tüm müşteri kayıtlarını telefon, kanal ve son görüşme bilgileriyle görüntüleyin."
          onClick={() => onSelectView("client/list")}
        />
        <ActionPanel
          title="Kurulum"
          description="Temel bilgiler, çalışma saatleri ve entegrasyon ayarlarını düzenleyin."
          onClick={() => onSelectView("setup/general")}
        />
      </div>
    </div>
  );
}
