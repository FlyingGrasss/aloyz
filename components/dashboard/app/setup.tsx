"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
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

export function OnboardingPanel({
  business,
  saving,
  onChange,
  onHourChange,
  onSave,
}: {
  business: Business;
  saving: boolean;
  onChange: <K extends keyof Business>(field: K, value: Business[K]) => void;
  onHourChange: (dayKey: string, value: string, field: "start" | "end") => void;
  onSave: () => void;
}) {
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <StatusBanner tone="warning">
        Devam etmeden önce temel işletme bilgilerini ve çalışma saatlerini
        tamamlayın.
      </StatusBanner>
      <SetupGeneralForm
        business={business}
        saving={saving}
        onChange={onChange}
        onSave={onSave}
      />
      <WorkingHoursForm
        business={business}
        saving={saving}
        onHourChange={onHourChange}
        onSave={onSave}
      />
    </div>
  );
}

export function SetupPage({
  view,
  business,
  saving,
  whatsAppStatus,
  qrCodeBase64,
  onChange,
  onHourChange,
  onSave,
  onUpdateAndSave,
  onTogglePatch,
  onReconnectWhatsApp,
  onSelectView,
}: {
  view: SetupViewId;
  business: Business;
  saving: boolean;
  whatsAppStatus: string | null;
  qrCodeBase64: string | null;
  onChange: <K extends keyof Business>(field: K, value: Business[K]) => void;
  onHourChange: (dayKey: string, value: string, field: "start" | "end") => void;
  onSave: () => void;
  onUpdateAndSave: (fields: Partial<Business>) => Promise<boolean>;
  onTogglePatch: (field: "is_active" | "test_mode", value: boolean) => void;
  onReconnectWhatsApp: () => void;
  onSelectView: (view: ViewId) => void;
}) {
  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          { label: "Aloyz", view: "dashboard" },
          {
            label: business.slug || business.name || "Kurulum",
            view: "setup/general",
          },
          { label: getViewLabel(view), view },
        ]}
        onSelectView={onSelectView}
      />
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="rounded border border-slate-200 bg-white shadow-sm">
          {setupItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectView(item.id)}
                className={`flex h-10 w-full items-center gap-3 border-b border-slate-200 px-4 text-left text-sm hover:bg-slate-50 ${
                  view === item.id ? "bg-slate-100 font-semibold" : ""
                }`}
              >
                <Icon className="size-4" />
                {item.label}
              </button>
            );
          })}
        </aside>
        <section>
          {view === "setup/general" && (
            <SetupGeneralForm
              business={business}
              saving={saving}
              onChange={onChange}
              onSave={onSave}
            />
          )}
          {view === "setup/working-hours" && (
            <WorkingHoursForm
              business={business}
              saving={saving}
              onHourChange={onHourChange}
              onSave={onSave}
            />
          )}
          {view === "setup/connections" && (
            <ConnectionsPanel
              business={business}
              saving={saving}
              whatsAppStatus={whatsAppStatus}
              qrCodeBase64={qrCodeBase64}
              onChange={onChange}
              onSave={onSave}
              onUpdateAndSave={onUpdateAndSave}
              onTogglePatch={onTogglePatch}
              onReconnectWhatsApp={onReconnectWhatsApp}
            />
          )}
          {view === "setup/staff" && (
            <StaffSetupPage
              business={business}
              saving={saving}
              onUpdateAndSave={onUpdateAndSave}
            />
          )}
          {view === "setup/services" && (
            <ServicesSetupPage
              business={business}
              saving={saving}
              onUpdateAndSave={onUpdateAndSave}
            />
          )}
          {view === "setup/service_durations" && (
            <ServiceAttributePage
              mode="duration"
              services={business.services || []}
            />
          )}
          {view === "setup/service_prices" && (
            <ServiceAttributePage
              mode="price"
              services={business.services || []}
            />
          )}
          {view === "setup/promotions" && (
            <PromotionsSetupPage
              business={business}
              saving={saving}
              onUpdateAndSave={onUpdateAndSave}
            />
          )}
          {view === "setup/salon-bot-settings" && (
            <SalonBotSettingsPage
              business={business}
              saving={saving}
              onUpdateAndSave={onUpdateAndSave}
            />
          )}
          {view === "setup/booking_settings" && (
            <BookingSettingsPage
              business={business}
              saving={saving}
              onUpdateAndSave={onUpdateAndSave}
            />
          )}
          {view !== "setup/general" &&
            view !== "setup/working-hours" &&
            view !== "setup/connections" &&
            view !== "setup/staff" &&
            view !== "setup/services" &&
            view !== "setup/service_durations" &&
            view !== "setup/service_prices" &&
            view !== "setup/promotions" &&
            view !== "setup/salon-bot-settings" &&
            view !== "setup/booking_settings" && (
              <PlaceholderPage view={view} compact />
            )}
        </section>
      </div>
    </div>
  );
}

function StaffSetupPage({
  business,
  saving,
  onUpdateAndSave,
}: {
  business: Business;
  saving: boolean;
  onUpdateAndSave: (fields: Partial<Business>) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [servicesFor, setServicesFor] = useState<StaffMember | null>(null);
  const staff = business.staff || [];

  async function saveStaff(member: StaffMember) {
    const cleanMember = sanitizeStaffMember(member);
    const next = staff.some((item) => item.id === member.id)
      ? staff.map((item) =>
          item.id === member.id ? cleanMember : sanitizeStaffMember(item),
        )
      : [...staff.map(sanitizeStaffMember), cleanMember];
    setEditing(null);
    await onUpdateAndSave({ staff: next });
  }

  async function removeStaff(id: string) {
    await onUpdateAndSave({ staff: staff.filter((item) => item.id !== id) });
  }

  return (
    <section className="rounded bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-700">Çalışanlar</h1>
        <Button
          type="button"
          onClick={() => setEditing(emptyStaff())}
          className="w-52 bg-[#24a647] text-white"
        >
          <Plus className="size-4" /> Yeni
        </Button>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-y border-slate-200 text-slate-600">
            <tr>
              <th className="px-3 py-3">Personel</th>
              <th className="px-3 py-3">Hesap tipi</th>
              <th className="px-3 py-3">Telefon numarası</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {staff.map((member) => (
              <tr key={member.id}>
                <td className="px-3 py-3">{member.name}</td>
                <td className="px-3 py-3">{member.role || "Personel"}</td>
                <td className="px-3 py-3">{member.phone || "-"}</td>
                <td className="px-3 py-3 text-right">
                  <div className="inline-flex gap-2">
                    <Button
                      type="button"
                      className="bg-[#5f86b6] text-white"
                      onClick={() => setEditing(member)}
                    >
                      Düzenle
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setServicesFor(member)}
                    >
                      Verdiği Hizmetler
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => removeStaff(member.id)}
                    >
                      Sil
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {staff.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-10 text-center text-slate-400"
                >
                  Personel yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {editing && (
        <StaffModal
          member={editing}
          saving={saving}
          onClose={() => setEditing(null)}
          onSubmit={saveStaff}
        />
      )}
      {servicesFor && (
        <StaffServicesModal
          member={servicesFor}
          services={business.services || []}
          onClose={() => setServicesFor(null)}
        />
      )}
    </section>
  );
}

function StaffModal({
  member,
  saving,
  onClose,
  onSubmit,
}: {
  member: StaffMember;
  saving: boolean;
  onClose: () => void;
  onSubmit: (member: StaffMember) => void;
}) {
  const [form, setForm] = useState(member);
  return (
    <div className="fixed inset-0 z-50 grid place-items-start bg-slate-950/35 p-6">
      <section className="mx-auto mt-4 w-full max-w-2xl rounded bg-white shadow-xl">
        <ModalHeader
          title={member.name ? "Çalışan düzenle" : "Yeni çalışan"}
          onClose={onClose}
        />
        <div className="grid max-h-[78vh] gap-3 overflow-y-auto p-4">
          <Input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Ad soyad"
          />
          <Input
            value={form.email || ""}
            onChange={(event) =>
              setForm({ ...form, email: event.target.value })
            }
            placeholder="E-posta adresi"
          />
          <Input
            value={form.phone || ""}
            onChange={(event) =>
              setForm({ ...form, phone: event.target.value })
            }
            placeholder="Cep telefonu"
          />
          <NativeSelect
            value={form.role || "Personel"}
            onChange={(value) => setForm({ ...form, role: value })}
            options={["Hesap sahibi", "Personel"].map((value) => ({
              value,
              label: value,
            }))}
          />
          <ToggleRow
            label="Online randevu alınabilir"
            description=""
            checked={!!form.onlineBooking}
            onChange={(checked) => setForm({ ...form, onlineBooking: checked })}
          />
          <ToggleRow
            label="Takvimde görünsün mü"
            description=""
            checked={form.calendarVisible !== false}
            onChange={(checked) =>
              setForm({ ...form, calendarVisible: checked })
            }
          />
          <Button type="button" variant="outline">
            <Plus className="size-4" /> Çalışma saatleri
          </Button>
          <Button type="button" variant="outline">
            <Plus className="size-4" /> Öğle arası mola saatleri
          </Button>
          <Button type="button" variant="outline">
            <Plus className="size-4" /> Hak ediş ayarları
          </Button>
          <Button
            type="button"
            disabled={saving || !form.name.trim()}
            onClick={() => onSubmit(form)}
            className="bg-[#5f86b6] text-white"
          >
            Kaydet
          </Button>
        </div>
      </section>
    </div>
  );
}

function StaffServicesModal({
  member,
  services,
  onClose,
}: {
  member: StaffMember;
  services: ServiceItem[];
  onClose: () => void;
}) {
  const linked = services.filter((service) =>
    service.staffIds.includes(member.id),
  );
  return (
    <div className="fixed inset-0 z-50 grid place-items-start bg-slate-950/35 p-6">
      <section className="mx-auto mt-4 w-full max-w-2xl rounded bg-white shadow-xl">
        <ModalHeader title="Çalışan hizmetleri" onClose={onClose} />
        <div className="space-y-3 p-4">
          <div className="flex gap-3 bg-slate-100 p-3">
            <Input placeholder="Ara" />
            <Button type="button" className="ml-auto bg-[#5f86b6] text-white">
              <Plus className="size-4" /> Hizmet ekle
            </Button>
          </div>
          <div className="border-b border-slate-200 pb-2 text-sm font-semibold">
            Hizmet
          </div>
          {linked.map((service) => (
            <div
              key={service.id}
              className="border-b border-slate-100 py-2 text-sm"
            >
              {service.name}
            </div>
          ))}
          {linked.length === 0 && (
            <EmptyState
              title="Hizmet yok"
              description="Bu personele bağlı hizmet bulunmuyor."
            />
          )}
          <Button type="button" className="w-full bg-[#5f86b6] text-white">
            Hizmetleri başka bir personelden kopyala
          </Button>
        </div>
      </section>
    </div>
  );
}

function ServicesSetupPage({
  business,
  saving,
  onUpdateAndSave,
}: {
  business: Business;
  saving: boolean;
  onUpdateAndSave: (fields: Partial<Business>) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState<ServiceItem | null>(null);
  const services = business.services || [];
  async function saveService(service: ServiceItem) {
    const next = services.some((item) => item.id === service.id)
      ? services.map((item) => (item.id === service.id ? service : item))
      : [...services, service];
    setEditing(null);
    await onUpdateAndSave({ services: next });
  }
  return (
    <section className="rounded bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-700">Hizmetler</h1>
        <Button
          type="button"
          onClick={() => setEditing(emptyService())}
          className="w-52 bg-[#24a647] text-white"
        >
          <Plus className="size-4" /> Yeni
        </Button>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-y border-slate-200 text-slate-600">
            <tr>
              <th className="px-3 py-3">Hizmet</th>
              <th className="px-3 py-3">Cinsiyet</th>
              <th className="px-3 py-3">Süre</th>
              <th className="px-3 py-3">Fiyat</th>
              <th className="px-3 py-3">Personel</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {services.map((service) => (
              <tr key={service.id}>
                <td className="px-3 py-3 font-medium">{service.name}</td>
                <td className="px-3 py-3">{service.gender}</td>
                <td className="px-3 py-3">{service.duration} dk</td>
                <td className="px-3 py-3">
                  {service.priceType === "range"
                    ? `${service.minPrice} - ${service.maxPrice}`
                    : service.price}{" "}
                  TL
                </td>
                <td className="px-3 py-3">{service.staffIds.length}</td>
                <td className="px-3 py-3 text-right">
                  <Button
                    type="button"
                    className="bg-[#5f86b6] text-white"
                    onClick={() => setEditing(service)}
                  >
                    Düzenle
                  </Button>
                </td>
              </tr>
            ))}
            {services.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-10 text-center text-slate-400"
                >
                  Hizmet yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {editing && (
        <ServiceModal
          service={editing}
          staff={business.staff || []}
          saving={saving}
          onClose={() => setEditing(null)}
          onSubmit={saveService}
        />
      )}
    </section>
  );
}

function ServiceModal({
  service,
  staff,
  saving,
  onClose,
  onSubmit,
}: {
  service: ServiceItem;
  staff: StaffMember[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (service: ServiceItem) => void;
}) {
  const [form, setForm] = useState(service);
  const [durationText, setDurationText] = useState(
    String(service.duration || ""),
  );
  const [priceText, setPriceText] = useState(String(service.price || ""));
  const [minPriceText, setMinPriceText] = useState(
    String(service.minPrice || ""),
  );
  const [maxPriceText, setMaxPriceText] = useState(
    String(service.maxPrice || ""),
  );
  const valid = form.name.trim() && form.staffIds.length > 0;
  const submitService = () =>
    onSubmit({
      ...form,
      duration: parseLooseNumber(durationText),
      price: parseLooseNumber(priceText),
      minPrice: parseLooseNumber(minPriceText),
      maxPrice: parseLooseNumber(maxPriceText),
    });
  return (
    <div className="fixed inset-0 z-50 grid place-items-start bg-slate-950/35 p-6">
      <section className="mx-auto mt-4 w-full max-w-xl rounded bg-white shadow-xl">
        <ModalHeader
          title={service.name ? "Hizmet düzenle" : "Yeni hizmet"}
          onClose={onClose}
        />
        <div className="grid gap-3 p-4">
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Hizmet adı
            <Input
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              placeholder="Örn. Saç kesimi"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Cinsiyet
            <NativeSelect
              value={form.gender}
              onChange={(value) => setForm({ ...form, gender: value })}
              options={["Kadın", "Erkek", "Unisex"].map((value) => ({
                value,
                label: value,
              }))}
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Süre (dakika)
            <Input
              inputMode="numeric"
              value={durationText}
              onChange={(event) => setDurationText(event.target.value)}
              placeholder="Örn. 60"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Fiyat tipi
            <NativeSelect
              value={form.priceType}
              onChange={(value) =>
                setForm({ ...form, priceType: value as "single" | "range" })
              }
              options={[
                { value: "single", label: "Tek fiyat" },
                { value: "range", label: "Fiyat aralığı" },
              ]}
            />
          </label>
          {form.priceType === "single" ? (
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              Fiyat (TL)
              <Input
                inputMode="decimal"
                value={priceText}
                onChange={(event) => setPriceText(event.target.value)}
                placeholder="Örn. 500"
              />
            </label>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                En düşük fiyat (TL)
                <Input
                  inputMode="decimal"
                  value={minPriceText}
                  onChange={(event) => setMinPriceText(event.target.value)}
                  placeholder="Örn. 300"
                />
              </label>
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                En yüksek fiyat (TL)
                <Input
                  inputMode="decimal"
                  value={maxPriceText}
                  onChange={(event) => setMaxPriceText(event.target.value)}
                  placeholder="Örn. 700"
                />
              </label>
            </div>
          )}
          <div className="rounded border border-slate-200 p-3">
            <div className="mb-2 text-sm font-semibold">
              Hizmeti veren personeller
            </div>
            <div className="grid gap-2">
              {staff.map((member) => (
                <label
                  key={member.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={form.staffIds.includes(member.id)}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        staffIds: event.target.checked
                          ? [...form.staffIds, member.id]
                          : form.staffIds.filter((id) => id !== member.id),
                      })
                    }
                  />
                  {member.name}
                </label>
              ))}
              {staff.length === 0 && (
                <div className="text-sm text-red-600">
                  Hizmet oluşturmak için önce personel ekleyin.
                </div>
              )}
            </div>
          </div>
          <Button
            type="button"
            disabled={saving || !valid}
            onClick={submitService}
            className="bg-[#5f86b6] text-white"
          >
            Kaydet
          </Button>
        </div>
      </section>
    </div>
  );
}

function ServiceAttributePage({
  mode,
  services,
}: {
  mode: "duration" | "price";
  services: ServiceItem[];
}) {
  const [search, setSearch] = useState("");
  const normalizedSearch = search.toLocaleLowerCase("tr-TR").trim();
  const filteredServices = services.filter((service) =>
    [service.name, service.gender]
      .filter(Boolean)
      .some((value) =>
        String(value).toLocaleLowerCase("tr-TR").includes(normalizedSearch),
      ),
  );
  const isDuration = mode === "duration";

  return (
    <section className="rounded bg-white p-4 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-700">
        {isDuration ? "Süreler" : "Fiyatlar"}
      </h1>
      <div className="mt-4 border-y border-slate-200 bg-slate-100 p-3">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Ara"
          className="h-8 max-w-56 bg-white"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-slate-900">
            <tr className="border-b border-slate-200">
              <th className="w-10 px-3 py-3" />
              <th className="w-10 px-3 py-3">
                <input type="checkbox" disabled />
              </th>
              <th className="px-3 py-3">Hizmet</th>
              <th className="px-3 py-3">Hizmet cinsiyeti</th>
              <th className="px-3 py-3">
                {isDuration ? "Hizmet süresi" : "Hizmet fiyatı"}
              </th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredServices.map((service) => (
              <tr key={service.id}>
                <td className="px-3 py-3 text-slate-500">
                  <ChevronRight className="size-4" />
                </td>
                <td className="px-3 py-3">
                  <input type="checkbox" disabled />
                </td>
                <td className="px-3 py-3">{service.name}</td>
                <td className="px-3 py-3">{service.gender}</td>
                <td className="px-3 py-3">
                  {isDuration
                    ? `${service.duration || 0} dakika`
                    : `${formatServicePrice(service)} TL`}
                </td>
                <td className="px-3 py-3 text-right">
                  <Button type="button" className="bg-[#5f86b6] text-white">
                    <Pencil className="size-4" />
                    {isDuration
                      ? "Tüm Personel Sürelerini Düzenle"
                      : "Tüm Personel Fiyatlarını Düzenle"}
                  </Button>
                </td>
              </tr>
            ))}
            {filteredServices.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-10 text-center text-slate-400"
                >
                  Hizmet bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PromotionsSetupPage({
  business,
  saving,
  onUpdateAndSave,
}: {
  business: Business;
  saving: boolean;
  onUpdateAndSave: (fields: Partial<Business>) => Promise<boolean>;
}) {
  const [form, setForm] = useState<PromotionsSettings>(
    business.promotions || {},
  );
  const percentOptions = ["0%", "5%", "10%", "15%", "20%"].map((value) => ({
    value,
    label: value,
  }));
  return (
    <SettingsPanel
      title="Promosyonlar"
      saving={saving}
      onSave={() => onUpdateAndSave({ promotions: form })}
    >
      <SettingsSelect
        label="Nakit ödemelerden % kaç parapuan kazanılsın"
        value={form.cashReward || "0%"}
        options={percentOptions}
        onChange={(value) => setForm({ ...form, cashReward: value })}
      />
      <SettingsSelect
        label="Kartla ödemelerden % kaç parapuan kazanılsın"
        value={form.cardReward || "0%"}
        options={percentOptions}
        onChange={(value) => setForm({ ...form, cardReward: value })}
      />
      <SettingsSelect
        label="Parapuanlar kaç TL'ye ulaşıldığında kullanılsın"
        value={form.rewardUsage || "20 TL"}
        options={["20 TL", "50 TL", "100 TL"].map((value) => ({
          value,
          label: value,
        }))}
        onChange={(value) => setForm({ ...form, rewardUsage: value })}
      />
      <SettingsSelect
        label="Müşteriler doğum günlerinde % kaç indirim kazansın"
        value={form.birthdayDiscount || "0%"}
        options={percentOptions}
        onChange={(value) => setForm({ ...form, birthdayDiscount: value })}
      />
      <SettingsSelect
        label="Kolay Randevu'ya özel % kaç indirim sunmak istersiniz"
        value={form.onlineBookingDiscount || "0%"}
        options={percentOptions}
        onChange={(value) => setForm({ ...form, onlineBookingDiscount: value })}
      />
    </SettingsPanel>
  );
}

function SalonBotSettingsPage({
  business,
  saving,
  onUpdateAndSave,
}: {
  business: Business;
  saving: boolean;
  onUpdateAndSave: (fields: Partial<Business>) => Promise<boolean>;
}) {
  const [form, setForm] = useState<BotSettings>(business.botSettings || {});
  return (
    <SettingsPanel
      title="Salon BOT Ayarları"
      saving={saving}
      onSave={() => onUpdateAndSave({ botSettings: form })}
    >
      <ToggleRow
        label="Instagram Salon BOT Aktif/Pasif"
        description=""
        checked={!!form.instagram}
        onChange={(checked) => setForm({ ...form, instagram: checked })}
      />
      <ToggleRow
        label="WhatsApp Salon BOT Aktif/Pasif"
        description=""
        checked={!!form.whatsapp}
        onChange={(checked) => setForm({ ...form, whatsapp: checked })}
      />
    </SettingsPanel>
  );
}

function BookingSettingsPage({
  business,
  saving,
  onUpdateAndSave,
}: {
  business: Business;
  saving: boolean;
  onUpdateAndSave: (fields: Partial<Business>) => Promise<boolean>;
}) {
  const [form, setForm] = useState<BookingSettings>(
    business.bookingSettings || {},
  );
  const [calendarId, setCalendarId] = useState(business.calendarId || "");
  return (
    <SettingsPanel
      title="Randevu ayarları"
      saving={saving}
      onSave={() =>
        onUpdateAndSave({ bookingSettings: form, calendarId: calendarId.trim() })
      }
    >
      <SettingsSelect
        label="Randevu aralığı"
        value={form.interval || "15 dakikada bir"}
        options={["15 dakikada bir", "30 dakikada bir", "60 dakikada bir"].map(
          (value) => ({ value, label: value }),
        )}
        onChange={(value) => setForm({ ...form, interval: value })}
      />
      <SettingsSelect
        label="Saat formatı"
        value={form.timeFormat || "14:30"}
        options={["14:30", "2:30 PM"].map((value) => ({ value, label: value }))}
        onChange={(value) => setForm({ ...form, timeFormat: value })}
      />
      <SettingsToggle
        label="Randevu iptali"
        checked={!!form.cancellation}
        onChange={(checked) => setForm({ ...form, cancellation: checked })}
      />
      <SettingsToggle
        label="Randevu hatırlatma"
        checked={!!form.reminder}
        onChange={(checked) => setForm({ ...form, reminder: checked })}
      />
      <SettingsToggle
        label="Randevu oluşturuldu bildirimi"
        checked={!!form.createdNotification}
        onChange={(checked) =>
          setForm({ ...form, createdNotification: checked })
        }
      />
      <SettingsToggle
        label="Otomatik yeni paket kullanımı penceresi"
        checked={!!form.packageWindow}
        onChange={(checked) => setForm({ ...form, packageWindow: checked })}
      />
      <SettingsToggle
        label="Otomatik bekleme listesi penceresi"
        checked={!!form.waitingListWindow}
        onChange={(checked) => setForm({ ...form, waitingListWindow: checked })}
      />
      <SettingsToggle
        label="Google online randevu"
        checked={!!form.googleOnlineBooking}
        onChange={(checked) =>
          setForm({ ...form, googleOnlineBooking: checked })
        }
      />
      <GoogleCalendarIntegrationPanel
        calendarId={calendarId}
        saving={saving}
        showSave={false}
        onEmailChange={setCalendarId}
      />
    </SettingsPanel>
  );
}

function SetupGeneralForm({
  business,
  saving,
  onChange,
  onSave,
}: {
  business: Business;
  saving: boolean;
  onChange: <K extends keyof Business>(field: K, value: Business[K]) => void;
  onSave: () => void;
}) {
  return (
    <section className="rounded bg-white p-4 shadow-sm">
      <h1 className="mb-4 text-2xl font-semibold text-slate-700">
        Temel ayarlar
      </h1>
      <div className="grid gap-3">
        <Input
          value={business.name}
          onChange={(event) => onChange("name", event.target.value)}
          placeholder="İşletme adı"
        />
        <Input
          value={business.address || ""}
          onChange={(event) => onChange("address", event.target.value)}
          placeholder="Adres"
        />
        <Input
          type="email"
          value={business.email || ""}
          onChange={(event) => onChange("email", event.target.value)}
          placeholder="E-posta"
        />
        <Input
          value={business.type}
          onChange={(event) => onChange("type", event.target.value)}
          placeholder="Kategori"
        />
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            value={business.city || ""}
            onChange={(event) => onChange("city", event.target.value)}
            placeholder="İl"
          />
          <Input
            value={business.district || ""}
            onChange={(event) => onChange("district", event.target.value)}
            placeholder="İlçe"
          />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            value={business.phone || ""}
            onChange={(event) => onChange("phone", event.target.value)}
            placeholder="Telefon"
          />
          <Input
            value={business.website || ""}
            onChange={(event) => onChange("website", event.target.value)}
            placeholder="Web sitesi"
          />
        </div>
        <Textarea
          value={business.menu_or_services || ""}
          onChange={(event) => onChange("menu_or_services", event.target.value)}
          placeholder="Hizmetler / menü"
          rows={5}
        />
        <div className="grid gap-3 md:grid-cols-2">
          <Textarea
            value={business.welcome_message || ""}
            onChange={(event) =>
              onChange("welcome_message", event.target.value)
            }
            placeholder="Karşılama mesajı"
            rows={3}
          />
          <Textarea
            value={business.special_instructions || ""}
            onChange={(event) =>
              onChange("special_instructions", event.target.value)
            }
            placeholder="Özel talimatlar"
            rows={3}
          />
        </div>
        <Button
          type="button"
          disabled={saving}
          onClick={onSave}
          className="h-8 bg-[#5f86b6] text-white"
        >
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </Button>
      </div>
    </section>
  );
}

function WorkingHoursForm({
  business,
  saving,
  onHourChange,
  onSave,
}: {
  business: Business;
  saving: boolean;
  onHourChange: (dayKey: string, value: string, field: "start" | "end") => void;
  onSave: () => void;
}) {
  return (
    <section className="rounded bg-white p-5 shadow-sm">
      <h1 className="mb-4 text-2xl font-semibold text-slate-700">
        Çalışma saatleri
      </h1>
      <div className="space-y-2">
        {DAYS.map((day) => {
          const parsed = parseHourValue(business.hours[day.key]);
          return (
            <div
              key={day.key}
              className="grid items-center gap-3 border-b border-slate-200 pb-2 md:grid-cols-[130px_1fr_1fr_1fr]"
            >
              <div className="text-sm font-medium text-slate-600">
                {day.short}
              </div>
              <NativeSelect
                value={parsed.status}
                onChange={(value) =>
                  onHourChange(
                    day.key,
                    formatHourValue(value, parsed.start, parsed.end),
                    "start",
                  )
                }
                options={[
                  { value: "Açık", label: "Açık" },
                  { value: "Kapalı", label: "Kapalı" },
                ]}
              />
              <NativeSelect
                value={parsed.start}
                disabled={parsed.status === "Kapalı"}
                onChange={(value) =>
                  onHourChange(
                    day.key,
                    formatHourValue(parsed.status, value, parsed.end),
                    "start",
                  )
                }
                options={TIME_OPTIONS.map((time) => ({
                  value: time,
                  label: time,
                }))}
              />
              <NativeSelect
                value={parsed.end}
                disabled={parsed.status === "Kapalı"}
                onChange={(value) =>
                  onHourChange(
                    day.key,
                    formatHourValue(parsed.status, parsed.start, value),
                    "end",
                  )
                }
                options={TIME_OPTIONS.map((time) => ({
                  value: time,
                  label: time,
                }))}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-5 rounded border border-slate-200 p-2">
        <Button type="button" variant="outline">
          <Plus className="size-4" />
          Öğle arası mola saatleri
        </Button>
      </div>
      <Button
        type="button"
        disabled={saving}
        onClick={onSave}
        className="mt-4 h-8 w-full bg-[#5f86b6] text-white"
      >
        {saving ? "Kaydediliyor..." : "Kaydet"}
      </Button>
    </section>
  );
}

function ConnectionsPanel({
  business,
  saving,
  whatsAppStatus,
  qrCodeBase64,
  onUpdateAndSave,
  onTogglePatch,
  onReconnectWhatsApp,
}: {
  business: Business;
  saving: boolean;
  whatsAppStatus: string | null;
  qrCodeBase64: string | null;
  onChange: <K extends keyof Business>(field: K, value: Business[K]) => void;
  onSave: () => void;
  onUpdateAndSave: (fields: Partial<Business>) => Promise<boolean>;
  onTogglePatch: (field: "is_active" | "test_mode", value: boolean) => void;
  onReconnectWhatsApp: () => void;
}) {
  const whatsAppConnected =
    whatsAppStatus === "open" || whatsAppStatus === "connected";
  return (
    <section className="rounded bg-white p-4 shadow-sm">
      <h1 className="mb-8 text-2xl font-semibold text-slate-700">
        Bağlantılar / Entegrasyonlar
      </h1>
      <div className="divide-y divide-slate-200">
        <ConnectionRow
          label="Instagram"
          icon={MessageCircle}
          connected={!!business.instagram_page_id}
        />
        <ConnectionRow
          label="WhatsApp"
          icon={MessageCircle}
          connected={whatsAppConnected}
          actionLabel="Giriş yap"
          disabled={saving || !business.slug}
          onAction={onReconnectWhatsApp}
        />
      </div>
      <GoogleCalendarIntegrationPanel
        calendarId={business.calendarId || ""}
        saving={saving}
        onSave={(calendarId) => onUpdateAndSave({ calendarId })}
      />
      <div className="mt-5 rounded border border-slate-200 p-3">
        <ToggleRow
          label="Test modu"
          description="Açıkken bot yalnızca işletme telefonundan gelen test mesajlarına yanıt verir."
          checked={business.test_mode}
          onChange={(value) => onTogglePatch("test_mode", value)}
        />
      </div>
      {qrCodeBase64 && (
        <div className="mt-4 inline-flex rounded border border-slate-200 bg-white p-3">
          <img
            src={
              qrCodeBase64.startsWith("data:")
                ? qrCodeBase64
                : `data:image/png;base64,${qrCodeBase64}`
            }
            alt="WhatsApp QR kodu"
            className="size-44"
          />
        </div>
      )}
    </section>
  );
}

function GoogleCalendarIntegrationPanel({
  calendarId,
  saving,
  onSave,
  showSave = true,
  onEmailChange,
}: {
  calendarId: string;
  saving: boolean;
  onSave?: (calendarId: string) => Promise<boolean> | void;
  showSave?: boolean;
  onEmailChange?: (calendarId: string) => void;
}) {
  const [calendarEmail, setCalendarEmail] = useState(calendarId);
  const [copied, setCopied] = useState(false);

  async function copyServiceEmail() {
    try {
      await navigator.clipboard.writeText(GOOGLE_SERVICE_ACCOUNT_EMAIL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="mt-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">
        Google Takvim Entegrasyonu
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Takvim sahibinin e-posta adresini girin.{" "}
        <strong>Aşağıdaki açıklamayı okuyun.</strong>
      </p>

      <div className="mt-5 space-y-1 text-sm leading-6 text-slate-700">
        <p>Takvimi bağlamak için:</p>
        <p>1. Google Takvim → Sol menüde takvimin yanındaki 3 nokta</p>
        <p>2. "Ayarlar ve Paylaşım" menüsünü seçin</p>
        <p>
          3. "Şunlarla paylaşıldı:" kısmına şu Google servis hesabı e-postasını
          ekleyin:
        </p>
        <div className="inline-flex max-w-full items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 font-mono text-xs shadow-sm">
          <span className="break-all">{GOOGLE_SERVICE_ACCOUNT_EMAIL}</span>
          <button
            type="button"
            onClick={copyServiceEmail}
            className="shrink-0 font-sans text-xs font-semibold text-blue-700 hover:text-blue-900"
          >
            {copied ? "Kopyalandı" : "Kopyala"}
          </button>
        </div>
        <p>4. Rol olarak "Editor" seçin ve kaydedin.</p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-[200px_1fr_auto] md:items-center">
        <label
          htmlFor="calendar-email"
          className="text-sm font-semibold text-slate-900"
        >
          Takvimin bağlı olduğu e-posta
        </label>
        <Input
          id="calendar-email"
          value={calendarEmail}
          onChange={(event) => {
            setCalendarEmail(event.target.value);
            onEmailChange?.(event.target.value);
          }}
          placeholder="örnek@domain.com"
          className="h-10"
        />
        {showSave && (
          <Button
            type="button"
            disabled={saving}
            onClick={() => onSave?.(calendarEmail.trim())}
            className="h-10 bg-slate-900 px-5 text-white hover:bg-slate-800"
          >
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        )}
      </div>
    </section>
  );
}

function ConnectionRow({
  label,
  icon: Icon,
  connected,
  actionLabel,
  disabled,
  onAction,
}: {
  label: string;
  icon: LucideIcon;
  connected: boolean;
  actionLabel?: string;
  disabled?: boolean;
  onAction?: () => void;
}) {
  return (
    <div className="grid items-center gap-4 px-3 py-3 text-sm md:grid-cols-[1fr_180px]">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-[#5f86b6]" />
        {label}
      </div>
      <Button
        type="button"
        disabled={disabled}
        onClick={onAction}
        className={
          connected ? "bg-red-600 text-white" : "bg-[#24a647] text-white"
        }
      >
        {connected ? "Bağlantıyı Kes" : actionLabel || "Giriş yap"}
      </Button>
    </div>
  );
}
