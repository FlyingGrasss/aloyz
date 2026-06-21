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

export function AutomaticMessagesPage({
  onSelectView,
}: {
  onSelectView: (view: ViewId) => void;
}) {
  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          { label: "Aloyz", view: "dashboard" },
          {
            label: "Otomatik Mesajlar",
            view: "messaging/whatsapp/sent-reminders",
          },
        ]}
        onSelectView={onSelectView}
      />
      <section className="rounded bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between">
          <h1 className="text-2xl font-semibold text-slate-700">
            Otomatik Mesajlar
          </h1>
          <Button type="button" className="bg-[#24a647] text-white">
            <Pencil className="size-4" />
            Otomatik Mesajları Düzenle
          </Button>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-[280px_1fr_280px]">
          <label className="grid gap-1 text-xs text-slate-600">
            Müşteri
            <Input value="Tümü" readOnly />
          </label>
          <div />
          <label className="grid gap-1 text-xs text-slate-600">
            Tarih Aralığı
            <NativeSelect
              value="Bu ay"
              onChange={() => undefined}
              options={[{ value: "Bu ay", label: "Bu ay" }]}
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {["Tümü", "Gönderildi", "İletildi", "Okundu", "Başarısız"].map(
            (label) => (
              <span
                key={label}
                className="rounded-full border border-slate-300 px-3 py-1"
              >
                {label} <b>0</b>
              </span>
            ),
          )}
        </div>
        <MessageEmptyTable
          columns={[
            "Müşteri",
            "Telefon numarası",
            "Durum",
            "Tarih",
            "Gönderim tarihi",
            "Teslim tarihi",
            "Okunma tarihi",
            "Hata kodu",
            "Hata",
          ]}
        />
      </section>
    </div>
  );
}

export function WhatsappRegisterPage({
  whatsAppStatus,
  qrCodeBase64,
  saving,
  onReconnectWhatsApp,
}: {
  whatsAppStatus: string | null;
  qrCodeBase64: string | null;
  saving: boolean;
  onReconnectWhatsApp: () => void;
}) {
  const connected = whatsAppStatus === "open" || whatsAppStatus === "connected";
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-700">İşletme Kaydı</h1>
      <section className="rounded bg-white p-4 shadow-sm">
        <div className="grid grid-cols-3 border-b border-slate-200 pb-3 text-center text-xs text-slate-500">
          <div>
            1<br />
            Başvur
          </div>
          <div>
            2<br />
            Başvuru Durumu
          </div>
          <div className="font-semibold text-slate-900">
            3<br />
            WhatsApp Kaydı
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <div className="divide-y divide-slate-100 rounded border border-slate-100">
              {[
                "Evolution API instance oluştur",
                "QR kodu üret",
                "Telefonunuzla QR kodu okutun",
                "WhatsApp kullanmaya başlayın",
              ].map((title, index) => (
                <div key={title} className="flex items-center gap-4 p-4">
                  <span className="grid size-9 place-items-center rounded-full bg-[#24a647] font-bold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <div className="font-semibold">{title}</div>
                    <p className="text-sm text-slate-500">
                      Bağlantı adımı otomatik olarak tamamlanır.
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Button
              type="button"
              disabled={saving || connected}
              onClick={onReconnectWhatsApp}
              className="mt-5 bg-[#2563eb] text-white"
            >
              {connected ? "WhatsApp bağlı" : "QR'ı getir"}
            </Button>
          </div>
          <aside className="rounded border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 text-sm font-semibold text-slate-700">
              WhatsApp QR
            </div>
            {qrCodeBase64 ? (
              <img
                src={
                  qrCodeBase64.startsWith("data:")
                    ? qrCodeBase64
                    : `data:image/png;base64,${qrCodeBase64}`
                }
                alt="WhatsApp QR kodu"
                className="mx-auto size-72"
              />
            ) : (
              <div className="grid aspect-square place-items-center rounded border border-dashed border-slate-300 bg-white text-center text-sm text-slate-400">
                QR kod burada görünecek.
              </div>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}

export function ReminderRepliesPage({
  onSelectView,
}: {
  onSelectView: (view: ViewId) => void;
}) {
  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          { label: "Aloyz", view: "dashboard" },
          {
            label: "Hatırlatma Yanıtları",
            view: "messaging/whatsapp/reminder-messages",
          },
        ]}
        onSelectView={onSelectView}
      />
      <section className="rounded bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-700">
            Hatırlatma Yanıtları
          </h1>
          <span className="text-xs text-slate-500">Toplam Yanıt Sayısı: 0</span>
        </div>
        <div className="mt-6 rounded border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Bu sayfa, gönderilen hatırlatma mesajlarına müşterilerinizin WhatsApp
          üzerinden gönderdiği yanıtları listeler.
        </div>
        <MessageEmptyTable columns={["Müşteri", "Telefon numarası"]} />
      </section>
    </div>
  );
}

function MessageEmptyTable({ columns }: { columns: string[] }) {
  return (
    <div className="mt-6">
      <div className="bg-slate-100 p-3">
        <Button type="button" className="bg-[#5f86b6] text-white">
          Filtrele / Sırala
        </Button>
      </div>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            {columns.map((column) => (
              <th key={column} className="px-3 py-3 font-medium">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td
              colSpan={columns.length}
              className="py-12 text-center text-slate-500"
            >
              Kayıt bulunamadı
            </td>
          </tr>
        </tbody>
      </table>
      <div className="mt-3 flex justify-center gap-1 text-sm text-slate-500">
        <Button type="button" variant="outline" size="icon-sm">
          ‹‹
        </Button>
        <Button type="button" variant="outline" size="icon-sm">
          ‹
        </Button>
        <Button type="button" variant="outline" size="icon-sm">
          ›
        </Button>
        <Button type="button" variant="outline" size="icon-sm">
          ››
        </Button>
      </div>
    </div>
  );
}

export function MessagingPage({
  view,
  business,
  contacts,
  selectedContact,
  onSelectContact,
}: {
  view: ViewId;
  business: Business;
  contacts: ContactRow[];
  selectedContact: ContactRow | null;
  onSelectContact: (id: string) => void;
}) {
  const isInstagram = view.startsWith("messaging/instagram");
  const channelContacts = contacts.filter((contact) =>
    isInstagram
      ? contact.channel === "instagram"
      : contact.channel !== "instagram",
  );
  const active =
    channelContacts.find((contact) => contact.id === selectedContact?.id) ||
    channelContacts[0] ||
    null;
  const messages = active ? getConversationMessages(active.conversation) : [];

  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          "Aloyz",
          isInstagram ? "Instagram mesajları" : "Whatsapp mesajları",
        ]}
      />
      <div className="grid gap-4 lg:grid-cols-[330px_1fr]">
        <section className="rounded bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <h1 className="font-semibold">
              {isInstagram ? "Instagram" : "Whatsapp"}
            </h1>
            <p className="text-sm text-slate-500">
              {channelContacts.length} görüşme
            </p>
          </div>
          <div className="max-h-[620px] overflow-y-auto">
            {channelContacts.map((contact) => (
              <button
                key={contact.id}
                type="button"
                onClick={() => onSelectContact(contact.id)}
                className={`block w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50 ${active?.id === contact.id ? "bg-[#eef5e9]" : ""}`}
              >
                <div className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate font-semibold">
                    {contact.name}
                  </span>
                  <ChannelBadge channel={contact.channel} />
                </div>
                <div className="mt-1 truncate text-xs text-slate-500">
                  {contact.lastMessage || "Mesaj yok"}
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  Son güncelleme: {formatLastUpdate(contact.updatedAt)}
                </div>
              </button>
            ))}
            {channelContacts.length === 0 && (
              <EmptyState
                title="Görüşme yok"
                description="Bu kanalda henüz mesajlaşma bulunmuyor."
              />
            )}
          </div>
        </section>
        <section className="rounded bg-white shadow-sm">
          {active ? (
            <>
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <div>
                  <h2 className="font-semibold">{active.name || "Görüşme"}</h2>
                  <p className="text-sm text-slate-500">
                    {active.subtitle || business.name}
                  </p>
                </div>
              </div>
              <div className="h-[560px] overflow-y-auto bg-slate-900 px-4 py-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`mb-3 flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[76%] rounded px-3 py-2 text-sm leading-relaxed ${message.role === "user" ? "bg-[#5f86b6] text-white" : "bg-slate-800 text-slate-100"}`}
                    >
                      <div className="mb-1 text-[10px] font-semibold opacity-70">
                        {message.role === "user" ? "Müşteri" : "Asistan"}
                      </div>
                      <div className="whitespace-pre-wrap">{message.text}</div>
                    </div>
                  </div>
                ))}
                {messages.length === 0 && (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">
                    Mesaj içeriği bulunamadı.
                  </div>
                )}
              </div>
            </>
          ) : (
            <EmptyState
              title="Görüşme yok"
              description="Bu kanalda henüz mesajlaşma bulunmuyor."
            />
          )}
        </section>
      </div>
    </div>
  );
}
