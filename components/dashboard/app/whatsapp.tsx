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
  contacts,
  onSelectView,
}: {
  contacts: ContactRow[];
  onSelectView: (view: ViewId) => void;
}) {
  const [customerQuery, setCustomerQuery] = useState("");
  const [period, setPeriod] = useState("Bu ay");
  const [status, setStatus] = useState("Tümü");
  const whatsappContacts = contacts.filter((contact) => contact.channel !== "instagram");
  const rows = whatsappContacts.flatMap((contact) =>
    getConversationMessages(contact.conversation).map((message, index) => ({
      id: `${contact.id}-${index}`,
      customer: contact.name,
      phone: contact.phone,
      status: message.role === "model" ? "Gönderildi" : "Okundu",
      date: contact.updatedAt.slice(0, 10),
      sentAt: message.role === "model" ? contact.updatedAt : "-",
      deliveredAt: message.role === "model" ? contact.updatedAt : "-",
      readAt: contact.updatedAt,
      errorCode: "-",
      error: "-",
    })),
  );
  const filteredRows = rows.filter((row) => {
    const query = customerQuery.trim().toLocaleLowerCase("tr-TR");
    const matchesCustomer =
      !query || row.customer.toLocaleLowerCase("tr-TR").startsWith(query);
    const matchesStatus = status === "Tümü" || row.status === status;
    const matchesPeriod = period === "Tümü" || isInPeriod(row.date, period);
    return matchesCustomer && matchesStatus && matchesPeriod;
  });
  const counts = {
    Tümü: filteredRows.length,
    Gönderildi: filteredRows.filter((row) => row.status === "Gönderildi").length,
    İletildi: 0,
    Okundu: filteredRows.filter((row) => row.status === "Okundu").length,
    Başarısız: 0,
  };
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
          <Button
            type="button"
            className="bg-[#24a647] text-white"
            onClick={() => onSelectView("setup/salon-bot-settings")}
          >
            <Pencil className="size-4" />
            Otomatik Mesajları Düzenle
          </Button>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-[280px_1fr_280px]">
          <label className="grid gap-1 text-xs text-slate-600">
            Müşteri
            <Input
              value={customerQuery}
              onChange={(event) => setCustomerQuery(event.target.value)}
              placeholder="Tümü"
            />
          </label>
          <div />
          <label className="grid gap-1 text-xs text-slate-600">
            Tarih Aralığı
            <NativeSelect
              value={period}
              onChange={setPeriod}
              options={["Bu ay", "Bugün", "Tümü"].map((value) => ({
                value,
                label: value,
              }))}
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {(["Tümü", "Gönderildi", "İletildi", "Okundu", "Başarısız"] as const).map(
            (label) => (
              <button
                key={label}
                type="button"
                onClick={() => setStatus(label)}
                className={`rounded-full border px-3 py-1 ${
                  status === label
                    ? "border-slate-700 bg-slate-100"
                    : "border-slate-300"
                }`}
              >
                {label} <b>{counts[label]}</b>
              </button>
            ),
          )}
        </div>
        <MessageTable
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
          rows={filteredRows.map((row) => [
            row.customer,
            row.phone || "-",
            row.status,
            row.date,
            row.sentAt,
            row.deliveredAt,
            row.readAt,
            row.errorCode,
            row.error,
          ])}
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
      <h1 className="text-2xl font-semibold text-slate-700">
        WhatsApp Kurulumu
      </h1>
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
            WhatsApp Kurulumu
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
  contacts,
  onSelectView,
}: {
  contacts: ContactRow[];
  onSelectView: (view: ViewId) => void;
}) {
  const replyRows = contacts
    .filter((contact) => contact.channel !== "instagram")
    .filter((contact) => getConversationMessages(contact.conversation).some((message) => message.role === "user"))
    .map((contact) => [contact.name, contact.phone || "-"]);
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
          <span className="text-xs text-slate-500">
            Toplam Yanıt Sayısı: {replyRows.length}
          </span>
        </div>
        <div className="mt-6 rounded border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Bu sayfa, gönderilen hatırlatma mesajlarına müşterilerinizin WhatsApp
          üzerinden gönderdiği yanıtları listeler.
        </div>
        <MessageTable columns={["Müşteri", "Telefon numarası"]} rows={replyRows} />
      </section>
    </div>
  );
}

function MessageTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: Array<Array<string | number>>;
}) {
  const [page, setPage] = useState(0);
  const [sortDesc, setSortDesc] = useState(true);
  const pageSize = 50;
  const sortedRows = [...rows].sort((a, b) => {
    const left = String(a[0] || "");
    const right = String(b[0] || "");
    return sortDesc ? right.localeCompare(left, "tr") : left.localeCompare(right, "tr");
  });
  const pageRows = sortedRows.slice(page * pageSize, page * pageSize + pageSize);
  const maxPage = Math.max(0, Math.ceil(rows.length / pageSize) - 1);
  return (
    <div className="mt-6">
      <div className="bg-slate-100 p-3">
        <Button
          type="button"
          className="bg-[#5f86b6] text-white"
          onClick={() => setSortDesc((value) => !value)}
        >
          {sortDesc ? "Z → A" : "A → Z"}
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
          {pageRows.map((row, index) => (
            <tr key={index} className="border-b border-slate-100">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-3 py-3">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
          {pageRows.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="py-12 text-center text-slate-500"
              >
                Kayıt bulunamadı
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="mt-3 flex justify-center gap-1 text-sm text-slate-500">
        <Button type="button" variant="outline" size="icon-sm" onClick={() => setPage(0)} disabled={page === 0}>
          ‹‹
        </Button>
        <Button type="button" variant="outline" size="icon-sm" onClick={() => setPage((value) => Math.max(0, value - 1))} disabled={page === 0}>
          ‹
        </Button>
        <Button type="button" variant="outline" size="icon-sm" onClick={() => setPage((value) => Math.min(maxPage, value + 1))} disabled={page >= maxPage}>
          ›
        </Button>
        <Button type="button" variant="outline" size="icon-sm" onClick={() => setPage(maxPage)} disabled={page >= maxPage}>
          ››
        </Button>
      </div>
    </div>
  );
}

function isInPeriod(date: string, period: string) {
  const today = new Date().toISOString().slice(0, 10);
  if (period === "Bugün") return date === today;
  if (period === "Bu ay") return date.startsWith(today.slice(0, 7));
  return true;
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
