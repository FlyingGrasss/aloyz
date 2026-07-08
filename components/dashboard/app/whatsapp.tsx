"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
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
  getEvolutionPhoneNumber,
  sanitizeStaffMember,
  contactToCustomerProfile,
  setupItems,
  TIME_OPTIONS,
  GOOGLE_SERVICE_ACCOUNT_EMAIL,
  WhatsAppBrandIcon,
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
  const [latestFirst, setLatestFirst] = useState(true);
  const rows = contacts
    .flatMap((contact) =>
      getConversationMessages(contact.conversation).map((message, index) => ({
        id: `${contact.id}-${index}`,
        customer: contact.name,
        phone: contact.phone,
        channel: contact.channel === "instagram" ? "Instagram" : "WhatsApp",
        status: message.role === "model" ? "Gönderildi" : "Okundu",
        date: contact.updatedAt.slice(0, 10),
        sentAt: message.role === "model" ? contact.updatedAt : "-",
        deliveredAt: message.role === "model" ? contact.updatedAt : "-",
        readAt: contact.updatedAt,
        errorCode: "-",
        error: "-",
      })),
    )
    .sort((left, right) => {
      const diff =
        new Date(right.readAt).getTime() - new Date(left.readAt).getTime();
      return latestFirst ? diff : -diff;
    });
  const baseRows = rows.filter((row) => {
    const query = customerQuery.trim().toLocaleLowerCase("tr-TR");
    const matchesCustomer =
      !query || row.customer.toLocaleLowerCase("tr-TR").startsWith(query);
    const matchesPeriod = period === "Tümü" || isInPeriod(row.date, period);
    return matchesCustomer && matchesPeriod;
  });
  const filteredRows = baseRows.filter(
    (row) => status === "Tümü" || row.status === status,
  );
  const counts = {
    Tümü: baseRows.length,
    Gönderildi: baseRows.filter((row) => row.status === "Gönderildi").length,
    İletildi: 0,
    Okundu: baseRows.filter((row) => row.status === "Okundu").length,
    Başarısız: 0,
  };
  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          { label: "Aloyz", view: "dashboard" },
          {
            label: "Tüm Mesajlar",
            view: "messaging/whatsapp/sent-reminders",
          },
        ]}
        onSelectView={onSelectView}
      />
      <section className="rounded bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between">
          <h1 className="text-2xl font-semibold text-slate-700">
            Tüm Mesajlar
          </h1>
          <Button
            type="button"
            className="bg-[#24a647] text-white"
            onClick={() => onSelectView("setup/salon-bot-settings")}
          >
            <Pencil className="size-4" />
            Bot Ayarlarına Git
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
          <label className="grid gap-1 text-xs text-slate-600">
            Sıralama
            <NativeSelect
              value={latestFirst ? "latest" : "oldest"}
              onChange={(value) => setLatestFirst(value === "latest")}
              options={[
                { value: "latest", label: "En yeni önce" },
                { value: "oldest", label: "En eski önce" },
              ]}
            />
          </label>
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
          {(
            ["Tümü", "Gönderildi", "İletildi", "Okundu", "Başarısız"] as const
          ).map((label) => (
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
          ))}
        </div>
        <MessageTable
          columns={[
            "Müşteri",
            "Kanal",
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
            row.channel,
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
  business,
  whatsAppStatus,
  qrLoading,
  qrCodeBase64,
  saving,
  onUpdateAndSave,
  onSelectView,
  onReconnectWhatsApp,
}: {
  business: Business;
  whatsAppStatus: string | null;
  qrLoading: boolean;
  qrCodeBase64: string | null;
  saving: boolean;
  onUpdateAndSave: (fields: Partial<Business>) => Promise<boolean>;
  onSelectView: (view: ViewId) => void;
  onReconnectWhatsApp: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [generalActive, setGeneralActive] = useState(!!business.is_active);
  const [whatsAppActive, setWhatsAppActive] = useState(
    !!business.botSettings?.whatsapp,
  );
  const [testMode, setTestMode] = useState(business.test_mode);
  const connected = whatsAppStatus === "open" || whatsAppStatus === "connected";
  const connecting = whatsAppStatus === "connecting";
  const waitingForScan = connecting && !qrCodeBase64;

  useEffect(() => {
    setGeneralActive(!!business.is_active);
    setWhatsAppActive(!!business.botSettings?.whatsapp);
    setTestMode(!!business.test_mode);
  }, [business.is_active, business.botSettings, business.test_mode]);

  async function saveChannelSettings(next: {
    active?: boolean;
    whatsapp?: boolean;
    testMode?: boolean;
  }) {
    const nextWhatsApp = next.whatsapp ?? whatsAppActive;
    const nextActive = next.active ?? (nextWhatsApp ? true : generalActive);
    const nextTestMode = next.testMode ?? testMode;
    setGeneralActive(nextActive);
    setWhatsAppActive(nextWhatsApp);
    setTestMode(nextTestMode);
    setBusy(true);
    try {
      await onUpdateAndSave({
        botSettings: {
          ...(business.botSettings || {}),
          whatsapp: nextWhatsApp,
          active: nextActive,
          whatsappConnected: connected,
        },
        test_mode: nextTestMode,
        is_active: nextActive,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          { label: "Aloyz", view: "dashboard" },
          { label: "WhatsApp", view: "messaging/whatsapp/register" },
          { label: "WP Kurulumu", view: "messaging/whatsapp/register" },
        ]}
        onSelectView={onSelectView}
      />
      <section className="rounded bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-700">
              WhatsApp Kurulumu
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              WhatsApp hesabınızı QR kod ile Aloyz'a bağlayın.
            </p>
          </div>
          <Button
            type="button"
            disabled={saving || busy || connected || qrLoading}
            onClick={onReconnectWhatsApp}
            className="bg-[#25D366] text-white hover:bg-[#1fb85a]"
          >
            {connected
              ? "WhatsApp bağlı"
              : qrLoading
                ? "QR kod hazırlanıyor"
                : waitingForScan
                  ? "QR Kodunu Yenile"
                : "QR Kodu Getir"}
          </Button>
        </div>

        <div className="my-5 grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="rounded border border-slate-200">
            {[
              "QR kodu WhatsApp > Bağlı Cihazlar ekranından okutun",
              "Bağlantı tamamlanınca bot mesajları yanıtlamaya başlar",
              "Mesajlarınızı WhatsApp > Mesajlar sayfasından takip edin",
            ].map((step, index) => (
              <div
                key={step}
                className="flex items-center gap-3 border-b border-slate-200 p-4 last:border-b-0"
              >
                <span className="grid size-8 place-items-center rounded-full bg-[#25D366] text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <span className="font-semibold text-slate-700">{step}</span>
              </div>
            ))}
          </div>

          <div className="rounded border border-slate-200 p-4">
            <div className="text-sm font-semibold text-slate-700">
              Bağlantı durumu
            </div>
            <div className="mt-4 flex items-center gap-3">
              <div className="grid size-12 place-items-center rounded-full bg-emerald-100 text-[#25D366]">
                <WhatsAppBrandIcon className="size-6" />
              </div>
              <div>
                <div className="font-semibold">
                  {connected
                    ? "WhatsApp bağlı"
                    : waitingForScan
                      ? "Bağlantı bekleniyor"
                      : qrLoading
                        ? "QR kod hazırlanıyor"
                      : "WhatsApp bağlı değil"}
                </div>
                <div className="text-xs text-slate-500">
                  {connected
                    ? "Mesajlar bot tarafından alınabilir."
                    : waitingForScan
                      ? "QR kod okutulmayı bekliyor."
                      : qrLoading
                        ? "QR kod hazırlanıyor."
                      : "QR kodu okutunca bağlantı tamamlanır."}
                </div>
              </div>
            </div>
            {qrCodeBase64 ? (
              <img
                src={
                  qrCodeBase64.startsWith("data:")
                    ? qrCodeBase64
                    : `data:image/png;base64,${qrCodeBase64}`
                }
                alt="WhatsApp QR kodu"
                className="mx-auto mt-4 size-72"
              />
            ) : qrLoading ? (
              <div className="mt-4 grid aspect-square place-items-center rounded border border-dashed border-slate-300 bg-slate-50 text-center text-sm text-slate-500">
                <div className="grid justify-items-center gap-3 px-6">
                  <LoaderCircle className="size-8 animate-spin text-[#25D366]" />
                  <div>
                    <div className="font-semibold text-slate-700">
                      QR kod hazırlanıyor
                    </div>
                    <div className="mt-1 text-xs">
                      Bu işlem bir dakika sürebilir.
                    </div>
                  </div>
                </div>
              </div>
            ) : waitingForScan ? (
              <div className="mt-4 grid aspect-square place-items-center rounded border border-dashed border-slate-300 bg-white text-center text-sm text-slate-500">
                <div className="grid justify-items-center gap-2 px-6">
                  <div className="font-semibold text-slate-700">
                    QR kod bekleniyor
                  </div>
                  <div className="text-xs">
                    Yeni QR kod almak için QR Kodunu Yenile düğmesine basın.
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 grid aspect-square place-items-center rounded border border-dashed border-slate-300 bg-white text-center text-sm text-slate-400">
                QR kod burada görünecek.
              </div>
            )}
            {connected && (
              <div className="mt-4 space-y-3">
                <StatusBanner tone="success">
                  WhatsApp bağlı! Mesajları almaya başlayabilirsiniz.
                </StatusBanner>
                <Button
                  type="button"
                  onClick={() => onSelectView("messaging/whatsapp/list")}
                  className="w-full bg-[#5f86b6] text-white"
                >
                  Mesajlara Git
                </Button>
              </div>
            )}
          </div>
        </div>
        <StatusBanner tone="warning">
          Test etmeden önce mesajların yüklenmesi için lütfen 3 dakikaya kadar
          bekleyin.
        </StatusBanner>

        <div className="mt-5 rounded border border-slate-200 p-3">
          <ToggleRow
            label="Bot Aktif"
            description="Kapalıyken WhatsApp ve Instagram botları otomatik yanıt vermez."
            checked={generalActive}
            onChange={(checked) => saveChannelSettings({ active: checked })}
          />
          <ToggleRow
            label="WhatsApp aktif"
            description="Kapalıyken bot gelen mesajlara otomatik yanıt vermez."
            checked={whatsAppActive}
            onChange={(checked) => saveChannelSettings({ whatsapp: checked })}
          />
          <ToggleRow
            label="Test modu"
            description="Açıkken bot yalnızca işletmenin kendi kendine gönderdiği mesajlara yanıt verir."
            checked={testMode}
            onChange={(checked) => saveChannelSettings({ testMode: checked })}
          />
        </div>
      </section>
    </div>
  );
}

export function WhatsappMessagesPage({
  whatsAppInstance,
  contacts,
}: {
  whatsAppInstance: unknown;
  contacts: ContactRow[];
}) {
  const whatsappContacts = contacts.filter(
    (contact) => contact.channel !== "instagram",
  );
  const [activeId, setActiveId] = useState<string | null>(
    whatsappContacts[0]?.id || null,
  );
  const active =
    whatsappContacts.find((contact) => contact.id === activeId) ||
    whatsappContacts[0] ||
    null;
  const messages = active ? getConversationMessages(active.conversation) : [];
  const account =
    getEvolutionPhoneNumber(whatsAppInstance) || "WhatsApp bağlı değil";

  return (
    <div className="min-h-[calc(100vh-96px)] rounded bg-white shadow-sm">
      <div className="grid min-h-[620px] md:grid-cols-[286px_1fr]">
        <aside className="border-r border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold">
              <WhatsAppBrandIcon className="size-5 text-[#25D366]" />
              WhatsApp <br />
              {account}
            </div>
            <Search className="size-5" />
          </div>
          <h2 className="mt-5 font-semibold">Mesajlar</h2>
          <div className="mt-6 space-y-1">
            {whatsappContacts.map((contact) => (
              <button
                key={contact.id}
                type="button"
                onClick={() => setActiveId(contact.id)}
                className={`block w-full rounded px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                  active?.id === contact.id ? "bg-[#eef8f1]" : ""
                }`}
              >
                <span className="block font-semibold">{contact.name}</span>
                <span className="block truncate text-xs text-slate-500">
                  {contact.lastMessage || "Mesaj yok"}
                </span>
              </button>
            ))}
            {whatsappContacts.length === 0 && (
              <div className="mt-10 text-center text-sm font-semibold text-slate-700">
                Sohbet bulunamadı
              </div>
            )}
          </div>
        </aside>
        <section className="flex min-h-0 flex-col">
          {active ? (
            <>
              <div className="border-b border-slate-200 px-4 py-3">
                <h2 className="font-semibold">{active.name}</h2>
                <p className="text-sm text-slate-500">
                  {active.phone || active.subtitle || account}
                </p>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto bg-slate-900 p-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`mb-3 flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[76%] rounded px-3 py-2 text-sm leading-relaxed ${
                        message.role === "user"
                          ? "bg-[#5f86b6] text-white"
                          : "bg-slate-800 text-slate-100"
                      }`}
                    >
                      <div className="mb-1 text-[10px] font-semibold opacity-70">
                        {message.role === "user" ? "Müşteri" : "Asistan"}
                      </div>
                      <div className="whitespace-pre-wrap">{message.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="grid flex-1 place-items-center">
              <div className="text-center">
                <WhatsAppBrandIcon className="mx-auto size-12 text-[#25D366]" />
                <h2 className="mt-3 font-semibold">Mesajlar</h2>
                <p className="mt-2 text-sm text-slate-500">
                  WhatsApp hesabınıza gelen mesajları Aloyz üzerinden yönetin
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
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
  const pageSize = 50;
  const pageRows = rows.slice(page * pageSize, page * pageSize + pageSize);
  const maxPage = Math.max(0, Math.ceil(rows.length / pageSize) - 1);
  return (
    <div className="mt-6">
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
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => setPage(0)}
          disabled={page === 0}
        >
          ‹‹
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => setPage((value) => Math.max(0, value - 1))}
          disabled={page === 0}
        >
          ‹
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => setPage((value) => Math.min(maxPage, value + 1))}
          disabled={page >= maxPage}
        >
          ›
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => setPage(maxPage)}
          disabled={page >= maxPage}
        >
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
