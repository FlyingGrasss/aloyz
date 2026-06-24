"use client";

import type React from "react";
import { useEffect, useState } from "react";
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
import { SetupExtraPage } from "./setup-extra";

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
  onDisconnectWhatsApp,
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
  onDisconnectWhatsApp: () => void;
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
              onUpdateAndSave={onUpdateAndSave}
            />
          )}
          {view === "setup/connections" && (
            <ConnectionsPanel
              business={business}
              saving={saving}
              whatsAppStatus={whatsAppStatus}
              onChange={onChange}
              onSave={onSave}
              onUpdateAndSave={onUpdateAndSave}
              onDisconnectWhatsApp={onDisconnectWhatsApp}
              onSelectView={onSelectView}
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
              saving={saving}
              onUpdateAndSave={onUpdateAndSave}
            />
          )}
          {view === "setup/service_prices" && (
            <ServiceAttributePage
              mode="price"
              services={business.services || []}
              saving={saving}
              onUpdateAndSave={onUpdateAndSave}
            />
          )}
          {view === "setup/salon-bot-settings" && (
            <SalonBotSettingsPage
              business={business}
              saving={saving}
              whatsAppStatus={whatsAppStatus}
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
          {(view === "setup/special-working-hours" ||
            view === "setup/products" ||
            view === "setup/service_packages" ||
            view === "setup/tag_settings") && (
            <SetupExtraPage
              view={view}
              business={business}
              saving={saving}
              onUpdateAndSave={onUpdateAndSave}
            />
          )}
          {view !== "setup/general" &&
            view !== "setup/working-hours" &&
            view !== "setup/special-working-hours" &&
            view !== "setup/connections" &&
            view !== "setup/staff" &&
            view !== "setup/services" &&
            view !== "setup/service_durations" &&
            view !== "setup/service_prices" &&
            view !== "setup/products" &&
            view !== "setup/service_packages" &&
            view !== "setup/salon-bot-settings" &&
            view !== "setup/booking_settings" &&
            view !== "setup/tag_settings" && (
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
  const [staffPanel, setStaffPanel] = useState<
    "hours" | "breaks" | "commission" | null
  >(null);
  const staffBreaks = form.breakHours || [];
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
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setStaffPanel(staffPanel === "hours" ? null : "hours")
            }
          >
            <Plus className="size-4" /> Çalışma saatleri
          </Button>
          {staffPanel === "hours" && (
            <div className="rounded border border-slate-200 p-3">
              <div className="mb-2 text-sm font-semibold">Çalışma saatleri</div>
              <div className="grid gap-2">
                {DAYS.map((day) => {
                  const value =
                    form.workingHours?.[day.key] || "Açık: 09:00 - 18:00";
                  const parsed = parseHourValue(value);
                  return (
                    <div
                      key={day.key}
                      className="grid items-center gap-2 md:grid-cols-[72px_1fr_1fr_1fr]"
                    >
                      <span className="text-sm font-medium">{day.short}</span>
                      <NativeSelect
                        value={parsed.status}
                        onChange={(status) =>
                          setForm({
                            ...form,
                            workingHours: {
                              ...(form.workingHours || {}),
                              [day.key]: formatHourValue(
                                status,
                                parsed.start,
                                parsed.end,
                              ),
                            },
                          })
                        }
                        options={[
                          { value: "Açık", label: "Açık" },
                          { value: "Kapalı", label: "Kapalı" },
                        ]}
                      />
                      <NativeSelect
                        value={parsed.start}
                        disabled={parsed.status === "Kapalı"}
                        onChange={(start) =>
                          setForm({
                            ...form,
                            workingHours: {
                              ...(form.workingHours || {}),
                              [day.key]: formatHourValue(
                                parsed.status,
                                start,
                                parsed.end,
                              ),
                            },
                          })
                        }
                        options={TIME_OPTIONS.map((time) => ({
                          value: time,
                          label: time,
                        }))}
                      />
                      <NativeSelect
                        value={parsed.end}
                        disabled={parsed.status === "Kapalı"}
                        onChange={(end) =>
                          setForm({
                            ...form,
                            workingHours: {
                              ...(form.workingHours || {}),
                              [day.key]: formatHourValue(
                                parsed.status,
                                parsed.start,
                                end,
                              ),
                            },
                          })
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
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setStaffPanel(staffPanel === "breaks" ? null : "breaks")
            }
          >
            <Plus className="size-4" /> Öğle arası mola saatleri
          </Button>
          {staffPanel === "breaks" && (
            <div className="rounded border border-slate-200 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold">Mola saatleri</span>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setForm({
                      ...form,
                      breakHours: [
                        ...staffBreaks,
                        {
                          id: crypto.randomUUID(),
                          label: "Öğle arası",
                          start: "12:00",
                          end: "13:00",
                          days: DAYS.map((day) => day.key),
                        },
                      ],
                    })
                  }
                >
                  Ekle
                </Button>
              </div>
              <div className="grid gap-2">
                {staffBreaks.map((item) => (
                  <div
                    key={item.id}
                    className="grid gap-2 md:grid-cols-[1fr_120px_120px_auto]"
                  >
                    <Input
                      value={item.label}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          breakHours: staffBreaks.map((breakHour) =>
                            breakHour.id === item.id
                              ? { ...breakHour, label: event.target.value }
                              : breakHour,
                          ),
                        })
                      }
                    />
                    <NativeSelect
                      value={item.start}
                      onChange={(start) =>
                        setForm({
                          ...form,
                          breakHours: staffBreaks.map((breakHour) =>
                            breakHour.id === item.id
                              ? { ...breakHour, start }
                              : breakHour,
                          ),
                        })
                      }
                      options={TIME_OPTIONS.map((time) => ({
                        value: time,
                        label: time,
                      }))}
                    />
                    <NativeSelect
                      value={item.end}
                      onChange={(end) =>
                        setForm({
                          ...form,
                          breakHours: staffBreaks.map((breakHour) =>
                            breakHour.id === item.id
                              ? { ...breakHour, end }
                              : breakHour,
                          ),
                        })
                      }
                      options={TIME_OPTIONS.map((time) => ({
                        value: time,
                        label: time,
                      }))}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() =>
                        setForm({
                          ...form,
                          breakHours: staffBreaks.filter(
                            (breakHour) => breakHour.id !== item.id,
                          ),
                        })
                      }
                    >
                      Sil
                    </Button>
                  </div>
                ))}
                {staffBreaks.length === 0 && (
                  <div className="py-3 text-sm text-slate-400">
                    Mola saati eklenmedi.
                  </div>
                )}
              </div>
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setStaffPanel(staffPanel === "commission" ? null : "commission")
            }
          >
            <Plus className="size-4" /> Hak ediş ayarları
          </Button>
          {staffPanel === "commission" && (
            <div className="grid gap-2 rounded border border-slate-200 p-3">
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                Hak ediş oranı (%)
                <Input
                  value={String(form.commissionRate || 0)}
                  inputMode="decimal"
                  onChange={(event) =>
                    setForm({
                      ...form,
                      commissionRate: parseLooseNumber(event.target.value),
                    })
                  }
                />
              </label>
              <Input
                value={form.commissionNotes || ""}
                onChange={(event) =>
                  setForm({ ...form, commissionNotes: event.target.value })
                }
                placeholder="Hak ediş notları"
              />
            </div>
          )}
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
  const [search, setSearch] = useState("");
  const linked = services
    .filter((service) => service.staffIds.includes(member.id))
    .filter((service) =>
      service.name
        .toLocaleLowerCase("tr-TR")
        .includes(search.trim().toLocaleLowerCase("tr-TR")),
    );
  return (
    <div className="fixed inset-0 z-50 grid place-items-start bg-slate-950/35 p-6">
      <section className="mx-auto mt-4 w-full max-w-2xl rounded bg-white shadow-xl">
        <ModalHeader title="Çalışan hizmetleri" onClose={onClose} />
        <div className="space-y-3 p-4">
          <div className="flex gap-3 bg-slate-100 p-3">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Ara"
            />
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
          <p className="text-xs text-slate-500">
            Hizmet atamaları Hizmetler sayfasındaki personel seçimlerinden
            yönetilir.
          </p>
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
  saving,
  onUpdateAndSave,
}: {
  mode: "duration" | "price";
  services: ServiceItem[];
  saving: boolean;
  onUpdateAndSave: (fields: Partial<Business>) => Promise<boolean>;
}) {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<ServiceItem | null>(null);
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
                  <Button
                    type="button"
                    className="bg-[#5f86b6] text-white"
                    onClick={() => setEditing(service)}
                  >
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
      {editing && (
        <ServiceAttributeModal
          mode={mode}
          service={editing}
          saving={saving}
          onClose={() => setEditing(null)}
          onSubmit={async (service) => {
            setEditing(null);
            await onUpdateAndSave({
              services: services.map((item) =>
                item.id === service.id ? service : item,
              ),
            });
          }}
        />
      )}
    </section>
  );
}

function ServiceAttributeModal({
  mode,
  service,
  saving,
  onClose,
  onSubmit,
}: {
  mode: "duration" | "price";
  service: ServiceItem;
  saving: boolean;
  onClose: () => void;
  onSubmit: (service: ServiceItem) => void;
}) {
  const isDuration = mode === "duration";
  const [duration, setDuration] = useState(String(service.duration || 0));
  const [price, setPrice] = useState(
    String(
      service.priceType === "range"
        ? service.minPrice || 0
        : service.price || 0,
    ),
  );
  return (
    <div className="fixed inset-0 z-50 grid place-items-start bg-slate-950/35 p-6">
      <section className="mx-auto mt-4 w-full max-w-md rounded bg-white shadow-xl">
        <ModalHeader
          title={isDuration ? "Hizmet süresi" : "Hizmet fiyatı"}
          onClose={onClose}
        />
        <div className="grid gap-3 p-4">
          <div className="font-semibold">{service.name}</div>
          {isDuration ? (
            <Input
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              inputMode="decimal"
              placeholder="Dakika"
            />
          ) : (
            <Input
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              inputMode="decimal"
              placeholder="TL"
            />
          )}
          <Button
            type="button"
            disabled={saving}
            onClick={() =>
              onSubmit(
                isDuration
                  ? { ...service, duration: parseLooseNumber(duration) }
                  : {
                      ...service,
                      priceType: "single",
                      price: parseLooseNumber(price),
                      minPrice: 0,
                      maxPrice: 0,
                    },
              )
            }
            className="bg-[#5f86b6] text-white"
          >
            Kaydet
          </Button>
        </div>
      </section>
    </div>
  );
}

const aiReadableInputClass =
  "border-emerald-300 bg-emerald-50/40 focus-visible:ring-emerald-500";

function AiReadableBadge() {
  return (
    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
      Bot okuyabilir
    </span>
  );
}

function AiReadableNotice() {
  return (
    <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
      Yeşil işaretli alanlar Bot tarafından cevap üretirken okunabilir.
    </div>
  );
}

function AiReadableField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1 text-sm font-semibold text-slate-700">
      <span className="flex items-center gap-2">
        {label} <AiReadableBadge />
      </span>
      {children}
    </label>
  );
}

function SalonBotSettingsPage({
  business,
  saving,
  whatsAppStatus,
  onUpdateAndSave,
}: {
  business: Business;
  saving: boolean;
  whatsAppStatus: string | null;
  onUpdateAndSave: (fields: Partial<Business>) => Promise<boolean>;
}) {
  const [form, setForm] = useState<BotSettings>(business.botSettings || {});
  const [active, setActive] = useState(business.is_active);
  const [testMode, setTestMode] = useState(business.test_mode);
  const [menuOrServices, setMenuOrServices] = useState(
    business.menu_or_services || "",
  );
  const [welcomeMessage, setWelcomeMessage] = useState(
    business.welcome_message || "",
  );
  const [specialInstructions, setSpecialInstructions] = useState(
    business.special_instructions || "",
  );
  const [faqs, setFaqs] = useState(
    Array.isArray(business.faqs) ? business.faqs : [],
  );
  const whatsAppConnected =
    whatsAppStatus === "open" ||
    whatsAppStatus === "connected" ||
    !!form.whatsappConnected;
  const instagramConnected =
    !!business.instagram_page_id || !!form.instagramConnected;
  return (
    <SettingsPanel
      title="Bot Ayarları"
      saving={saving}
      onSave={() =>
        onUpdateAndSave({
          botSettings: {
            ...form,
            whatsappConnected: whatsAppConnected,
            instagramConnected,
            active,
          },
          is_active: active,
          test_mode: testMode,
          menu_or_services: menuOrServices,
          welcome_message: welcomeMessage,
          special_instructions: specialInstructions,
          faqs,
        })
      }
    >
      <AiReadableNotice />
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded border border-slate-200 p-3">
          <div className="text-sm font-semibold">WhatsApp bağlantısı</div>
          <div className="mt-1 text-sm text-slate-500">
            {whatsAppConnected ? "Bağlı" : "Bağlı değil"}
          </div>
        </div>
        <div className="rounded border border-slate-200 p-3">
          <div className="text-sm font-semibold">Instagram bağlantısı</div>
          <div className="mt-1 text-sm text-slate-500">
            {instagramConnected ? "Bağlı" : "Bağlı değil"}
          </div>
        </div>
      </div>
      <ToggleRow
        label="Bot aktif"
        description="Kapalıyken bot bağlı kanallarda otomatik yanıt vermez."
        checked={active}
        onChange={setActive}
      />
      <ToggleRow
        label="Test modu"
        description="Açıkken bot yalnızca işletmenin kendi kendine gönderdiği mesajlara yanıt verir."
        checked={testMode}
        onChange={setTestMode}
      />
      <ToggleRow
        label="Instagram Bot Aktif/Pasif"
        description=""
        checked={!!form.instagram && instagramConnected}
        onChange={(checked) => setForm({ ...form, instagram: checked })}
      />
      <ToggleRow
        label="WhatsApp Bot Aktif/Pasif"
        description=""
        checked={!!form.whatsapp && whatsAppConnected}
        onChange={(checked) => setForm({ ...form, whatsapp: checked })}
      />
      <div className="grid gap-3">
        <label className="grid gap-1 text-sm font-semibold text-slate-700">
          <span className="flex items-center gap-2">
            Hizmetler / menü <AiReadableBadge />
          </span>
          <Textarea
            value={menuOrServices}
            onChange={(event) => setMenuOrServices(event.target.value)}
            rows={5}
            className={aiReadableInputClass}
          />
        </label>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            <span className="flex items-center gap-2">
              Karşılama mesajı <AiReadableBadge />
            </span>
            <Textarea
              value={welcomeMessage}
              onChange={(event) => setWelcomeMessage(event.target.value)}
              rows={3}
              className={aiReadableInputClass}
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            <span className="flex items-center gap-2">
              Özel talimatlar <AiReadableBadge />
            </span>
            <Textarea
              value={specialInstructions}
              onChange={(event) => setSpecialInstructions(event.target.value)}
              rows={3}
              className={aiReadableInputClass}
            />
          </label>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              Sık sorulan sorular <AiReadableBadge />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setFaqs([...faqs, { question: "", answer: "" }])}
            >
              <Plus className="size-4" />
              Yeni soru
            </Button>
          </div>
          <div className="grid gap-3">
            {faqs.map((item, index) => (
              <div
                key={index}
                className="grid gap-2 rounded border border-emerald-200 bg-white p-3 md:grid-cols-[1fr_1fr_auto]"
              >
                <Input
                  value={item.question}
                  onChange={(event) =>
                    setFaqs(
                      faqs.map((faq, faqIndex) =>
                        faqIndex === index
                          ? { ...faq, question: event.target.value }
                          : faq,
                      ),
                    )
                  }
                  placeholder="Soru"
                  className={aiReadableInputClass}
                />
                <Input
                  value={item.answer}
                  onChange={(event) =>
                    setFaqs(
                      faqs.map((faq, faqIndex) =>
                        faqIndex === index
                          ? { ...faq, answer: event.target.value }
                          : faq,
                      ),
                    )
                  }
                  placeholder="Cevap"
                  className={aiReadableInputClass}
                />
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() =>
                    setFaqs(faqs.filter((_, faqIndex) => faqIndex !== index))
                  }
                >
                  Sil
                </Button>
              </div>
            ))}
            {faqs.length === 0 && (
              <div className="rounded border border-dashed border-emerald-200 bg-white px-3 py-6 text-center text-sm text-slate-500">
                Henüz sık sorulan soru eklenmedi.
              </div>
            )}
          </div>
        </div>
      </div>
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
        onUpdateAndSave({
          bookingSettings: form,
          calendarId: calendarId.trim(),
        })
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
      <AiReadableNotice />
      <div className="grid gap-3">
        <AiReadableField label="İşletme adı">
          <Input
            value={business.name}
            onChange={(event) => onChange("name", event.target.value)}
            placeholder="İşletme adı"
            className={aiReadableInputClass}
          />
        </AiReadableField>
        <AiReadableField label="Adres">
          <Input
            value={business.address || ""}
            onChange={(event) => onChange("address", event.target.value)}
            placeholder="Adres"
            className={aiReadableInputClass}
          />
        </AiReadableField>
        <Input
          type="email"
          value={business.email || ""}
          onChange={(event) => onChange("email", event.target.value)}
          placeholder="E-posta"
        />
        <AiReadableField label="Kategori">
          <Input
            value={business.type}
            onChange={(event) => onChange("type", event.target.value)}
            placeholder="Kategori"
            className={aiReadableInputClass}
          />
        </AiReadableField>
        <div className="grid gap-3 md:grid-cols-2">
          <AiReadableField label="İl">
            <Input
              value={business.city || ""}
              onChange={(event) => onChange("city", event.target.value)}
              placeholder="İl"
              className={aiReadableInputClass}
            />
          </AiReadableField>
          <AiReadableField label="İlçe">
            <Input
              value={business.district || ""}
              onChange={(event) => onChange("district", event.target.value)}
              placeholder="İlçe"
              className={aiReadableInputClass}
            />
          </AiReadableField>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <AiReadableField label="Telefon">
            <Input
              value={business.phone || ""}
              onChange={(event) => onChange("phone", event.target.value)}
              placeholder="Telefon"
              className={aiReadableInputClass}
            />
          </AiReadableField>
          <AiReadableField label="Web sitesi">
            <Input
              value={business.website || ""}
              onChange={(event) => onChange("website", event.target.value)}
              placeholder="Web sitesi"
              className={aiReadableInputClass}
            />
          </AiReadableField>
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
  onUpdateAndSave,
}: {
  business: Business;
  saving: boolean;
  onHourChange: (dayKey: string, value: string, field: "start" | "end") => void;
  onSave: () => void;
  onUpdateAndSave?: (fields: Partial<Business>) => Promise<boolean>;
}) {
  const [breaksOpen, setBreaksOpen] = useState(
    () => (business.bookingSettings?.breakHours || []).length > 0,
  );
  const breakHours = business.bookingSettings?.breakHours || [];
  useEffect(() => {
    if (breakHours.length > 0) setBreaksOpen(true);
  }, [breakHours.length]);
  async function saveBreakHours(nextBreakHours: typeof breakHours) {
    if (!onUpdateAndSave) return;
    await onUpdateAndSave({
      bookingSettings: {
        ...(business.bookingSettings || {}),
        breakHours: nextBreakHours,
      },
    });
  }
  return (
    <section className="rounded bg-white p-5 shadow-sm">
      <h1 className="mb-4 text-2xl font-semibold text-slate-700">
        <span className="flex items-center gap-2">
          Çalışma saatleri <AiReadableBadge />
        </span>
      </h1>
      <AiReadableNotice />
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
                className={aiReadableInputClass}
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
                className={aiReadableInputClass}
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
                className={aiReadableInputClass}
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
        <Button
          type="button"
          variant="outline"
          onClick={() => setBreaksOpen((value) => !value)}
        >
          <Plus className="size-4" />
          Öğle arası mola saatleri{breakHours.length ? ` (${breakHours.length})` : ""}
        </Button>
        {breaksOpen && (
          <div className="mt-3 grid gap-2">
            {breakHours.map((item) => (
              <div
                key={item.id}
                className="grid gap-2 md:grid-cols-[1fr_120px_120px_auto]"
              >
                <Input
                  value={item.label}
                  className={aiReadableInputClass}
                  onChange={(event) =>
                    saveBreakHours(
                      breakHours.map((breakHour) =>
                        breakHour.id === item.id
                          ? { ...breakHour, label: event.target.value }
                          : breakHour,
                      ),
                    )
                  }
                />
                <NativeSelect
                  value={item.start}
                  className={aiReadableInputClass}
                  onChange={(start) =>
                    saveBreakHours(
                      breakHours.map((breakHour) =>
                        breakHour.id === item.id
                          ? { ...breakHour, start }
                          : breakHour,
                      ),
                    )
                  }
                  options={TIME_OPTIONS.map((time) => ({
                    value: time,
                    label: time,
                  }))}
                />
                <NativeSelect
                  value={item.end}
                  className={aiReadableInputClass}
                  onChange={(end) =>
                    saveBreakHours(
                      breakHours.map((breakHour) =>
                        breakHour.id === item.id
                          ? { ...breakHour, end }
                          : breakHour,
                      ),
                    )
                  }
                  options={TIME_OPTIONS.map((time) => ({
                    value: time,
                    label: time,
                  }))}
                />
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() =>
                    saveBreakHours(
                      breakHours.filter(
                        (breakHour) => breakHour.id !== item.id,
                      ),
                    )
                  }
                >
                  Sil
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              disabled={!onUpdateAndSave}
              onClick={() => {
                setBreaksOpen(true);
                saveBreakHours([
                  ...breakHours,
                  {
                    id: crypto.randomUUID(),
                    label: "Öğle arası",
                    start: "12:00",
                    end: "13:00",
                    days: DAYS.map((day) => day.key),
                  },
                ]);
              }}
            >
              Mola saati ekle
            </Button>
          </div>
        )}
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
  onUpdateAndSave,
  onDisconnectWhatsApp,
  onSelectView,
}: {
  business: Business;
  saving: boolean;
  whatsAppStatus: string | null;
  onChange: <K extends keyof Business>(field: K, value: Business[K]) => void;
  onSave: () => void;
  onUpdateAndSave: (fields: Partial<Business>) => Promise<boolean>;
  onDisconnectWhatsApp: () => void;
  onSelectView: (view: ViewId) => void;
}) {
  const whatsAppConnected =
    whatsAppStatus === "open" ||
    whatsAppStatus === "connected" ||
    !!business.botSettings?.whatsappConnected;
  const instagramConnected =
    !!business.instagram_page_id || !!business.botSettings?.instagramConnected;

  async function disconnectInstagram() {
    const res = await fetch("/api/integrations/instagram/disconnect", {
      method: "POST",
    });
    if (res.ok) {
      await onUpdateAndSave({
        botSettings: {
          ...(business.botSettings || {}),
          instagramConnected: false,
          instagram: false,
          instagramUsername: "",
          instagramProfilePicture: "",
        },
      });
    }
  }

  return (
    <section className="rounded bg-white p-4 shadow-sm">
      <h1 className="mb-8 text-2xl font-semibold text-slate-700">
        Bağlantılar / Entegrasyonlar
      </h1>
      <div className="divide-y divide-slate-200">
        <ConnectionRow
          label="Instagram"
          icon={MessageCircle}
          connected={instagramConnected}
          actionLabel="Giriş yap"
          disabled={saving}
          onAction={
            instagramConnected
              ? disconnectInstagram
              : () => onSelectView("messaging/instagram/setup")
          }
        />
        {instagramConnected && business.botSettings?.instagramUsername && (
          <div className="flex items-center gap-3 px-3 py-3 text-sm">
            {business.botSettings.instagramProfilePicture && (
              <img
                src={business.botSettings.instagramProfilePicture}
                alt=""
                className="size-9 rounded-full"
              />
            )}
            <div>
              <div className="font-semibold">
                @{business.botSettings.instagramUsername}
              </div>
              <div className="text-xs text-slate-500">
                Instagram profesyonel hesabı bağlı
              </div>
            </div>
          </div>
        )}
        <ConnectionRow
          label="WhatsApp"
          icon={MessageCircle}
          connected={whatsAppConnected}
          actionLabel="Giriş yap"
          disabled={saving || !business.slug}
          onAction={
            whatsAppConnected
              ? onDisconnectWhatsApp
              : () => onSelectView("messaging/whatsapp/register")
          }
        />
      </div>
      <GoogleCalendarIntegrationPanel
        calendarId={business.calendarId || ""}
        saving={saving}
        onSave={(calendarId) => onUpdateAndSave({ calendarId })}
        onDisconnect={() => onUpdateAndSave({ calendarId: "" })}
      />
    </section>
  );
}
function GoogleCalendarIntegrationPanel({
  calendarId,
  saving,
  onSave,
  onDisconnect,
  showSave = true,
  onEmailChange,
}: {
  calendarId: string;
  saving: boolean;
  onSave?: (calendarId: string) => Promise<boolean> | void;
  onDisconnect?: () => Promise<boolean> | void;
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
      {calendarId && (
        <div className="mt-2 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          Bağlı ve senkronize: {calendarId}
        </div>
      )}
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

      <div className="mt-5 grid gap-3 md:grid-cols-[200px_1fr_auto_auto] md:items-center">
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
        {showSave && calendarId && (
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={() => onDisconnect?.()}
            className="h-10"
          >
            Bağlantıyı kes
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
