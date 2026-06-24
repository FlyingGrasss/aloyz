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

import { CustomerModal } from "./customers";
import { CustomerPicker, CustomerSelection } from "./customer-picker";

export function CheckoutsPage({
  business,
  contacts,
  saving,
  onUpdateAndSave,
}: {
  business: Business;
  contacts: ContactRow[];
  saving: boolean;
  onUpdateAndSave: (fields: Partial<Business>) => Promise<boolean>;
}) {
  const [modal, setModal] = useState<"checkout" | "customer" | null>(null);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerId, setNewCustomerId] = useState<string | undefined>();
  const [selectedCheckout, setSelectedCheckout] = useState<CheckoutItem | null>(
    null,
  );
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("Tümü");
  const [dateFilter, setDateFilter] = useState("Tümü");
  const [sortDesc, setSortDesc] = useState(true);
  const checkouts = business.checkouts || [];
  const filteredCheckouts = filterByPeriod(
    checkouts.filter((checkout) =>
      statusFilter === "Tümü" ? true : checkout.status === statusFilter,
    ),
    dateFilter,
    (checkout) => checkout.date,
  ).sort((a, b) => {
    const aValue = `${a.date}T${a.hour}:${a.minute}:00`;
    const bValue = `${b.date}T${b.hour}:${b.minute}:00`;
    return sortDesc
      ? bValue.localeCompare(aValue)
      : aValue.localeCompare(bValue);
  });

  async function createCheckout(checkout: CheckoutItem) {
    setModal(null);
    onUpdateAndSave({ checkouts: [checkout, ...checkouts] });
    syncCheckoutToGoogleCalendar(business, checkout);
  }

  async function createCustomer(customer: CustomerProfile) {
    setNewCustomerName(customer.name);
    setNewCustomerId(customer.id);
    setModal("checkout");
    onUpdateAndSave({
      customers: [customer, ...(business.customers || [])],
    });
  }

  async function updateCheckout(checkout: CheckoutItem) {
    await onUpdateAndSave({
      checkouts: checkouts.map((item) =>
        item.id === checkout.id ? checkout : item,
      ),
    });
  }

  if (selectedCheckout) {
    return (
      <CheckoutDetailsPage
        checkout={selectedCheckout}
        business={business}
        saving={saving}
        onSave={async (checkout) => {
          const next = checkouts.map((item) =>
            item.id === checkout.id ? checkout : item,
          );
          setSelectedCheckout(checkout);
          await onUpdateAndSave({ checkouts: next });
          syncCheckoutToGoogleCalendar(business, checkout);
        }}
        onBack={() => setSelectedCheckout(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          { label: "Aloyz", view: "dashboard" },
          { label: "Adisyonlar", view: "visit/list" },
        ]}
      />
      <section className="rounded bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold text-slate-700">
            Adisyonlar ({checkouts.length})
          </h1>
          <div className="flex gap-3">
            <NativeSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "Tümü", label: "Tümü" },
                { value: "Açık", label: "Açık" },
                { value: "Kapalı", label: "Kapalı" },
                { value: "İptal", label: "İptal" },
              ]}
            />
            <NativeSelect
              value={dateFilter}
              onChange={setDateFilter}
              options={[
                { value: "Tümü", label: "Tümü" },
                { value: "Bugün", label: "Bugün" },
                { value: "Bu ay", label: "Bu ay" },
              ]}
            />
            <Button
              type="button"
              onClick={() => setModal("checkout")}
              className="bg-[#24a647] text-white"
            >
              <Plus className="size-4" />
              Yeni
            </Button>
          </div>
        </div>
        <div className="mt-4 bg-slate-100 p-3">
          <Button
            type="button"
            className="bg-[#5f86b6] text-white"
            onClick={() => setSortDesc((value) => !value)}
          >
            Filtrele / Sırala
          </Button>
        </div>
        <div className="overflow-visible">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs text-slate-600">
              <tr>
                <th className="px-3 py-3">Durum</th>
                <th className="px-3 py-3">Müşteri</th>
                <th className="px-3 py-3">Hizmetler</th>
                <th className="px-3 py-3">Tarih</th>
                <th className="px-3 py-3">Saat</th>
                <th className="px-3 py-3">Geldi mi</th>
                <th className="px-3 py-3">Toplam tutar</th>
                <th className="px-3 py-3">İndirim</th>
                <th className="px-3 py-3">Ödenen tutar</th>
                <th className="px-3 py-3">Kalan ödeme</th>
                <th className="px-3 py-3">Oluşturulma</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCheckouts.map((checkout) => {
                const lines = getCheckoutLines(checkout);
                const serviceNames = lines
                  .map((line) => {
                    const service = (business.services || []).find(
                      (item) => item.id === line.serviceId,
                    );
                    return service?.name;
                  })
                  .filter(Boolean)
                  .join(", ");
                const total = Math.max(0, checkout.amount - checkout.discount);
                const paid = (checkout.payments || []).reduce(
                  (sum, payment) => sum + payment.amount,
                  0,
                );
                return (
                  <tr key={checkout.id}>
                    <td className="px-3 py-3">{checkout.status}</td>
                    <td className="px-3 py-3 font-medium">
                      {checkout.customerName}
                    </td>
                    <td className="px-3 py-3">{serviceNames || "-"}</td>
                    <td className="px-3 py-3">
                      {formatInputDate(checkout.date)}
                    </td>
                    <td className="px-3 py-3">
                      {checkout.hour}:{checkout.minute}
                    </td>
                    <td className="px-3 py-3">
                      {checkout.attendance || "Belirtilmemiş"}
                    </td>
                    <td className="px-3 py-3">{checkout.amount} TL</td>
                    <td className="px-3 py-3">{checkout.discount} TL</td>
                    <td className="px-3 py-3">{paid} TL</td>
                    <td className="px-3 py-3">
                      {Math.max(0, total - paid)} TL
                    </td>
                    <td className="px-3 py-3">
                      {formatLastUpdate(checkout.createdAt)}
                    </td>
                    <td className="relative px-3 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setSelectedCheckout(checkout)}
                        >
                          Detay
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          onClick={() =>
                            setOpenActionMenu(
                              openActionMenu === checkout.id
                                ? null
                                : checkout.id,
                            )
                          }
                        >
                          <ChevronDown className="size-4" />
                        </Button>
                      </div>
                      {openActionMenu === checkout.id && (
                        <div className="absolute right-3 top-11 z-50 w-44 rounded border border-slate-200 bg-white py-1 text-sm shadow-lg">
                          <button
                            type="button"
                            className="block w-full px-3 py-2 text-left hover:bg-slate-50"
                            onClick={() => {
                              updateCheckout({ ...checkout, status: "Kapalı" });
                              setOpenActionMenu(null);
                            }}
                          >
                            Tahsilatsız kapat
                          </button>
                          <button
                            type="button"
                            className="block w-full px-3 py-2 text-left text-red-600 hover:bg-slate-50"
                            onClick={() => {
                              updateCheckout({ ...checkout, status: "İptal" });
                              setOpenActionMenu(null);
                            }}
                          >
                            İptal et
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredCheckouts.length === 0 && (
                <tr>
                  <td
                    colSpan={12}
                    className="px-3 py-10 text-center text-slate-400"
                  >
                    Adisyon kaydı yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-3 bg-slate-100 px-3 py-2 text-sm font-semibold">
          Toplam kayıt sayısı: {filteredCheckouts.length}
        </div>
      </section>
      {modal === "checkout" && (
        <CheckoutModal
          business={business}
          contacts={contacts}
          saving={saving}
          initialCustomerName={newCustomerName}
          initialCustomerId={newCustomerId}
          onClose={() => setModal(null)}
          onCreateCustomer={(name) => {
            setNewCustomerName(name);
            setNewCustomerId(undefined);
            setModal("customer");
          }}
          onSubmit={createCheckout}
        />
      )}
      {modal === "customer" && (
        <CustomerModal
          saving={saving}
          initialName={newCustomerName}
          onClose={() => setModal("checkout")}
          onSubmit={createCustomer}
        />
      )}
    </div>
  );
}

export function CheckoutModal({
  business,
  contacts,
  saving,
  initialDate,
  initialCustomerName,
  initialCustomerId,
  onClose,
  onCreateCustomer,
  onSubmit,
}: {
  business: Business;
  contacts: ContactRow[];
  saving: boolean;
  initialDate?: string;
  initialCustomerName?: string;
  initialCustomerId?: string;
  onClose: () => void;
  onCreateCustomer: (name: string) => void;
  onSubmit: (checkout: CheckoutItem) => void;
}) {
  const now = new Date();
  const customers = business.customers || [];
  const staff = business.staff || [];
  const services = business.services || [];
  const [customerName, setCustomerName] = useState(initialCustomerName || "");
  const [customerId, setCustomerId] = useState<string | undefined>(
    initialCustomerId,
  );
  const [date, setDate] = useState(
    initialDate || now.toISOString().slice(0, 10),
  );
  const [hour, setHour] = useState(String(now.getHours()).padStart(2, "0"));
  const [minute, setMinute] = useState(
    String(now.getMinutes()).padStart(2, "0"),
  );
  const [notes, setNotes] = useState("");
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [discountText, setDiscountText] = useState("0");
  const [lines, setLines] = useState<
    Array<{
      id: string;
      staffId: string;
      serviceId: string;
      durationText: string;
      amountText: string;
    }>
  >([
    {
      id: crypto.randomUUID(),
      staffId: "",
      serviceId: "",
      durationText: "",
      amountText: "",
    },
  ]);
  function selectCustomer(selection: CustomerSelection) {
    setCustomerName(selection.name);
    setCustomerId(
      selection.id?.startsWith("contact:") ? undefined : selection.id,
    );
  }
  const completedLines = lines
    .map((line) => {
      const member = staff.find((item) => item.id === line.staffId);
      const service = services.find((item) => item.id === line.serviceId);
      return {
        ...line,
        member,
        service,
        duration: parseLooseNumber(line.durationText),
        amount: parseLooseNumber(line.amountText),
      };
    })
    .filter((line) => line.member && line.service);
  const totalAmount = completedLines.reduce((sum, line) => {
    return sum + line.amount;
  }, 0);
  const discountAmount = discountEnabled
    ? Math.min(totalAmount, parseLooseNumber(discountText))
    : 0;
  const firstCompleted = completedLines[0];
  const updateLine = (
    id: string,
    fields: Partial<{
      staffId: string;
      serviceId: string;
      durationText: string;
      amountText: string;
    }>,
  ) => {
    setLines((prev) =>
      prev.map((line) => {
        if (line.id !== id) return line;
        if (fields.staffId !== undefined) {
          return {
            ...line,
            staffId: fields.staffId,
            serviceId: "",
            durationText: "",
            amountText: "",
          };
        }
        if (fields.serviceId !== undefined) {
          const selectedService = services.find(
            (service) => service.id === fields.serviceId,
          );
          const amount =
            selectedService?.priceType === "range"
              ? selectedService.minPrice || 0
              : selectedService?.price || 0;
          return {
            ...line,
            serviceId: fields.serviceId,
            durationText: selectedService
              ? String(selectedService.duration || 0)
              : "",
            amountText: selectedService ? String(amount) : "",
          };
        }
        return { ...line, ...fields };
      }),
    );
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-start bg-slate-950/35 p-6">
      <section className="mx-auto mt-4 w-full max-w-3xl rounded bg-white shadow-xl">
        <ModalHeader title="Yeni" onClose={onClose} />
        <div className="max-h-[78vh] space-y-3 overflow-y-auto p-5">
          <CustomerPicker
            value={customerName}
            selectedId={customerId}
            customers={customers}
            contacts={contacts}
            onTextChange={(value) => {
              setCustomerName(value);
              setCustomerId(undefined);
            }}
            onSelect={selectCustomer}
            onCreateCustomer={onCreateCustomer}
          />
          <div className="grid gap-3 md:grid-cols-[1fr_120px_120px]">
            <Input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
            <NativeSelect
              value={hour}
              onChange={setHour}
              options={Array.from({ length: 24 }, (_, h) => ({
                value: String(h).padStart(2, "0"),
                label: String(h).padStart(2, "0"),
              }))}
            />
            <NativeSelect
              value={minute}
              onChange={setMinute}
              options={["00", "15", "30", "45"].map((m) => ({
                value: m,
                label: m,
              }))}
            />
          </div>
          <Input
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Notlar"
          />
          <h2 className="text-xl font-semibold">Hizmetler</h2>
          <div className="grid gap-2">
            {lines.map((line) => {
              const staffServices = services.filter((service) =>
                service.staffIds.includes(line.staffId),
              );
              return (
                <div
                  key={line.id}
                  className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_44px]"
                >
                  <NativeSelect
                    value={line.staffId}
                    onChange={(value) =>
                      updateLine(line.id, { staffId: value })
                    }
                    options={[
                      { value: "", label: "Çalışan seç" },
                      ...staff.map((member) => ({
                        value: member.id,
                        label: member.name,
                      })),
                    ]}
                  />
                  <NativeSelect
                    value={line.serviceId}
                    disabled={!line.staffId}
                    onChange={(value) =>
                      updateLine(line.id, { serviceId: value })
                    }
                    options={[
                      { value: "", label: "Hizmet seç" },
                      ...staffServices.map((service) => ({
                        value: service.id,
                        label: `${service.name} [${service.gender}]`,
                      })),
                    ]}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    disabled={lines.length === 1}
                    onClick={() =>
                      setLines((prev) =>
                        prev.filter((item) => item.id !== line.id),
                      )
                    }
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() =>
              setLines((prev) => [
                ...prev,
                {
                  id: crypto.randomUUID(),
                  staffId: "",
                  serviceId: "",
                  durationText: "",
                  amountText: "",
                },
              ])
            }
            className="h-8 w-full rounded border border-slate-200 bg-white text-sm shadow-sm"
          >
            + Bir hizmet daha ekle
          </button>
          <div className="mt-4 overflow-x-auto border-t border-slate-200">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-3 py-2">Hizmetler</th>
                  <th className="px-3 py-2">Süre</th>
                  <th className="px-3 py-2">Tutar</th>
                  <th className="px-3 py-2">Birleştir</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {completedLines.map((line) => (
                  <tr key={line.id}>
                    <td className="px-3 py-2">
                      {line.service!.name} [{line.service!.gender}] (
                      {line.member!.name})
                    </td>
                    <td className="px-3 py-2">
                      <div className="inline-flex rounded border border-slate-300">
                        <Input
                          value={line.durationText}
                          inputMode="decimal"
                          onChange={(event) =>
                            updateLine(line.id, {
                              durationText: event.target.value,
                            })
                          }
                          className="h-8 w-20 rounded-r-none border-0"
                        />
                        <span className="border-l border-slate-300 bg-slate-100 px-2 py-1">
                          dk
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="inline-flex rounded border border-slate-300">
                        <Input
                          value={line.amountText}
                          inputMode="decimal"
                          onChange={(event) =>
                            updateLine(line.id, {
                              amountText: event.target.value,
                            })
                          }
                          className="h-8 w-20 rounded-r-none border-0"
                        />
                        <span className="border-l border-slate-300 bg-slate-100 px-2 py-1">
                          TL
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <input type="checkbox" />
                    </td>
                    <td className="px-3 py-2">
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() =>
                          setLines((prev) =>
                            prev.filter((item) => item.id !== line.id),
                          )
                        }
                      >
                        <X className="size-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ToggleRow
            label="İndirim"
            description="Bu adisyon için indirim uygula."
            checked={discountEnabled}
            onChange={setDiscountEnabled}
          />
          {discountEnabled && (
            <div className="inline-flex w-48 rounded border border-slate-300">
              <Input
                value={discountText}
                inputMode="decimal"
                onChange={(event) => setDiscountText(event.target.value)}
                className="rounded-r-none border-0"
                aria-label="İndirim tutarı"
              />
              <span className="border-l border-slate-300 bg-slate-100 px-3 py-2">
                TL
              </span>
            </div>
          )}
          <Button
            type="button"
            disabled={saving || !customerName.trim() || !firstCompleted}
            onClick={() => {
              if (!firstCompleted) return;
              onSubmit({
                id: crypto.randomUUID(),
                customerId,
                customerName,
                date,
                hour,
                minute,
                notes,
                staffId: firstCompleted.staffId,
                serviceId: firstCompleted.serviceId,
                lines: completedLines.map((line) => ({
                  id: line.id,
                  staffId: line.staffId,
                  serviceId: line.serviceId,
                  duration: line.duration,
                  amount: line.amount,
                })),
                duration: completedLines.reduce(
                  (sum, line) => sum + line.duration,
                  0,
                ),
                amount: totalAmount,
                discount: discountAmount,
                attendance: "Belirtilmemiş",
                payments: [],
                status: "Açık",
                createdAt: new Date().toISOString(),
              });
            }}
            className="w-full bg-[#24a647] text-white"
          >
            Adisyonu oluştur
          </Button>
        </div>
      </section>
    </div>
  );
}

function CheckoutDetailsPage({
  checkout,
  business,
  saving,
  onSave,
  onBack,
}: {
  checkout: CheckoutItem;
  business: Business;
  saving: boolean;
  onSave: (checkout: CheckoutItem) => Promise<void>;
  onBack: () => void;
}) {
  const [form, setForm] = useState<CheckoutItem>(checkout);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [localSaving, setLocalSaving] = useState(false);
  const lines = getCheckoutLines(form);
  const payments = form.payments || [];
  const paid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const total = Math.max(0, form.amount - form.discount);
  const remaining = Math.max(0, total - paid);
  const isSaving = saving || localSaving;

  async function saveDetails() {
    setLocalSaving(true);
    try {
      await onSave(form);
    } finally {
      setLocalSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          { label: "Aloyz", view: "dashboard" },
          { label: "Adisyon detayları", view: "visit/list" },
        ]}
      />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-700">Adisyon</h1>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => window.print()}>
            Yazdır
          </Button>
          <Button
            type="button"
            disabled={isSaving}
            onClick={saveDetails}
            className="bg-[#24a647] text-white"
          >
            {isSaving ? "Kaydediliyor..." : "Değişiklikleri kaydet"}
          </Button>
          <Button type="button" variant="outline" onClick={onBack}>
            Listeye dön
          </Button>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-4">
          <section className="rounded bg-white p-4 shadow-sm">
            <div className="font-semibold text-blue-700">
              {form.customerName}
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_120px_120px]">
              <Input
                type="date"
                value={form.date}
                onChange={(event) =>
                  setForm({ ...form, date: event.target.value })
                }
              />
              <NativeSelect
                value={form.hour}
                onChange={(hour) => setForm({ ...form, hour })}
                options={Array.from({ length: 24 }, (_, h) => ({
                  value: String(h).padStart(2, "0"),
                  label: String(h).padStart(2, "0"),
                }))}
              />
              <NativeSelect
                value={form.minute}
                onChange={(minute) => setForm({ ...form, minute })}
                options={["00", "15", "30", "45"].map((minute) => ({
                  value: minute,
                  label: minute,
                }))}
              />
            </div>
            <Input
              value={form.notes || ""}
              onChange={(event) =>
                setForm({ ...form, notes: event.target.value })
              }
              className="mt-3"
            />
            <div className="mt-3 grid grid-cols-3 overflow-hidden rounded text-sm text-white">
              {(["Belirtilmemiş", "Geldi", "Gelmedi"] as const).map(
                (status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setForm({ ...form, attendance: status })}
                    className={`px-3 py-2 ${
                      (form.attendance || "Belirtilmemiş") === status
                        ? "bg-slate-800"
                        : "bg-slate-600"
                    }`}
                  >
                    {status}
                  </button>
                ),
              )}
            </div>
          </section>
          <section className="rounded bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Hizmetler</h2>
              <Button
                type="button"
                className="bg-[#24a647] text-white"
                onClick={() =>
                  setForm((prev) => {
                    const firstStaff = business.staff?.[0]?.id || "";
                    const firstService = business.services?.find((service) =>
                      firstStaff ? service.staffIds.includes(firstStaff) : true,
                    );
                    const nextLines = [
                      ...getCheckoutLines(prev),
                      {
                        id: crypto.randomUUID(),
                        staffId: firstStaff,
                        serviceId: firstService?.id || "",
                        duration: firstService?.duration || 0,
                        amount:
                          firstService?.priceType === "range"
                            ? firstService.minPrice || 0
                            : firstService?.price || 0,
                      },
                    ];
                    return {
                      ...prev,
                      lines: nextLines,
                      staffId: nextLines[0]?.staffId || prev.staffId,
                      serviceId: nextLines[0]?.serviceId || prev.serviceId,
                      duration: nextLines.reduce(
                        (sum, item) => sum + item.duration,
                        0,
                      ),
                      amount: nextLines.reduce(
                        (sum, item) => sum + item.amount,
                        0,
                      ),
                    };
                  })
                }
              >
                <Plus className="size-4" />
                Yeni hizmet
              </Button>
            </div>
            <div className="mt-3 grid gap-3">
              {lines.map((line) => {
                const service = (business.services || []).find(
                  (item) => item.id === line.serviceId,
                );
                const staff = (business.staff || []).find(
                  (item) => item.id === line.staffId,
                );
                return (
                  <div
                    key={line.id}
                    className="rounded border-l-4 border-[#5f86b6] bg-white p-4 shadow-sm"
                  >
                    <div className="font-semibold">
                      {service?.name || "Hizmet"}
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                      <label className="grid gap-1 text-xs text-slate-500">
                        Personel
                        <NativeSelect
                          value={line.staffId}
                          onChange={(staffId) =>
                            setForm((prev) => ({
                              ...prev,
                              lines: getCheckoutLines(prev).map((item) =>
                                item.id === line.id
                                  ? { ...item, staffId }
                                  : item,
                              ),
                            }))
                          }
                          options={(business.staff || []).map((member) => ({
                            value: member.id,
                            label: member.name,
                          }))}
                        />
                      </label>
                      <label className="grid gap-1 text-xs text-slate-500">
                        Süre
                        <Input
                          value={String(line.duration)}
                          inputMode="decimal"
                          onChange={(event) =>
                            setForm((prev) => {
                              const nextLines = getCheckoutLines(prev).map(
                                (item) =>
                                  item.id === line.id
                                    ? {
                                        ...item,
                                        duration: parseLooseNumber(
                                          event.target.value,
                                        ),
                                      }
                                    : item,
                              );
                              return {
                                ...prev,
                                lines: nextLines,
                                duration: nextLines.reduce(
                                  (sum, item) => sum + item.duration,
                                  0,
                                ),
                              };
                            })
                          }
                        />
                      </label>
                      <label className="grid gap-1 text-xs text-slate-500">
                        Fiyat
                        <Input
                          value={String(line.amount)}
                          inputMode="decimal"
                          onChange={(event) =>
                            setForm((prev) => {
                              const nextLines = getCheckoutLines(prev).map(
                                (item) =>
                                  item.id === line.id
                                    ? {
                                        ...item,
                                        amount: parseLooseNumber(
                                          event.target.value,
                                        ),
                                      }
                                    : item,
                              );
                              return {
                                ...prev,
                                lines: nextLines,
                                amount: nextLines.reduce(
                                  (sum, item) => sum + item.amount,
                                  0,
                                ),
                              };
                            })
                          }
                        />
                      </label>
                    </div>
                    {staff && (
                      <div className="mt-2 text-xs text-slate-500">
                        {staff.name}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
          {["Ürün satışları", "Randevu Etiketleri", "Randevu fotoğrafları"].map(
            (title) => (
              <section key={title} className="rounded bg-white p-4 shadow-sm">
                <h2 className="font-semibold">{title}</h2>
                <p className="mt-3 text-sm text-slate-500">
                  Kayıtlı içerik bulunmamaktadır.
                </p>
              </section>
            ),
          )}
        </div>
        <aside className="space-y-3">
          <h2 className="text-2xl font-semibold text-slate-700">Ödeme</h2>
          <InfoCard
            label="Hizmet ve ürünler toplamı"
            value={`${form.amount} TL`}
          />
          <section className="rounded bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-sm font-semibold">
              <span>İndirim</span>
              <span>{form.discount || 0} TL</span>
            </div>
            <Input
              value={String(form.discount || 0)}
              inputMode="decimal"
              onChange={(event) =>
                setForm({
                  ...form,
                  discount: parseLooseNumber(event.target.value),
                })
              }
              className="mt-3"
            />
          </section>
          <section className="rounded bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between font-semibold">
              Tahsilatlar
              <Button
                type="button"
                disabled={remaining <= 0}
                onClick={() => setPaymentOpen(true)}
                className="bg-[#5f86b6] text-white"
              >
                <Plus className="size-4" />
                Yeni tahsilat
              </Button>
            </div>
            <div className="mt-3 divide-y divide-slate-100 text-sm">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="grid grid-cols-[1fr_1fr_auto] gap-2 py-2"
                >
                  <span>{formatInputDate(payment.date)}</span>
                  <span>{payment.method}</span>
                  <span>{payment.amount} TL</span>
                </div>
              ))}
              {payments.length === 0 && (
                <p className="py-3 text-slate-500">
                  Kayıtlı tahsilat bulunmamaktadır
                </p>
              )}
            </div>
            <div className="mt-3 border-t border-slate-200 pt-2 text-sm">
              <div className="flex justify-between">
                <span>Tahsil edilen toplam tutar</span>
                <span>{paid} TL</span>
              </div>
              <div className="flex justify-between">
                <span>Tahsil edilecek kalan tutar</span>
                <span>{remaining} TL</span>
              </div>
            </div>
          </section>
          <Button
            type="button"
            disabled={isSaving}
            onClick={saveDetails}
            className="w-full bg-[#24a647] text-white"
          >
            {isSaving ? "Kaydediliyor..." : "Değişiklikleri kaydet"}
          </Button>
        </aside>
      </div>
      {paymentOpen && (
        <PaymentModal
          maxAmount={remaining}
          onClose={() => setPaymentOpen(false)}
          onSubmit={(payment) => {
            setForm((prev) => ({
              ...prev,
              payments: [payment, ...(prev.payments || [])],
            }));
            setPaymentOpen(false);
          }}
        />
      )}
    </div>
  );
}

function PaymentModal({
  maxAmount,
  onClose,
  onSubmit,
}: {
  maxAmount: number;
  onClose: () => void;
  onSubmit: (payment: NonNullable<CheckoutItem["payments"]>[number]) => void;
}) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState(String(maxAmount || ""));
  const [method, setMethod] = useState("");
  const amountValue = parseLooseNumber(amount);
  const overLimit = amountValue > maxAmount;
  const canSubmit = !!method && amountValue > 0 && !overLimit && maxAmount > 0;

  return (
    <div className="fixed inset-0 z-[60] grid place-items-start bg-slate-950/35 p-6">
      <section className="mx-auto mt-4 w-full max-w-md rounded bg-white shadow-xl">
        <ModalHeader title="Yeni tahsilat" onClose={onClose} />
        <div className="grid gap-3 p-4">
          <Input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
          <div className="inline-flex rounded border border-slate-300">
            <Input
              value={amount}
              inputMode="decimal"
              onChange={(event) => setAmount(event.target.value)}
              className="rounded-r-none border-0"
            />
            <span className="border-l border-slate-300 bg-slate-100 px-3 py-2">
              TL
            </span>
          </div>
          <NativeSelect
            value={method}
            onChange={setMethod}
            options={[
              { value: "", label: "Ödeme yöntemi" },
              { value: "Nakit", label: "Nakit" },
              { value: "Kredi kartı", label: "Kredi kartı" },
              { value: "Havale", label: "Havale" },
              { value: "Online ödeme", label: "Online ödeme" },
              { value: "Diğer", label: "Diğer" },
            ]}
          />
          {overLimit && (
            <p className="text-xs font-medium text-rose-600">
              Kalan tutardan fazla tahsilat yapılamaz.
            </p>
          )}
          <Button
            type="button"
            disabled={!canSubmit}
            onClick={() => {
              if (!canSubmit) return;
              onSubmit({
                id: crypto.randomUUID(),
                date,
                amount: amountValue,
                method,
              });
            }}
            className="bg-[#5f86b6] text-white"
          >
            Kaydet
          </Button>
        </div>
      </section>
    </div>
  );
}

function filterByPeriod<T>(
  rows: T[],
  period: string,
  getDate: (item: T) => string,
) {
  if (period === "Tümü") return [...rows];
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  if (period === "Bugün") {
    return rows.filter((item) => getDate(item) === todayKey);
  }
  if (period === "Bu ay") {
    const monthKey = todayKey.slice(0, 7);
    return rows.filter((item) => getDate(item).startsWith(monthKey));
  }
  return [...rows];
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded bg-white p-4 text-sm shadow-sm">
      <span className="font-semibold text-slate-700">{label}</span>
      <span className="text-slate-700">{value}</span>
    </div>
  );
}

function getCheckoutLines(checkout: CheckoutItem) {
  if (checkout.lines && checkout.lines.length > 0) {
    return checkout.lines;
  }
  return [
    {
      id: `${checkout.id}-line`,
      staffId: checkout.staffId,
      serviceId: checkout.serviceId,
      duration: checkout.duration,
      amount: checkout.amount,
    },
  ];
}

export function syncCheckoutToGoogleCalendar(
  business: Business,
  checkout: CheckoutItem,
) {
  if (!business.calendarId) return;
  const lines = getCheckoutLines(checkout);
  for (const line of lines) {
    const service = (business.services || []).find(
      (item) => item.id === line.serviceId,
    );
    const staff = (business.staff || []).find(
      (item) => item.id === line.staffId,
    );
    const start = new Date(
      `${checkout.date}T${checkout.hour}:${checkout.minute}:00+03:00`,
    );
    const end = new Date(start.getTime() + line.duration * 60 * 1000);
    fetch(
      `/api/calendar/events?businessId=${encodeURIComponent(business.id)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: `${checkout.customerName} - ${service?.name || "Hizmet"}`,
          description: [
            checkout.notes,
            staff ? `Personel: ${staff.name}` : null,
            `Adisyon: ${checkout.id}`,
          ]
            .filter(Boolean)
            .join("\n"),
          start: start.toISOString(),
          end: end.toISOString(),
          checkoutId: checkout.id,
          lineId: line.id,
        }),
      },
    ).catch(() => undefined);
  }
}
