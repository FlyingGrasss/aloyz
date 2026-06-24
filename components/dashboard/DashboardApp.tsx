"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { hasDashboardAccess } from "@/lib/access";
import { Sidebar, Topbar } from "./app/shell";
import { ContentRouter } from "./app/pages";
import { OnboardingPanel } from "./app/setup";
import { CustomerModal } from "./app/customers";
import { CheckoutModal, syncCheckoutToGoogleCalendar } from "./app/checkouts";
import { ProductSaleModal, PackageSaleModal } from "./app/sales";
import {
  CommissionModal,
  ExpenseModal,
  LedgerModal,
  PaymentModal,
} from "./app/finance";
import {
  Business,
  ViewId,
  CheckoutItem,
  ConfirmDialog,
  CommissionItem,
  CustomerProfile,
  ExpenseItem,
  LedgerItem,
  PackageCatalogItem,
  PackageSaleItem,
  PaymentItem,
  ProductCatalogItem,
  ProductSaleItem,
  PromotionsSettings,
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

type QuickCreateAction =
  | "appointment"
  | "checkout"
  | "customer"
  | "product-sale"
  | "package-sale"
  | "expense"
  | "payment"
  | "receivable"
  | "debt"
  | "commission";

const ACCESS_ALLOWED_VIEWS = new Set<ViewId>(["subscription", "invoice/list"]);

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
  const [quickCreate, setQuickCreate] = useState<QuickCreateAction | null>(
    null,
  );
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
    quickCreate,
    openMenu,
  ]);

  useEffect(() => {
    if (!business.id) return;
    if (hasDashboardAccess(business.botSettings, business.createdAt)) return;
    if (ACCESS_ALLOWED_VIEWS.has(view)) return;
    selectView("subscription");
  }, [business, view]);

  useEffect(() => {
    if (!successMsg) return;
    const timer = window.setTimeout(() => setSuccessMsg(""), 1400);
    return () => window.clearTimeout(timer);
  }, [successMsg]);

  useEffect(() => {
    if (typeof window === "undefined" || dashboardLanguage !== "en") return;
    const root = document.querySelector(".dashboard-app");
    if (!root) return;
    let timer = 0;
    const observer = new MutationObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        observer.disconnect();
        translateDashboardDom("en");
        observer.observe(root, {
          childList: true,
          subtree: true,
          characterData: true,
          attributes: true,
          attributeFilter: ["placeholder", "title", "aria-label"],
        });
      }, 0);
    });
    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["placeholder", "title", "aria-label"],
    });
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [dashboardLanguage]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncViewFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const requestedView =
        normalizeView(params.get("view")) ||
        normalizeHash(window.location.hash) ||
        "dashboard";
      const targetView =
        business.id &&
        !hasDashboardAccess(business.botSettings, business.createdAt) &&
        !ACCESS_ALLOWED_VIEWS.has(requestedView)
          ? "subscription"
          : requestedView;
      setView(targetView);
    };
    syncViewFromUrl();
    window.addEventListener("popstate", syncViewFromUrl);
    return () => window.removeEventListener("popstate", syncViewFromUrl);
  }, [business.botSettings, business.createdAt, business.id]);

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
          setErrorMsg("WhatsApp bağlantısı hazırlanamadı.");
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
        setErrorMsg("QR kod alınamadı.");
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
    const targetView =
      business.id &&
      !hasDashboardAccess(business.botSettings, business.createdAt) &&
      !ACCESS_ALLOWED_VIEWS.has(nextView)
        ? "subscription"
        : nextView;
    setView(targetView);
    setOpenMenu(null);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("view", targetView);
      params.delete("billing");
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

  function openQuickCreate(label: string) {
    if (!hasDashboardAccess(business.botSettings, business.createdAt)) {
      selectView("subscription");
      return;
    }
    const action = quickCreateFromLabel(label);
    if (action) setQuickCreate(action);
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
            onCreateItem={openQuickCreate}
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

      {quickCreate && (
        <QuickCreateHost
          action={quickCreate}
          business={business}
          selectedDate={selectedDate}
          contacts={contacts}
          saving={saving}
          onClose={() => setQuickCreate(null)}
          onUpdateAndSave={updateAndSave}
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

function quickCreateFromLabel(label: string): QuickCreateAction | null {
  if (label === "Yeni randevu") return "appointment";
  if (label === "Yeni adisyon") return "checkout";
  if (label === "Yeni müşteri") return "customer";
  if (label === "Yeni ürün satışı") return "product-sale";
  if (label === "Yeni paket satışı") return "package-sale";
  if (label === "Yeni masraf") return "expense";
  if (label === "Yeni tahsilat") return "payment";
  if (label === "Yeni alacak") return "receivable";
  if (label === "Yeni borç") return "debt";
  if (label === "Yeni komisyon") return "commission";
  return null;
}

function QuickCreateHost({
  action,
  business,
  selectedDate,
  contacts,
  saving,
  onClose,
  onUpdateAndSave,
}: {
  action: QuickCreateAction;
  business: Business;
  selectedDate: string;
  contacts: ReturnType<typeof buildContacts>;
  saving: boolean;
  onClose: () => void;
  onUpdateAndSave: (fields: Partial<Business>) => Promise<boolean>;
}) {
  const [checkoutCustomerName, setCheckoutCustomerName] = useState("");
  const [checkoutCustomerId, setCheckoutCustomerId] = useState<
    string | undefined
  >();
  const [checkoutCustomerModal, setCheckoutCustomerModal] = useState(false);
  const promotions = (business.promotions || {}) as PromotionsSettings;

  function saveCustomer(customer: CustomerProfile) {
    onClose();
    void onUpdateAndSave({
      customers: [customer, ...(business.customers || [])],
    });
  }

  function saveCheckout(checkout: CheckoutItem) {
    onClose();
    void onUpdateAndSave({
      checkouts: [checkout, ...(business.checkouts || [])],
    });
    syncCheckoutToGoogleCalendar(business, checkout);
  }

  async function addNestedCustomer(customer: CustomerProfile) {
    setCheckoutCustomerName(customer.name);
    setCheckoutCustomerId(customer.id);
    setCheckoutCustomerModal(false);
    await onUpdateAndSave({
      customers: [customer, ...(business.customers || [])],
    });
  }

  async function addCustomerForSale(customer: CustomerProfile) {
    await onUpdateAndSave({
      customers: [customer, ...(business.customers || [])],
    });
  }

  function saveProductSale(
    sale: ProductSaleItem,
    products: ProductCatalogItem[],
  ) {
    onClose();
    void onUpdateAndSave({
      promotions: {
        ...promotions,
        products,
        productSales: [sale, ...(promotions.productSales || [])],
      },
    });
  }

  function savePackageSale(
    sale: PackageSaleItem,
    packages: PackageCatalogItem[],
  ) {
    onClose();
    void onUpdateAndSave({
      promotions: {
        ...promotions,
        packages,
        packageSales: [sale, ...(promotions.packageSales || [])],
      },
    });
  }

  function savePromotionList<K extends keyof PromotionsSettings>(
    key: K,
    item:
      | ExpenseItem
      | PaymentItem
      | LedgerItem
      | CommissionItem,
  ) {
    const current = Array.isArray(promotions[key])
      ? (promotions[key] as unknown[])
      : [];
    onClose();
    void onUpdateAndSave({
      promotions: {
        ...promotions,
        [key]: [item, ...current],
      },
    });
  }

  if (action === "customer") {
    return (
      <CustomerModal saving={saving} onClose={onClose} onSubmit={saveCustomer} />
    );
  }

  if (action === "appointment" || action === "checkout") {
    return (
      <>
        <CheckoutModal
          key={`${checkoutCustomerId || checkoutCustomerName || "empty"}-${action}`}
          business={business}
          contacts={contacts}
          saving={saving}
          initialDate={selectedDate}
          initialCustomerName={checkoutCustomerName}
          initialCustomerId={checkoutCustomerId}
          onClose={onClose}
          onCreateCustomer={(name) => {
            setCheckoutCustomerName(name);
            setCheckoutCustomerId(undefined);
            setCheckoutCustomerModal(true);
          }}
          onSubmit={saveCheckout}
        />
        {checkoutCustomerModal && (
          <CustomerModal
            saving={saving}
            initialName={checkoutCustomerName}
            onClose={() => setCheckoutCustomerModal(false)}
            onSubmit={addNestedCustomer}
          />
        )}
      </>
    );
  }

  if (action === "product-sale") {
    return (
      <ProductSaleModal
        business={business}
        products={promotions.products || []}
        saving={saving}
        onCreateCustomer={addCustomerForSale}
        onClose={onClose}
        onSubmit={saveProductSale}
      />
    );
  }

  if (action === "package-sale") {
    return (
      <PackageSaleModal
        business={business}
        packages={promotions.packages || []}
        saving={saving}
        onCreateCustomer={addCustomerForSale}
        onClose={onClose}
        onSubmit={savePackageSale}
      />
    );
  }

  if (action === "expense") {
    return (
      <ExpenseModal
        saving={saving}
        onClose={onClose}
        onSubmit={(item) => savePromotionList("expenses", item)}
      />
    );
  }

  if (action === "payment") {
    return (
      <PaymentModal
        business={business}
        saving={saving}
        onCreateCustomer={addCustomerForSale}
        onClose={onClose}
        onSubmit={(item) => savePromotionList("payments", item)}
      />
    );
  }

  if (action === "receivable" || action === "debt") {
    return (
      <LedgerModal
        business={business}
        title={action === "receivable" ? "Yeni alacak" : "Yeni borç"}
        saving={saving}
        onCreateCustomer={addCustomerForSale}
        onClose={onClose}
        onSubmit={(item) =>
          savePromotionList(action === "receivable" ? "receivables" : "debts", item)
        }
      />
    );
  }

  return (
    <CommissionModal
      business={business}
      saving={saving}
      onClose={onClose}
      onSubmit={(item) => savePromotionList("commissions", item)}
    />
  );
}

const dashboardTranslations: Record<string, string> = {
  Özet: "Overview",
  "Randevu takvimi": "Appointment calendar",
  Randevular: "Appointments",
  Adisyonlar: "Aloyz Dashboard",
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
  "Tüm Mesajlar": "All messages",
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
  Çalışanlar: "Staff",
  Personel: "Staff",
  "Hesap tipi": "Account type",
  "Telefon numarası": "Phone number",
  "Verdiği Hizmetler": "Assigned services",
  "Personel yok.": "No staff yet.",
  "Hesap sahibi": "Account owner",
  "Hizmet atamaları Hizmetler sayfasındaki personel seçimlerinden yönetilir.":
    "Service assignments are managed from staff selections on the Services page.",
  "Bu personele bağlı hizmet bulunmuyor.":
    "No services are assigned to this staff member.",
  Hizmetler: "Services",
  "Hizmetler / menü": "Services / menu",
  "Hizmet süreleri": "Service durations",
  "Hizmet fiyatları": "Service prices",
  Süreler: "Durations",
  Fiyatlar: "Prices",
  "Hizmet cinsiyeti": "Service gender",
  "Hizmet süresi": "Service duration",
  "Hizmet fiyatı": "Service price",
  "Tüm Personel Sürelerini Düzenle": "Edit all staff durations",
  "Tüm Personel Fiyatlarını Düzenle": "Edit all staff prices",
  "Hizmeti veren personeller": "Staff who provide this service",
  "Hizmet oluşturmak için önce personel ekleyin.":
    "Add staff before creating a service.",
  Ürünler: "Products",
  Paketler: "Packages",
  "Randevu ayarları": "Appointment settings",
  "Temel ayarlar": "Basic settings",
  "Temel Ayarlar": "Basic settings",
  "Çalışma saatlerini ve randevu tercihlerini buradan yönetin.":
    "Manage working hours and appointment preferences here.",
  "Yeni personel": "New staff",
  "Personel bilgileri": "Staff details",
  "Yeni hizmet": "New service",
  "Hizmet bilgileri": "Service details",
  "Hizmet": "Service",
  "Cinsiyet": "Gender",
  "Süre": "Duration",
  "Fiyat": "Price",
  "Ad soyad": "Full name",
  "Cep telefonu": "Mobile phone",
  "E-posta adresi": "Email address",
  "Dosya numarası": "File number",
  "Instagram kullanıcı adı": "Instagram username",
  "Belirtilmemiş": "Unspecified",
  "Kadın": "Female",
  "Erkek": "Male",
  "Unisex": "Unisex",
  "Arama": "Search",
  "Ara": "Search",
  "Hizmet adı": "Service name",
  "Hizmet açıklaması": "Service description",
  "Online randevu": "Online booking",
  "Takvimde göster": "Show on calendar",
  "Çalışan seç": "Select staff",
  "Hizmet seç": "Select service",
  "Bir hizmet daha ekle": "Add another service",
  "Adisyonu oluştur": "Create record",
  "Randevu Etiketleri": "Appointment tags",
  "Randevu fotoğrafları": "Appointment photos",
  "Kayıtlı içerik bulunmamaktadır.": "No saved content.",
  "Kayıtlı tahsilat bulunmamaktadır": "No saved collections",
  "Yeni tahsilat": "New collection",
  "Ödeme yöntemi": "Payment method",
  "Nakit": "Cash",
  "Kredi kartı": "Credit card",
  "Havale": "Bank transfer",
  "Online ödeme": "Online payment",
  "Etiket ayarları": "Tag settings",
  "Bot Ayarları": "Bot settings",
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
  "Açıklama": "Description",
  "Açık: 09:00 - 18:00": "Open: 09:00 - 18:00",
  "Açıkken bot yalnızca işletmenin kendi kendine gönderdiği mesajlara yanıt verir.":
    "When enabled, the bot only replies to messages the business sends to itself.",
  "Adisyon": "Aloyz Dashboard",
  "Adisyon detayları": "Aloyz Dashboard details",
  "Adres": "Address",
  "Aloyz'a geri dönün": "Return to Aloyz",
  "Ayarlar ve Paylaşım": "Settings and sharing",
  "Aylık görünüm": "Monthly view",
  "Bağlantı tamamlanınca bot mesajları yanıtlamaya başlar":
    "The bot starts replying after the connection is complete",
  "Bağlantı için Instagram tarafından açılan izin ekranını onaylamanız gerekir. Aloyz bu şekilde hesabı işletmenize kaydeder.":
    "Approve the permission screen opened by Instagram. Aloyz uses this approval to save the account to your business.",
  "Bağlı": "Connected",
  "Bağlı değil": "Not connected",
  "Başarısız": "Failed",
  "Başlık": "Title",
  "Barkod": "Barcode",
  "Bekleyen ödeme": "Pending payment",
  "Borç": "Debt",
  "Birleştir": "Merge",
  "Bu adisyon için indirim uygula.": "Apply discount to this record.",
  "Bu bölümün gerçek içeriği sırayla entegre edilecek.":
    "The real content for this section will be integrated in order.",
  "Bu değişikliği sonraki günlere de uygulamak ister misiniz?":
    "Do you want to apply this change to the following days too?",
  "Bu kanalda henüz mesajlaşma bulunmuyor.":
    "There are no conversations in this channel yet.",
  "Bu yıl": "This year",
  "Bu ay": "This month",
  "Bugünkü randevu": "Today's appointment",
  "Çalışan düzenle": "Edit staff",
  "Çalışan hizmetleri": "Staff services",
  "Çar": "Wed",
  "Çarşamba": "Wednesday",
  "Değişiklikler kaydedildi.": "Changes saved.",
  "Değişiklikleri kaydet": "Save changes",
  "Deneme bitişi": "Trial ends",
  "Deneme süresi": "Trial period",
  "Erişim bitişi": "Access until",
  "Erişim bitiş tarihiniz": "Your access ends on",
  "Detayları görmek için listeden bir kişi seçin.":
    "Select a person from the list to view details.",
  "Dönem": "Period",
  "Dakika": "Minutes",
  "Doğum günü": "Birthday",
  "Dönemsel saat": "Special hours",
  "Dün": "Yesterday",
  "Eklendikten sonra ödeme penceresini aç":
    "Open payment window after adding",
  "Eski → Yeni": "Old → New",
  "Etiket adı": "Tag name",
  "Etiket düzenle": "Edit tag",
  "Fiyat aralığı": "Price range",
  "Fatura tarihi": "Invoice date",
  "Geçen ay": "Last month",
  "Geçerlilik bitişi": "Expiration date",
  "Geldi": "Arrived",
  "Geldi mi": "Attendance",
  "Gelmedi": "No-show",
  "Google Takvim bağlı değil": "Google Calendar is not connected",
  "Google Takvim senkronizasyonu başarısız.":
    "Google Calendar sync failed.",
  "Gönderildi": "Sent",
  "Gönderim tarihi": "Send date",
  "Görüşme": "Conversation",
  "Görüşme yok": "No conversation",
  "Günlük görünüm": "Daily view",
  "Haftalık görünüm": "Weekly view",
  "Hak ediş notları": "Commission notes",
  "Hatırlatıldı": "Reminded",
  "Hizmet satışları": "Service sales",
  "Hizmet düzenle": "Edit service",
  "Hizmet tutarı": "Service amount",
  "Hizmet toplamı": "Service total",
  "Hizmet ve ürünler toplamı": "Services and products total",
  "Hizmet yok": "No services",
  "Instagram hesabı": "Instagram account",
  "Instagram mesajları": "Instagram messages",
  "Instagram profesyonel hesabınıza giriş yapın":
    "Sign in to your Instagram professional account",
  "Instagram Bot Aktif/Pasif": "Instagram bot active/passive",
  "İçe aktarma için ürün ve paketleri Kurulum bölümünden ekleyin.":
    "Add products and packages from Setup before importing.",
  "İl": "City",
  "İlçe": "District",
  "İletildi": "Delivered",
  "İletişim": "Contact",
  "İndirim": "Discount",
  "İndirim tutarı": "Discount amount",
  "İndirim yüzdesi": "Discount percentage",
  "İptal": "Cancel",
  "İşletme": "Business",
  "İşletme adı": "Business name",
  "İşletme bilgileri alınamadı.": "Business information could not be loaded.",
  "Kalan kullanım": "Remaining usage",
  "Kalan": "Remaining",
  "Kalan gün": "Days remaining",
  "Kanal": "Channel",
  "Kategori": "Category",
  "Kaynak": "Source",
  "Kapalıyken bot bağlı kanallarda otomatik yanıt vermez.":
    "When disabled, the bot does not automatically reply on connected channels.",
  "Kapalıyken bot gelen mesajlara otomatik yanıt vermez.":
    "When disabled, the bot does not automatically reply to incoming messages.",
  "kapalı": "closed",
  "Kapandı": "Closed",
  "Kaydetme sırasında hata oluştu.": "An error occurred while saving.",
  "Kayıt sayısı": "Record count",
  "Kişi": "Person",
  "Kişi sayısı": "Person count",
  "Kişi seçilmedi": "No person selected",
  "Kişiler": "People",
  "Kopyalandı": "Copied",
  "Kullanıcı": "User",
  "Kullanıcı adı": "Username",
  "Kullanılan": "Used",
  "Masraf adı": "Expense name",
  "Mesaj": "Message",
  "Mesaj kanalı": "Message channel",
  "Mesaj sayısı": "Message count",
  "Menüyü aç": "Expand menu",
  "Menüyü daralt": "Collapse menu",
  "Mesaj ve profil izinlerini onaylayın":
    "Approve message and profile permissions",
  "Mesajlar bot tarafından alınabilir.": "Messages can be received by the bot.",
  "Mesajlarınızı Instagram > Mesajlar sayfasından yönetin":
    "Manage your messages from Instagram > Messages",
  "Mesajlarınızı WhatsApp > Mesajlar sayfasından takip edin":
    "Track your messages from WhatsApp > Messages",
  "Mevcut şifre": "Current password",
  "Müşteri Bilgileri": "Customer details",
  "Miktar": "Quantity",
  "Not": "Note",
  "Oluşturan": "Created by",
  "Oluşturulma": "Created",
  "Online randevu alınabilir": "Online booking available",
  "Otomatik yeni paket kullanımı penceresi":
    "Automatic new package usage window",
  "Ödeme bekleniyor": "Awaiting payment",
  "Ödeme bildirimleri": "Payment notifications",
  "Açıklama kısmına hesap e-postanızı yazın:": "Write your account email in the payment description:",
  "Ödenen": "Paid",
  "Öğle arası": "Lunch break",
  "Örn. Saç kesimi": "E.g. Haircut",
  "Örn. 60": "E.g. 60",
  "Örn. 300": "E.g. 300",
  "Örn. 500": "E.g. 500",
  "Örn. 700": "E.g. 700",
  "Paket adı": "Package name",
  "Paket düzenle": "Edit package",
  "QR kod alınamadı.": "QR code could not be loaded.",
  "QR kod yüklendi.": "QR code loaded.",
  "QR kodu okutunca bağlantı tamamlanır":
    "The connection is completed when you scan the QR code",
  "QR kodu okutunca bağlantı tamamlanır.":
    "The connection is completed when you scan the QR code.",
  "QR kodu WhatsApp > Bağlı Cihazlar ekranından okutun":
    "Scan the QR code from WhatsApp > Linked Devices",
  "Randevu": "Appointment",
  "Randevu aralığı": "Appointment interval",
  "Randevu bildirimleri": "Appointment notifications",
  "Randevu hatırlatma": "Appointment reminder",
  "Randevu iptali": "Appointment cancellation",
  "Randevu oluşturuldu bildirimi": "Appointment created notification",
  "Randevu sayısı": "Appointment count",
  "Saat formatı": "Time format",
  "Sadece bu gün": "Only this day",
  "Salı": "Tuesday",
  "Perşembe": "Thursday",
  "Satıcı": "Seller",
  "Satış tarihi": "Sale date",
  "Satış tipi": "Sale type",
  "Sayfa hazır": "Page ready",
  "Sayfadaki ürün satışlarının toplam tutarı": "Total product sales amount on this page",
  "Sayfadaki paket satışlarının toplam tutarı": "Total package sales amount on this page",
  "Son geçerlilik tarihi": "Expiration date",
  "Son güncelleme": "Last update",
  "Sonuç": "Result",
  "Tek fiyat": "Fixed price",
  "Sunucu hatası oluştu.": "A server error occurred.",
  "Şifre değiştirilemedi.": "Password could not be changed.",
  "Şifre güncellendi.": "Password updated.",
  "Şunlarla paylaşıldı:": "Shared with:",
  "Tahsilat, alacak ve borç hareketleri.":
    "Collection, receivable and debt transactions.",
  "Takvim ayarları": "Calendar settings",
  "Takvimde görünsün mü": "Show on calendar?",
  "Temel bilgiler, çalışma saatleri ve entegrasyon ayarlarını düzenleyin.":
    "Edit basic information, working hours and integration settings.",
  "Tüm müşteri kayıtlarını telefon, kanal ve son görüşme bilgileriyle görüntüleyin.":
    "View all customer records with phone, channel and last conversation information.",
  "Tüm şifre alanlarını doldurun.": "Fill in all password fields.",
  "Tüm tutar için alacak kaydı oluştur":
    "Create a receivable for the full amount",
  "Tüm zamanlar": "All time",
  "TL": "TRY",
  "Ürün": "Product",
  "Ürün adı": "Product name",
  "Ürün adı veya barkoduyla arayın": "Search by product name or barcode",
  "Ürün düzenle": "Edit product",
  "Ürünü sil": "Delete product",
  "Web sitesi": "Website",
  "WhatsApp bağlantısı hazırlanamadı.":
    "WhatsApp connection could not be prepared.",
  "WhatsApp bağlantısı kesildi.": "WhatsApp connection disconnected.",
  "WhatsApp bağlantısı kesilemedi.":
    "WhatsApp connection could not be disconnected.",
  "WhatsApp bağlı": "WhatsApp connected",
  "WhatsApp bağlı değil": "WhatsApp not connected",
  "Whatsapp mesajları": "WhatsApp messages",
  "WhatsApp Bot Aktif/Pasif": "WhatsApp bot active/passive",
  "WhatsApp ve Instagram konuşmaları.":
    "WhatsApp and Instagram conversations.",
  "Yeni → Eski": "New → Old",
  "Yeni adisyon": "New record",
  "Yeni alacak": "New receivable",
  "Yeni borç": "New debt",
  "Yeni çalışan": "New staff",
  "Yeni dönemsel çalışma saati": "New special working hour",
  "Yeni etiket": "New tag",
  "Yeni kayıt": "New record",
  "Yeni komisyon": "New commission",
  "Yeni masraf": "New expense",
  "Yeni müşteri": "New customer",
  "Yeni oluştur": "Create new",
  "Yeni paket": "New package",
  "Yeni paket ekle": "Add new package",
  "Yeni paket satışı": "New package sale",
  "Yeni randevu": "New appointment",
  "Yeni randevu ve adisyon güncellemeleri.":
    "New appointment and dashboard updates.",
  "Yeni şifre": "New password",
  "Yeni şifre en az 8 karakter olmalı.":
    "New password must be at least 8 characters.",
  "Yeni şifre tekrar": "Repeat new password",
  "Yeni şifreler eşleşmiyor.": "New passwords do not match.",
  "Yeni ürün": "New product",
  "Yeni ürün ekle": "Add new product",
  "Yeni ürün satışı": "New product sale",
  "örnek@domain.com": "example@domain.com",
  "+ Bir hizmet daha ekle": "+ Add another service",
  "+ Bir ürün daha ekle": "+ Add another product",
  "+ Kayıtlı paketlerden seç": "+ Select from saved packages",
  "+ Yeni müşteri olarak ekle": "+ Add as a new customer",
  "+ Yeni paket ekle": "+ Add a new package",
  "15 Dakika": "15 Minutes",
  "15 dakikada bir": "Every 15 minutes",
  "30 Dakika": "30 Minutes",
  "30 dakikada bir": "Every 30 minutes",
  "60 Dakika": "60 Minutes",
  "60 dakikada bir": "Every 60 minutes",
  "Açık randevular": "Open appointments",
  "Adet": "Quantity",
  "Adisyon kaydı yok.": "No records.",
  "Alacak": "Receivable",
  "Alacak hatırlatmaları": "Receivable reminders",
  "Asistan": "Assistant",
  "Aşağıdaki açıklamayı okuyun.": "Read the explanation below.",
  "Ayarlar": "Settings",
  "Bağlantı durumu": "Connection status",
  "Bağlantıyı kes": "Disconnect",
  "Bildirimler": "Notifications",
  "Bot": "Bot",
  "Bot aktif": "Bot active",
  "Bot okuyabilir": "Bot can read",
  "Bot Ayarlarına Git": "Go to bot settings",
  "Bot durumu": "Bot status",
  "Cmt": "Sat",
  "Cum": "Fri",
  "Detay yok": "No details",
  "Dinamik": "Dynamic",
  "Ekle": "Add",
  "En düşük fiyat (TL)": "Minimum price (TRY)",
  "En yüksek fiyat (TL)": "Maximum price (TRY)",
  "Etiket": "Tag",
  "Fiyat (TL)": "Price (TRY)",
  "Fiyat tipi": "Price type",
  "Google online randevu": "Google online booking",
  "Google Takvim Entegrasyonu": "Google Calendar Integration",
  "Google Takvim'i yenile": "Refresh Google Calendar",
  "1. Google Takvim → Sol menüde takvimin yanındaki 3 nokta":
    "1. Google Calendar → Click the three dots next to the calendar in the left menu",
  "2. \"Ayarlar ve Paylaşım\" menüsünü seçin":
    "2. Select the \"Settings and sharing\" menu",
  "4. Rol olarak \"Editor\" seçin ve kaydedin.":
    "4. Select \"Editor\" as the role and save.",
  "görüşme": "conversation",
  "Hak ediş ayarları": "Commission settings",
  "Hak ediş oranı (%)": "Commission rate (%)",
  "Hata": "Error",
  "Hata kodu": "Error code",
  "Hatırlatılacak açık alacak yok.":
    "There are no open receivables to remind.",
  "Henüz açık randevu yok.": "There are no open appointments yet.",
  "hesap e-postanız": "your account email",
  "Hizmet bulunamadı.": "No services found.",
  "Hizmet yok.": "No services.",
  "Instagram aktif": "Instagram active",
  "Instagram bağlantısı": "Instagram connection",
  "Instagram bağlantısını kes": "Disconnect Instagram",
  "Instagram hesabınıza gelen mesajları Aloyz üzerinden yönetin":
    "Manage messages sent to your Instagram account through Aloyz",
  "Instagram ile Giriş Yap": "Sign in with Instagram",
  "Instagram Kurulumu": "Instagram Setup",
  "Instagram profesyonel hesabı bağlı":
    "Instagram professional account connected",
  "Instagram profesyonel hesabınızı Aloyz mesaj kutusuna bağlayın.":
    "Connect your Instagram professional account to the Aloyz inbox.",
  "Instagram profilini görüntüle": "View Instagram profile",
  "Instagram'a Yeniden Bağlan": "Reconnect Instagram",
  "İptal et": "Cancel",
  "Kalan tutardan fazla tahsilat yapılamaz.":
    "The collection cannot exceed the remaining amount.",
  "Karşılama mesajı": "Welcome message",
  "kayıt gösteriliyor": "records shown",
  "Komisyon": "Commission",
  "Komisyon toplamı": "Total commission",
  "Konuşma": "Conversation",
  "Kopyala": "Copy",
  "Koyu": "Dark",
  "Listeye dön": "Back to list",
  "Mesaj bildirimleri": "Message notifications",
  "Mesaj bulunamadı.": "No messages found.",
  "Mesaj içeriği bulunamadı.": "Message content not found.",
  "Mesaj Kişileri": "Message contacts",
  "Mesaj kişisi bulunamadı.": "No message contacts found.",
  "Mesaj yok": "No messages",
  "Mesajlara Git": "Go to messages",
  "Mola saati ekle": "Add break time",
  "Mola saati eklenmedi.": "No break time added.",
  "Mola saatleri": "Break times",
  "Müşteri kaydı bulunamadı.": "No customer records found.",
  "Net": "Net",
  "Net kasa": "Net cash",
  "Okundu": "Read",
  "Okunma tarihi": "Read date",
  "Otomatik bekleme listesi penceresi": "Automatic waitlist window",
  "Ödeme": "Payment",
  "Ödeme bilgileri": "Payment information",
  "Öğle arası mola saatleri": "Lunch break hours",
  "Önümüzdeki 30 gün içinde doğum günü yok.":
    "There are no birthdays in the next 30 days.",
  "Özel talimatlar": "Special instructions",
  "Cevap": "Answer",
  "Paket": "Package",
  "Paket tipi": "Package type",
  "Paketi sil": "Delete package",
  "Paz": "Sun",
  "Per": "Thu",
  "Plan": "Plan",
  "Profesyonel Instagram hesabı bağlandı":
    "Professional Instagram account connected",
  "Puan": "Points",
  "Pzt": "Mon",
  "QR kod burada görünecek.": "The QR code will appear here.",
  "QR Kodu Getir": "Get QR Code",
  "Randevu yok.": "No appointments.",
  "Renk": "Color",
  "Sal": "Tue",
  "Salon DM ayarları": "Salon DM settings",
  "Seans": "Sessions",
  "Sohbet bulunamadı": "No conversations found",
  "Sık sorulan sorular": "Frequently asked questions",
  "Soru": "Question",
  "Süre (dakika)": "Duration (minutes)",
  "Tahsil edilecek kalan tutar": "Remaining amount to collect",
  "Tahsil edilen": "Collected",
  "Tahsil edilen toplam tutar": "Total collected amount",
  "Tahsilatsız kapat": "Close without collection",
  "Takvim": "Calendar",
  "Takvim genişliği": "Calendar width",
  "Takvim görünümü": "Calendar view",
  "Takvim saat aralığı": "Calendar time interval",
  "Takvim sahibinin e-posta adresini girin.":
    "Enter the calendar owner's email address.",
  "Takvim tarihi": "Calendar date",
  "Takvim yazı rengi": "Calendar text color",
  "Takvimi aç": "Open calendar",
  "Takvimin bağlı olduğu e-posta": "Connected calendar email",
  "Tamam": "Done",
  "Tarih Aralığı": "Date range",
  "Teslim tarihi": "Delivery date",
  "Tip": "Type",
  "Toplam": "Total",
  "Toplam alacak": "Total receivables",
  "Toplam arama": "Total calls",
  "Toplam borç": "Total debts",
  "Toplam ciro": "Total revenue",
  "Toplam komisyon": "Total commission",
  "Toplam kayıt sayısı": "Total records",
  "Toplam tahsilat": "Total collected",
  "Toplam yorum": "Total reviews",
  "Tüm tutar tahsil edildi": "Full amount collected",
  "Varsayılan ayarlara dön": "Restore default settings",
  "Üyeliğiniz aktif. Aylık abonelik tutarı":
    "Your subscription is active. The monthly subscription fee",
  "Üyeliğiniz aktif. Erişim bitiş tarihiniz:":
    "Your subscription is active. Your access ends on:",
  "Deneme süreniz sona erdi. Devam etmek için aylık":
    "Your trial has ended. To continue, send the monthly",
  "Deneme sürenizde": "Your trial has",
  "gün kaldı. Deneme süresi bittikten":
    "days remaining. After the trial ends",
  "sonra abonelik aylık": "the subscription continues monthly at",
  "ödemeyi aşağıdaki IBAN'a gönderebilirsiniz.":
    "payment to the IBAN below.",
  "WhatsApp aktif": "WhatsApp active",
  "WhatsApp bağlantısı": "WhatsApp connection",
  "WhatsApp hesabınıza gelen mesajları Aloyz üzerinden yönetin":
    "Manage messages sent to your WhatsApp account through Aloyz",
  "WhatsApp hesabınızı QR kod ile Aloyz'a bağlayın.":
    "Connect your WhatsApp account to Aloyz using a QR code.",
  "WhatsApp Kurulumu": "WhatsApp Setup",
  "WhatsApp QR kodu": "WhatsApp QR code",
  "WhatsApp ve Instagram konuşmalarından gelen kişiler":
    "Contacts from WhatsApp and Instagram conversations",
  "Yaklaşan doğum günleri": "Upcoming birthdays",
  "Ödemenizi yapmanızla beraber en fazla 1 gün içinde erişiminiz güncellenir.":
    "Your access will be updated within 1 day after payment.",
  "Yazdır": "Print",
  "Yorum": "Review",
  "Yön": "Direction",
  "Z → A": "Z → A",
  "Henüz sık sorulan soru eklenmedi.":
    "No frequently asked questions have been added yet.",
  "Yeni soru": "New question",
  "Yeşil işaretli alanlar Bot tarafından cevap üretirken okunabilir.":
    "Fields marked in green can be read by the bot when generating replies.",
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
      const translated =
        dashboardTranslations[trimmed] || translateDashboardText(trimmed);
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
        language === "en"
          ? dashboardTranslations[source] || translateDashboardText(source) || source
          : source,
      );
    }
  }
}

function translateDashboardText(text: string) {
  let translated = text;
  const entries = Object.entries(dashboardTranslations).sort(
    ([left], [right]) => right.length - left.length,
  );
  for (const [source, target] of entries) {
    if (source.length < 3 || !translated.includes(source)) continue;
    const escapedSource = source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(
      `(?<![\\p{L}\\p{N}])${escapedSource}(?![\\p{L}\\p{N}])`,
      "gu",
    );
    translated = translated.replace(pattern, target);
  }
  return translated === text ? "" : translated;
}
