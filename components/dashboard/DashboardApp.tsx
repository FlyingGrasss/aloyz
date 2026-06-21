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
    "theme" | "language" | "password" | "create" | "notifications" | null
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

  const filteredContacts = useMemo(() => {
    const term = searchTerm.trim().toLocaleLowerCase("tr-TR");
    if (!term) return contacts;
    return contacts.filter((contact) =>
      [
        contact.name,
        contact.subtitle,
        contact.phone,
        contact.username,
        contact.lastMessage,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLocaleLowerCase("tr-TR").includes(term),
        ),
    );
  }, [contacts, searchTerm]);

  const selectedContact =
    filteredContacts.find((contact) => contact.id === selectedContactId) ||
    filteredContacts[0] ||
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
          (instance: any) => getEvolutionInstanceName(instance) === business.slug,
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
        setSuccessMsg("QR kod yüklendi.");
      } else {
        setErrorMsg(data.error || "QR kod alınamadı.");
      }
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
    <div className="min-h-screen overflow-hidden bg-[#e9edf3] text-slate-800">
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
            onSearchChange={setSearchTerm}
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
                contacts={filteredContacts}
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
