"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { Sidebar, Topbar } from "./app/shell";
import { ContentRouter } from "./app/pages";
import { OnboardingPanel } from "./app/setup";
import {
  Business,
  ViewId,
  ConfirmDialog,
  StatusBanner,
  UtilityModal,
  DAYS,
  buildContacts,
  defaultBusiness,
  ensureCompleteHours,
  formatHourValue,
  getEvolutionInstanceName,
  getWhatsAppInstanceStatus,
  isSetupComplete,
  normalizeArray,
  normalizeHash,
  normalizeHoursObject,
  normalizeObject,
  normalizeView,
  parseHourValue,
} from "./app/shared";

export function DashboardApp() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const adminBusinessId = searchParams.get("businessId");
  const isAdminMode =
    (session?.user as any)?.role === "admin" && !!adminBusinessId;

  const [business, setBusiness] = useState<Business>(defaultBusiness);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [view, setView] = useState<ViewId>("dashboard");
  const [savedSetupComplete, setSavedSetupComplete] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openGroup, setOpenGroup] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [dashboardLanguage, setDashboardLanguage] = useState("tr");
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null,
  );
  const [selectedDate, setSelectedDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [openMenu, setOpenMenu] = useState<
    "date" | "create" | "settings" | "profile" | null
  >(null);
  const [modal, setModal] = useState<
    "theme" | "language" | "password" | "notifications" | null
  >(null);
  const [applyHoursPrompt, setApplyHoursPrompt] = useState<{
    dayKey: string;
    value: string;
    field: "start" | "end";
  } | null>(null);
  const [whatsAppInstance, setWhatsAppInstance] = useState<any | null>(null);
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (
      status === "authenticated" &&
      (session.user as any).role === "admin" &&
      !adminBusinessId
    ) {
      router.push("/admin");
    }
  }, [adminBusinessId, router, session, status]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedTheme = localStorage.getItem("aloyz-theme");
    const storedLanguage = localStorage.getItem("aloyz-language") || "tr";
    if (storedTheme) {
      document.documentElement.classList.toggle("dark", storedTheme === "dark");
    }
    document.documentElement.lang = storedLanguage;
    document.documentElement.dataset.language = storedLanguage;
    setDashboardLanguage(storedLanguage);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (event: Event) => {
      const nextLanguage =
        event instanceof CustomEvent && typeof event.detail === "string"
          ? event.detail
          : localStorage.getItem("aloyz-language") || "tr";
      setDashboardLanguage(nextLanguage);
    };
    window.addEventListener("aloyz-language-change", handler);
    return () => window.removeEventListener("aloyz-language-change", handler);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const timer = window.setTimeout(
      () => translateDashboardDom(dashboardLanguage),
      0,
    );
    return () => window.clearTimeout(timer);
  }, [
    dashboardLanguage,
    view,
    business,
    successMsg,
    errorMsg,
    modal,
    openMenu,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncViewFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      setView(
        normalizeView(params.get("view")) ||
          normalizeHash(window.location.hash) ||
          "dashboard",
      );
    };
    syncViewFromUrl();
    window.addEventListener("popstate", syncViewFromUrl);
    return () => window.removeEventListener("popstate", syncViewFromUrl);
  }, []);

  useEffect(() => {
    if (
      status === "authenticated" &&
      !((session.user as any).role === "admin" && !adminBusinessId)
    ) {
      fetchBusiness();
    }
  }, [status, adminBusinessId]);

  const contacts = useMemo(
    () =>
      buildContacts(business.conversations || [], business.appointments || []),
    [business.conversations, business.appointments],
  );

  const selectedContact =
    contacts.find((contact) => contact.id === selectedContactId) ||
    contacts[0] ||
    null;
  const forcedSetup = !savedSetupComplete && !isAdminMode;

  async function fetchBusiness() {
    try {
      setLoading(true);
      const url = isAdminMode
        ? `/api/business?id=${encodeURIComponent(adminBusinessId!)}`
        : "/api/business";
      const res = await fetch(url);
      if (!res.ok) {
        setErrorMsg("İşletme bilgileri alınamadı.");
        return;
      }
      const data = await res.json();
      const nextBusiness = {
        ...defaultBusiness,
        ...data,
        email: data.email || session?.user?.email || "",
        hours: normalizeHoursObject(data.hours),
        faqs: Array.isArray(data.faqs) ? data.faqs : [],
        staff: normalizeArray(data.staff),
        services: normalizeArray(data.services),
        customers: normalizeArray(data.customers),
        checkouts: normalizeArray(data.checkouts),
        promotions: normalizeObject(data.promotions),
        bookingSettings: normalizeObject(data.bookingSettings),
        botSettings: normalizeObject(data.botSettings),
        conversations: Array.isArray(data.conversations)
          ? data.conversations
          : [],
        appointments: Array.isArray(data.appointments) ? data.appointments : [],
      };
      setBusiness(nextBusiness);
      setSavedSetupComplete(isSetupComplete(nextBusiness));
      if (!isAdminMode) fetchWhatsAppInstanceStatus();
    } catch {
      setErrorMsg("Sunucu hatası oluştu.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchWhatsAppInstanceStatus() {
    try {
      const res = await fetch("/api/instances/list");
      if (res.ok) {
        const data = await res.json();
        setWhatsAppInstance(
          Array.isArray(data.instances) ? data.instances[0] || null : null,
        );
      }
    } catch {
      setWhatsAppInstance(null);
    }
  }

  async function saveBusiness(nextBusiness = business) {
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      const normalizedBusiness = {
        ...nextBusiness,
        hours: ensureCompleteHours(nextBusiness.hours),
      };
      const payload = {
        ...normalizedBusiness,
        conversations: undefined,
        appointments: undefined,
      };
      const res = isAdminMode
        ? await fetch("/api/admin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ businessId: adminBusinessId, ...payload }),
          })
        : await fetch("/api/business", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Kaydetme sırasında hata oluştu.");
        return false;
      }
      setBusiness((prev) => ({
        ...prev,
        ...data,
        email: data.email || normalizedBusiness.email || "",
        hours: normalizeHoursObject(data.hours || normalizedBusiness.hours),
        faqs: Array.isArray(data.faqs) ? data.faqs : normalizedBusiness.faqs,
        staff: normalizeArray(data.staff || normalizedBusiness.staff),
        services: normalizeArray(data.services || normalizedBusiness.services),
        customers: normalizeArray(
          data.customers || normalizedBusiness.customers,
        ),
        checkouts: normalizeArray(
          data.checkouts || normalizedBusiness.checkouts,
        ),
        promotions: normalizeObject(
          data.promotions || normalizedBusiness.promotions,
        ),
        bookingSettings: normalizeObject(
          data.bookingSettings || normalizedBusiness.bookingSettings,
        ),
        botSettings: normalizeObject(
          data.botSettings || normalizedBusiness.botSettings,
        ),
        conversations: prev.conversations,
        appointments: prev.appointments,
      }));
      setSavedSetupComplete(isSetupComplete(normalizedBusiness));
      setSuccessMsg("Değişiklikler kaydedildi.");
      return true;
    } catch {
      setErrorMsg("Sunucu hatası oluştu.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function togglePatch(field: "is_active" | "test_mode", value: boolean) {
    setSaving(true);
    try {
      const res = isAdminMode
        ? await fetch("/api/admin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              businessId: adminBusinessId,
              [field]: value,
            }),
          })
        : await fetch("/api/business", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ [field]: value }),
          });

      if (res.ok) {
        setBusiness((prev) => ({ ...prev, [field]: value }));
        setSuccessMsg("Durum güncellendi.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function reconnectWhatsApp() {
    if (!business.slug || !business.id) return;
    setSaving(true);
    setQrCodeBase64(null);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const listRes = await fetch("/api/instances/list");
      const listData = listRes.ok ? await listRes.json() : null;
      const existingInstance =
        Array.isArray(listData?.instances) &&
        listData.instances.some(
          (instance: any) =>
            getEvolutionInstanceName(instance) === business.slug,
        );

      if (!existingInstance) {
        const createRes = await fetch("/api/instances/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug: business.slug,
            businessId: business.id,
          }),
        });
        if (!createRes.ok) {
          const createData = await createRes.json();
          setErrorMsg(createData.error || "WhatsApp oturumu oluşturulamadı.");
          return;
        }
      }

      const res = await fetch(
        `/api/instances/qr?slug=${encodeURIComponent(business.slug)}`,
      );
      const data = await res.json();
      if (res.ok && data.qrBase64) {
        setQrCodeBase64(data.qrBase64);
        await updateAndSave({
          botSettings: {
            ...(business.botSettings || {}),
            whatsappConnected: true,
            whatsapp: true,
          },
        });
        setSuccessMsg("QR kod yüklendi.");
      } else {
        setErrorMsg(data.error || "QR kod alınamadı.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function disconnectWhatsApp() {
    if (!business.slug) return;
    setSaving(true);
    setQrCodeBase64(null);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch(
        `/api/instances/delete?slug=${encodeURIComponent(business.slug)}`,
        { method: "DELETE" },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(data.error || "WhatsApp bağlantısı kesilemedi.");
        return;
      }
      const nextBotSettings = {
        ...(business.botSettings || {}),
        whatsapp: false,
        whatsappConnected: false,
      };
      await updateAndSave({
        is_active: false,
        botSettings: nextBotSettings,
      });
      setWhatsAppInstance(null);
      setSuccessMsg("WhatsApp bağlantısı kesildi.");
    } finally {
      setSaving(false);
    }
  }

  function selectView(nextView: ViewId) {
    setView(nextView);
    setOpenMenu(null);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("view", nextView);
      if (adminBusinessId) params.set("businessId", adminBusinessId);
      window.history.pushState(null, "", `/dashboard?${params.toString()}`);
    }
  }

  function goBack() {
    if (typeof window !== "undefined") {
      window.history.back();
      return;
    }
    router.back();
  }

  function updateBusiness<K extends keyof Business>(
    field: K,
    value: Business[K],
  ) {
    setBusiness((prev) => ({ ...prev, [field]: value }));
  }

  async function updateAndSave(fields: Partial<Business>) {
    const nextBusiness = { ...business, ...fields };
    setBusiness(nextBusiness);
    return saveBusiness(nextBusiness);
  }

  function updateHour(dayKey: string, value: string, field: "start" | "end") {
    setBusiness((prev) => ({
      ...prev,
      hours: { ...prev.hours, [dayKey]: value },
    }));
    if (
      field &&
      DAYS.findIndex((day) => day.key === dayKey) < DAYS.length - 1
    ) {
      setApplyHoursPrompt({ dayKey, value, field });
    }
  }

  function applyHoursToRemainingDays() {
    if (!applyHoursPrompt) return;
    const changedIndex = DAYS.findIndex(
      (day) => day.key === applyHoursPrompt.dayKey,
    );
    setBusiness((prev) => {
      const hours = { ...prev.hours };
      for (const day of DAYS.slice(changedIndex + 1)) {
        const parsed = parseHourValue(hours[day.key]);
        const next = {
          ...parsed,
          [applyHoursPrompt.field]:
            applyHoursPrompt.field === "start"
              ? parseHourValue(applyHoursPrompt.value).start
              : parseHourValue(applyHoursPrompt.value).end,
        };
        hours[day.key] = formatHourValue(next.status, next.start, next.end);
      }
      return { ...prev, hours };
    });
    setApplyHoursPrompt(null);
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#e9edf3] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-sm font-semibold text-slate-600">
          <div className="size-8 rounded-full border-4 border-[#5f86b6] border-t-transparent animate-spin" />
          Yükleniyor...
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-app min-h-screen overflow-hidden bg-[#e9edf3] text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex min-h-screen">
        {!forcedSetup && (
          <Sidebar
            activeView={view}
            collapsed={sidebarCollapsed}
            groupsOpen={openGroup}
            onToggleCollapsed={() => setSidebarCollapsed((value) => !value)}
            onToggleGroup={(key) =>
              setOpenGroup((prev) => ({ ...prev, [key]: !prev[key] }))
            }
            onSelect={selectView}
          />
        )}

        <div className="min-w-0 flex-1 flex flex-col">
          <Topbar
            business={business}
            selectedDate={selectedDate}
            searchTerm={searchTerm}
            userName={session?.user?.name || business.slug || "Kullanıcı"}
            userEmail={session?.user?.email || business.email || ""}
            userImage={session?.user?.image || undefined}
            openMenu={openMenu}
            onOpenMenu={setOpenMenu}
            onBack={goBack}
            onDateChange={setSelectedDate}
            onSearchChange={(value) => {
              setSearchTerm(value);
              if (value.trim() && view !== "client/list") {
                selectView("client/list");
              }
            }}
            onSelectView={selectView}
            onOpenModal={setModal}
          />

          <main className="min-h-0 flex-1 overflow-auto px-4 py-4 md:px-6">
            {isAdminMode && (
              <StatusBanner tone="warning">
                {business.name || "İşletme"} profilini yönetici olarak
                düzenliyorsunuz.
              </StatusBanner>
            )}
            {successMsg && (
              <StatusBanner tone="success">{successMsg}</StatusBanner>
            )}
            {errorMsg && <StatusBanner tone="error">{errorMsg}</StatusBanner>}

            {forcedSetup ? (
              <OnboardingPanel
                business={business}
                saving={saving}
                onChange={updateBusiness}
                onHourChange={updateHour}
                onSave={() => saveBusiness()}
              />
            ) : (
              <ContentRouter
                view={view}
                business={business}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                contacts={contacts}
                selectedContact={selectedContact}
                searchTerm={searchTerm}
                saving={saving}
                whatsAppStatus={getWhatsAppInstanceStatus(whatsAppInstance)}
                qrCodeBase64={qrCodeBase64}
                onChange={updateBusiness}
                onHourChange={updateHour}
                onSave={() => saveBusiness()}
                onUpdateAndSave={updateAndSave}
                onSelectView={selectView}
                onSelectContact={setSelectedContactId}
                onTogglePatch={togglePatch}
                onReconnectWhatsApp={reconnectWhatsApp}
                onDisconnectWhatsApp={disconnectWhatsApp}
              />
            )}
          </main>
        </div>
      </div>

      {applyHoursPrompt && (
        <ConfirmDialog
          title="Saatleri uygula"
          description="Bu değişikliği sonraki günlere de uygulamak ister misiniz?"
          confirmLabel="Uygula"
          cancelLabel="Sadece bu gün"
          onConfirm={applyHoursToRemainingDays}
          onCancel={() => setApplyHoursPrompt(null)}
        />
      )}

      {modal && (
        <UtilityModal
          type={modal}
          onClose={() => setModal(null)}
          onLogout={() => signOut({ callbackUrl: "/" })}
        />
      )}
    </div>
  );
}

const dashboardTranslations: Record<string, string> = {
  Özet: "Overview",
  "Randevu takvimi": "Appointment calendar",
  Randevular: "Appointments",
  Adisyonlar: "Checkouts",
  Müşteriler: "Customers",
  "Ürün satışları": "Product sales",
  "Paket satışları": "Package sales",
  Raporlar: "Reports",
  "Kasa raporu": "Cashier report",
  "Personel raporu": "Staff report",
  "Satış raporu": "Sales report",
  Mesajlaşma: "Messaging",
  WhatsApp: "WhatsApp",
  Instagram: "Instagram",
  "Otomatik Mesajlar": "Automatic messages",
  "WP Kurulumu": "WhatsApp setup",
  "IG Kurulumu": "Instagram setup",
  "Hatırlatma Yanıtları": "Reminder replies",
  Mesajlar: "Messages",
  Diğer: "Other",
  "Randevu Komisyonları": "Appointment commissions",
  Yorumlar: "Reviews",
  "Arama kayıtları": "Call logs",
  Masraflar: "Expenses",
  Tahsilatlar: "Collections",
  Alacaklar: "Receivables",
  Borçlar: "Debts",
  Üyelik: "Subscription",
  Faturalar: "Invoices",
  Kurulum: "Setup",
  Bilgileri: "Information",
  "Çalışma saatleri": "Working hours",
  "Dönemsel çalışma saatleri": "Special working hours",
  Personeller: "Staff",
  Hizmetler: "Services",
  "Hizmet süreleri": "Service durations",
  "Hizmet fiyatları": "Service prices",
  Ürünler: "Products",
  Paketler: "Packages",
  "Randevu ayarları": "Appointment settings",
  "Etiket ayarları": "Tag settings",
  "Salon BOT Ayarları": "Salon bot settings",
  "Bağlantılar / Entegrasyonlar": "Connections / Integrations",
  Yeni: "New",
  Kaydet: "Save",
  "Kaydediliyor...": "Saving...",
  Düzenle: "Edit",
  Sil: "Delete",
  Detay: "Details",
  Geri: "Back",
  Bugün: "Today",
  Tümü: "All",
  "Tüm personel": "All staff",
  Müşteri: "Customer",
  Telefon: "Phone",
  "E-posta": "Email",
  Notlar: "Notes",
  Tarih: "Date",
  Saat: "Time",
  Durum: "Status",
  Tutar: "Amount",
  "Toplam tutar": "Total amount",
  "Ödenen tutar": "Paid amount",
  "Kalan ödeme": "Remaining payment",
  "Filtrele / Sırala": "Filter / Sort",
  İndir: "Download",
  "İçe aktar": "Import",
  "Bağlantıyı Kes": "Disconnect",
  "Giriş yap": "Sign in",
  "Test modu": "Test mode",
  Aktif: "Active",
  Pasif: "Passive",
  Açık: "Open",
  Kapalı: "Closed",
  "Kayıt bulunamadı": "No records found",
  "Bildirim yok": "No notifications",
  "Yeni bildirimler burada görünecek.": "New notifications will appear here.",
  "Tema ayarları": "Theme settings",
  "Dil değiştir": "Change language",
  "Şifre değiştir": "Change password",
  Çıkış: "Sign out",
  Türkçe: "Turkish",
  "Koyu tema": "Dark theme",
  "Açık tema": "Light theme",
  "Müşteri ara...": "Search customers...",
};

function translateDashboardDom(language: string) {
  if (typeof document === "undefined") return;
  const root = document.querySelector(".dashboard-app");
  if (!root) return;
  const textNodes: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    textNodes.push(node as Text);
    node = walker.nextNode();
  }
  for (const textNode of textNodes) {
    const original = ((textNode as any).__aloyzSourceText ||
      textNode.nodeValue ||
      "") as string;
    if (!(textNode as any).__aloyzSourceText) {
      (textNode as any).__aloyzSourceText = original;
    }
    if (language === "en") {
      const trimmed = original.trim();
      const translated = dashboardTranslations[trimmed];
      if (translated) {
        textNode.nodeValue = original.replace(trimmed, translated);
      }
    } else {
      textNode.nodeValue = original;
    }
  }
  const elements = root.querySelectorAll<HTMLElement>(
    "[placeholder], [title], [aria-label]",
  );
  for (const element of elements) {
    for (const attr of ["placeholder", "title", "aria-label"]) {
      const current = element.getAttribute(attr);
      if (!current) continue;
      const sourceAttr = `data-i18n-source-${attr.replace(/[^a-z]/g, "-")}`;
      const source = element.getAttribute(sourceAttr) || current;
      element.setAttribute(sourceAttr, source);
      element.setAttribute(
        attr,
        language === "en" ? dashboardTranslations[source] || source : source,
      );
    }
  }
}
