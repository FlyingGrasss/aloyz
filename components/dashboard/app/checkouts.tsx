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
  const [selectedCheckout, setSelectedCheckout] = useState<CheckoutItem | null>(
    null,
  );
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  const checkouts = business.checkouts || [];

  async function createCheckout(checkout: CheckoutItem) {
    setModal(null);
    await onUpdateAndSave({ checkouts: [checkout, ...checkouts] });
  }

  async function createCustomer(customer: CustomerProfile) {
    await onUpdateAndSave({
      customers: [customer, ...(business.customers || [])],
    });
    setModal("checkout");
  }

  if (selectedCheckout) {
    return (
      <CheckoutDetailsPage
        checkout={selectedCheckout}
        business={business}
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
              value="Onaylı"
              onChange={() => undefined}
              options={[
                { value: "Onaylı", label: "Onaylı" },
                { value: "Açık", label: "Açık" },
              ]}
            />
            <NativeSelect
              value="Bugün"
              onChange={() => undefined}
              options={[
                { value: "Bugün", label: "Bugün" },
                { value: "Tümü", label: "Tümü" },
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
          <Button type="button" className="bg-[#5f86b6] text-white">
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
              {checkouts.map((checkout) => {
                const service = (business.services || []).find(
                  (item) => item.id === checkout.serviceId,
                );
                const total = Math.max(0, checkout.amount - checkout.discount);
                return (
                  <tr key={checkout.id}>
                    <td className="px-3 py-3">{checkout.status}</td>
                    <td className="px-3 py-3 font-medium">
                      {checkout.customerName}
                    </td>
                    <td className="px-3 py-3">{service?.name || "-"}</td>
                    <td className="px-3 py-3">
                      {formatInputDate(checkout.date)}
                    </td>
                    <td className="px-3 py-3">
                      {checkout.hour}:{checkout.minute}
                    </td>
                    <td className="px-3 py-3">Geldi</td>
                    <td className="px-3 py-3">{checkout.amount} TL</td>
                    <td className="px-3 py-3">{checkout.discount} TL</td>
                    <td className="px-3 py-3">0 TL</td>
                    <td className="px-3 py-3">{total} TL</td>
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
                            onClick={() => setOpenActionMenu(null)}
                          >
                            Tahsilatsız kapat
                          </button>
                          <button
                            type="button"
                            className="block w-full px-3 py-2 text-left text-red-600 hover:bg-slate-50"
                            onClick={() => setOpenActionMenu(null)}
                          >
                            İptal et
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {checkouts.length === 0 && (
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
          Toplam kayıt sayısı: {checkouts.length}
        </div>
      </section>
      {modal === "checkout" && (
        <CheckoutModal
          business={business}
          contacts={contacts}
          saving={saving}
          onClose={() => setModal(null)}
          onCreateCustomer={(name) => {
            setNewCustomerName(name);
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
  onClose,
  onCreateCustomer,
  onSubmit,
}: {
  business: Business;
  contacts: ContactRow[];
  saving: boolean;
  initialDate?: string;
  initialCustomerName?: string;
  onClose: () => void;
  onCreateCustomer: (name: string) => void;
  onSubmit: (checkout: CheckoutItem) => void;
}) {
  const now = new Date();
  const customers = business.customers || [];
  const staff = business.staff || [];
  const services = business.services || [];
  const [customerName, setCustomerName] = useState(initialCustomerName || "");
  const [customerOpen, setCustomerOpen] = useState(false);
  const [date, setDate] = useState(
    initialDate || now.toISOString().slice(0, 10),
  );
  const [hour, setHour] = useState(String(now.getHours()).padStart(2, "0"));
  const [minute, setMinute] = useState(
    String(now.getMinutes()).padStart(2, "0"),
  );
  const [notes, setNotes] = useState("");
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
  const customerMatches = customers
    .filter((customer) =>
      customer.name
        .toLocaleLowerCase("tr-TR")
        .startsWith(customerName.toLocaleLowerCase("tr-TR")),
    )
    .slice(0, 5);
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
          <div className="relative">
            <Input
              value={customerName}
              onFocus={() => setCustomerOpen(true)}
              onChange={(event) => {
                setCustomerName(event.target.value);
                setCustomerOpen(true);
              }}
              placeholder="Müşteri"
            />
            {customerOpen && customerName && (
              <div className="absolute z-10 mt-1 w-full rounded border border-slate-200 bg-white shadow">
                {customerMatches.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => {
                      setCustomerName(customer.name);
                      setCustomerOpen(false);
                    }}
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                  >
                    {customer.name}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => onCreateCustomer(customerName)}
                  className="block w-full px-3 py-2 text-left text-sm font-semibold text-[#24a647] hover:bg-slate-50"
                >
                  + Yeni müşteri olarak ekle
                </button>
              </div>
            )}
          </div>
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
            checked={false}
            onChange={() => undefined}
          />
          <Button
            type="button"
            disabled={saving || !customerName.trim() || !firstCompleted}
            onClick={() => {
              if (!firstCompleted) return;
              onSubmit({
                id: crypto.randomUUID(),
                customerName,
                date,
                hour,
                minute,
                notes,
                staffId: firstCompleted.staffId,
                serviceId: firstCompleted.serviceId,
                duration: completedLines.reduce(
                  (sum, line) => sum + line.duration,
                  0,
                ),
                amount: totalAmount,
                discount: 0,
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
  onBack,
}: {
  checkout: CheckoutItem;
  business: Business;
  onBack: () => void;
}) {
  const service = (business.services || []).find(
    (item) => item.id === checkout.serviceId,
  );
  const staff = (business.staff || []).find(
    (item) => item.id === checkout.staffId,
  );
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
          <Button type="button" variant="outline">
            Yazdır
          </Button>
          <Button type="button" className="bg-[#24a647] text-white">
            Değişiklikleri kaydet
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
              {checkout.customerName}
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_120px_120px]">
              <Input value={formatInputDate(checkout.date)} readOnly />
              <NativeSelect
                value={checkout.hour}
                onChange={() => undefined}
                options={[{ value: checkout.hour, label: checkout.hour }]}
              />
              <NativeSelect
                value={checkout.minute}
                onChange={() => undefined}
                options={[{ value: checkout.minute, label: checkout.minute }]}
              />
            </div>
            <Input value={checkout.notes || ""} readOnly className="mt-3" />
            <div className="mt-3 grid grid-cols-3 overflow-hidden rounded text-sm text-white">
              <button className="bg-slate-600 px-3 py-2">Belirtilmemiş</button>
              <button className="bg-slate-700 px-3 py-2">Geldi</button>
              <button className="bg-slate-600 px-3 py-2">Gelmedi</button>
            </div>
          </section>
          <section className="rounded bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Hizmetler</h2>
              <Button type="button" className="bg-[#24a647] text-white">
                <Plus className="size-4" />
                Yeni hizmet
              </Button>
            </div>
            <div className="mt-3 rounded border-l-4 border-[#5f86b6] bg-white p-4 shadow-sm">
              <div className="font-semibold">{service?.name || "Hizmet"}</div>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <label className="grid gap-1 text-xs text-slate-500">
                  Personel
                  <NativeSelect
                    value={checkout.staffId}
                    onChange={() => undefined}
                    options={[
                      { value: checkout.staffId, label: staff?.name || "-" },
                    ]}
                  />
                </label>
                <label className="grid gap-1 text-xs text-slate-500">
                  Süre
                  <Input value={checkout.duration} readOnly />
                </label>
                <label className="grid gap-1 text-xs text-slate-500">
                  Fiyat
                  <Input value={checkout.amount} readOnly />
                </label>
              </div>
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
            value={`${checkout.amount} TL`}
          />
          <InfoCard label="İndirim" value={`${checkout.discount} TL`} />
          <section className="rounded bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between font-semibold">
              Tahsilatlar
              <Button type="button" className="bg-[#5f86b6] text-white">
                <Plus className="size-4" />
                Yeni tahsilat
              </Button>
            </div>
            <p className="mt-3 text-sm text-slate-500">
              Kayıtlı tahsilat bulunmamaktadır
            </p>
          </section>
          <Button type="button" className="w-full bg-[#24a647] text-white">
            Değişiklikleri kaydet
          </Button>
        </aside>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded bg-white p-4 text-sm shadow-sm">
      <span className="font-semibold text-slate-700">{label}</span>
      <span className="text-slate-700">{value}</span>
    </div>
  );
}
