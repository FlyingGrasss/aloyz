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
  PackageSaleItem,
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

const CUSTOMER_PAGE_SIZE = 100;

export function ContactsPage({
  business,
  contacts,
  searchTerm,
  saving,
  onUpdateAndSave,
}: {
  business: Business;
  contacts: ContactRow[];
  searchTerm: string;
  saving: boolean;
  onUpdateAndSave: (fields: Partial<Business>) => Promise<boolean>;
}) {
  const [editingCustomer, setEditingCustomer] =
    useState<CustomerProfile | null>(null);
  const [contactFilter, setContactFilter] = useState("all");
  const [customerPageState, setCustomerPageState] = useState({
    searchTerm,
    page: 1,
  });
  const customerPage =
    customerPageState.searchTerm === searchTerm ? customerPageState.page : 1;
  const setCustomerPage = (page: number) =>
    setCustomerPageState({ searchTerm, page });
  const savedCustomers = business.customers || [];
  const normalizedSearch = searchTerm.trim().toLocaleLowerCase("tr-TR");
  const phoneSearch = normalizedSearch
    .replace(/\D/g, "")
    .replace(/^90/, "")
    .replace(/^0/, "");
  const filteredSavedCustomers = savedCustomers.filter((customer) => {
    if (!normalizedSearch) return true;
    const textMatches = [
      customer.name,
      customer.phone,
      customer.email,
      customer.instagramUsername,
      customer.notes,
    ]
      .filter(Boolean)
      .some((value) =>
        String(value).toLocaleLowerCase("tr-TR").includes(normalizedSearch),
      );
    const phoneMatches =
      phoneSearch.length > 0 &&
      String(customer.phone || "")
        .replace(/\D/g, "")
        .includes(phoneSearch);
    return textMatches || phoneMatches;
  });
  const filteredContacts = contacts.filter((contact) => {
    const channelMatch =
      contactFilter === "all" || contact.channel === contactFilter;
    if (!channelMatch) return false;
    if (!normalizedSearch) return true;
    return [
      contact.name,
      contact.subtitle,
      contact.phone,
      contact.username,
      contact.lastMessage,
    ]
      .filter(Boolean)
      .some((value) =>
        String(value).toLocaleLowerCase("tr-TR").includes(normalizedSearch),
      );
  });

  const totalCustomerPages = Math.max(
    1,
    Math.ceil(filteredSavedCustomers.length / CUSTOMER_PAGE_SIZE),
  );
  const currentCustomerPage = Math.min(customerPage, totalCustomerPages);
  const visibleCustomers = filteredSavedCustomers.slice(
    (currentCustomerPage - 1) * CUSTOMER_PAGE_SIZE,
    currentCustomerPage * CUSTOMER_PAGE_SIZE,
  );
  const firstVisibleCustomer =
    filteredSavedCustomers.length === 0
      ? 0
      : (currentCustomerPage - 1) * CUSTOMER_PAGE_SIZE + 1;
  const lastVisibleCustomer = Math.min(
    currentCustomerPage * CUSTOMER_PAGE_SIZE,
    filteredSavedCustomers.length,
  );

  async function saveCustomer(customer: CustomerProfile) {
    const exists = savedCustomers.some((item) => item.id === customer.id);
    const next = exists
      ? savedCustomers.map((item) => (item.id === customer.id ? customer : item))
      : [customer, ...savedCustomers];
    const saved = await onUpdateAndSave({ customers: next });
    if (saved) {
      setEditingCustomer(null);
      setCustomerPage(1);
    }
  }

  async function updatePackageSale(sale: PackageSaleItem) {
    const packageSales = (business.promotions?.packageSales || []).map((item) =>
      item.id === sale.id ? sale : item,
    );
    return onUpdateAndSave({
      promotions: {
        ...(business.promotions || {}),
        packageSales,
      },
    });
  }

  return (
    <div className="space-y-4">
      <Breadcrumb items={["Aloyz", "Müşteriler"]} />
      <section className="rounded bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <h1 className="text-lg font-semibold">Müşteriler</h1>
            <p className="text-sm text-slate-500">
              {filteredSavedCustomers.length === 0
                ? "0 kayıt"
                : `${firstVisibleCustomer}–${lastVisibleCustomer} / ${filteredSavedCustomers.length} kayıt`}
              {searchTerm ? ', arama: "' + searchTerm + '"' : ""}
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Müşteri</th>
                <th className="px-4 py-3">Telefon</th>
                <th className="hidden px-4 py-3 md:table-cell">E-posta</th>
                <th className="hidden px-4 py-3 md:table-cell">Instagram</th>
                <th className="hidden px-4 py-3 md:table-cell">Not</th>
                <th className="w-8 px-2 py-3 md:hidden" aria-label="Detay" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  onClick={() => setEditingCustomer(customer)}
                  className="cursor-pointer hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {customer.name.toLocaleUpperCase("tr-TR")}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {customer.phone || "-"}
                  </td>
                  <td className="hidden px-4 py-3 text-slate-600 md:table-cell">
                    {customer.email || "-"}
                  </td>
                  <td className="hidden px-4 py-3 text-slate-600 md:table-cell">
                    {customer.instagramUsername || "-"}
                  </td>
                  <td className="hidden max-w-[340px] truncate px-4 py-3 text-slate-600 md:table-cell">
                    {customer.notes || "-"}
                  </td>
                  <td className="px-2 py-3 text-slate-400 md:hidden">
                    <ChevronRight className="size-4" />
                  </td>
                </tr>
              ))}
              {filteredSavedCustomers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    Müşteri kaydı bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filteredSavedCustomers.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm">
            <span className="text-slate-500">
              Sayfa {currentCustomerPage} / {totalCustomerPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label="Önceki sayfa"
                disabled={currentCustomerPage <= 1}
                onClick={() =>
                  setCustomerPage(Math.max(1, currentCustomerPage - 1))
                }
              >
                <ChevronLeft />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label="Sonraki sayfa"
                disabled={currentCustomerPage >= totalCustomerPages}
                onClick={() =>
                  setCustomerPage(
                    Math.min(totalCustomerPages, currentCustomerPage + 1),
                  )
                }
              >
                <ChevronRight />
              </Button>
            </div>
          </div>
        )}
      </section>

      <section className="rounded bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div>
            <h2 className="text-lg font-semibold">Mesaj Kişileri</h2>
            <p className="text-sm text-slate-500">
              WhatsApp ve Instagram konuşmalarından gelen kişiler
            </p>
          </div>
          <NativeSelect
            value={contactFilter}
            onChange={setContactFilter}
            options={[
              { value: "all", label: "Tümü" },
              { value: "whatsapp", label: "WhatsApp" },
              { value: "instagram", label: "Instagram" },
            ]}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Kişi</th>
                <th className="px-4 py-3">Kanal</th>
                <th className="px-4 py-3">İletişim</th>
                <th className="px-4 py-3">Son güncelleme</th>
                <th className="px-4 py-3">Mesaj</th>
                <th className="px-4 py-3">Randevu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredContacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800">{contact.name}</div>
                    <div className="max-w-[320px] truncate text-xs text-slate-500">
                      {contact.lastMessage || contact.subtitle || "Detay yok"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <ChannelBadge channel={contact.channel} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {contact.phone || contact.username || "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {contact.updatedAt ? formatLastUpdate(contact.updatedAt) : "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{contact.messageCount}</td>
                  <td className="px-4 py-3 text-slate-600">{contact.appointmentCount}</td>
                </tr>
              ))}
              {filteredContacts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    Mesaj kişisi bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {editingCustomer && (
        <CustomerModal
          saving={saving}
          initialCustomer={editingCustomer}
          packageSales={(business.promotions?.packageSales || []).filter(
            (sale) =>
              sale.customerId === editingCustomer.id ||
              sale.customerName.trim().toLocaleLowerCase("tr-TR") ===
                editingCustomer.name.trim().toLocaleLowerCase("tr-TR"),
          )}
          onUpdatePackageSale={updatePackageSale}
          onClose={() => setEditingCustomer(null)}
          onSubmit={saveCustomer}
        />
      )}
    </div>
  );
}

export function CustomerModal({
  saving,
  initialName,
  initialCustomer,
  packageSales = [],
  onUpdatePackageSale,
  onClose,
  onSubmit,
}: {
  saving: boolean;
  initialName?: string;
  initialCustomer?: CustomerProfile;
  packageSales?: PackageSaleItem[];
  onUpdatePackageSale?: (sale: PackageSaleItem) => Promise<boolean>;
  onClose: () => void;
  onSubmit: (customer: CustomerProfile) => void;
}) {
  const [customer, setCustomer] = useState<CustomerProfile>(
    initialCustomer || {
      id: crypto.randomUUID(),
      name: initialName || "",
      countryCode: "+90",
      phone: "",
      email: "",
      birthDate: "",
      gender: "Belirtilmemiş",
      notes: "",
      fileNumber: "",
      instagramUsername: "",
      discountEnabled: false,
      discountRate: 0,
      tags: [],
    },
  );
  const [editingPackageSale, setEditingPackageSale] =
    useState<PackageSaleItem | null>(null);
  return (
    <div className="fixed inset-0 z-[60] grid place-items-start bg-slate-950/35 p-6">
      <section className="mx-auto mt-4 w-full max-w-md rounded bg-white shadow-xl">
        <ModalHeader
          title={initialCustomer ? "Müşteri Bilgileri" : "Yeni müşteri"}
          onClose={onClose}
        />
        <div className="grid gap-3 p-4">
          <Input
            value={customer.name}
            onChange={(event) =>
              setCustomer({ ...customer, name: event.target.value })
            }
            placeholder="Ad soyad"
          />
          <div className="grid grid-cols-[110px_1fr] gap-3">
            <Input
              value={customer.countryCode || "+90"}
              onChange={(event) =>
                setCustomer({ ...customer, countryCode: event.target.value })
              }
            />
            <Input
              value={customer.phone || ""}
              onChange={(event) =>
                setCustomer({ ...customer, phone: event.target.value })
              }
              placeholder="Cep telefonu"
            />
          </div>
          <Input
            value={customer.email || ""}
            onChange={(event) =>
              setCustomer({ ...customer, email: event.target.value })
            }
            placeholder="E-posta adresi"
          />
          <Input
            type="date"
            value={customer.birthDate || ""}
            onChange={(event) =>
              setCustomer({ ...customer, birthDate: event.target.value })
            }
          />
          <NativeSelect
            value={customer.gender || "Belirtilmemiş"}
            onChange={(value) => setCustomer({ ...customer, gender: value })}
            options={["Belirtilmemiş", "Kadın", "Erkek"].map((value) => ({
              value,
              label: value,
            }))}
          />
          <Input
            value={customer.notes || ""}
            onChange={(event) =>
              setCustomer({ ...customer, notes: event.target.value })
            }
            placeholder="Notlar"
          />
          <Input
            value={customer.fileNumber || ""}
            onChange={(event) =>
              setCustomer({ ...customer, fileNumber: event.target.value })
            }
            placeholder="Dosya numarası"
          />
          <Input
            value={customer.instagramUsername || ""}
            onChange={(event) =>
              setCustomer({
                ...customer,
                instagramUsername: event.target.value,
              })
            }
            placeholder="Instagram kullanıcı adı"
          />
          <ToggleRow
            label="İndirim"
            description=""
            checked={!!customer.discountEnabled}
            onChange={(checked) =>
              setCustomer({ ...customer, discountEnabled: checked })
            }
          />
          {customer.discountEnabled && (
            <Input
              type="number"
              value={customer.discountRate || 0}
              onChange={(event) =>
                setCustomer({
                  ...customer,
                  discountRate: Number(event.target.value),
                })
              }
            />
          )}
          {initialCustomer && (
            <div className="rounded border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs font-semibold uppercase text-slate-500">
                Paketler
              </div>
              {packageSales.length === 0 ? (
                <p className="mt-2 text-xs text-slate-500">
                  Bu müşteriye ait paket kaydı yok.
                </p>
              ) : (
                <div className="mt-2 space-y-3">
                  {packageSales.map((sale) => (
                    <div key={sale.id}>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="text-xs font-medium text-slate-700">
                          {sale.total} TL · Ödenen {sale.paidAmount} TL
                          {sale.total > sale.paidAmount
                            ? ` · Kalan ödeme ${sale.total - sale.paidAmount} TL`
                            : ""}{" "}
                          · {sale.date}
                        </div>
                        {onUpdatePackageSale && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingPackageSale(sale)}
                          >
                            Düzenle
                          </Button>
                        )}
                      </div>
                      <div className="mt-1 space-y-1">
                        {sale.lines.map((line) => {
                          const quantity = Math.max(
                            0,
                            Number(line.quantity) || 0,
                          );
                          const used = Math.min(
                            quantity,
                            Math.max(0, Number(line.used) || 0),
                          );
                          const remaining = Math.min(
                            quantity - used,
                            Math.max(
                              0,
                              Number(line.remaining ?? quantity - used) || 0,
                            ),
                          );
                          return (
                            <div
                              key={line.id}
                              className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600"
                            >
                              <span>{line.name || "Paket"}</span>
                              <span>
                                Kalan {remaining}/{quantity} · Kullanılan{" "}
                                {used}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <Button
            type="button"
            disabled={saving || !customer.name.trim()}
            onClick={() => onSubmit(customer)}
            className="bg-[#5f86b6] text-white"
          >
            Kaydet
          </Button>
        </div>
      </section>
      {editingPackageSale && onUpdatePackageSale && (
        <PackageQuickEditModal
          sale={editingPackageSale}
          saving={saving}
          onClose={() => setEditingPackageSale(null)}
          onSave={async (sale) => {
            const saved = await onUpdatePackageSale(sale);
            if (saved) setEditingPackageSale(null);
          }}
        />
      )}
    </div>
  );
}

function PackageQuickEditModal({
  sale,
  saving,
  onClose,
  onSave,
}: {
  sale: PackageSaleItem;
  saving: boolean;
  onClose: () => void;
  onSave: (sale: PackageSaleItem) => Promise<void>;
}) {
  const [date, setDate] = useState(sale.date || "");
  const [total, setTotal] = useState(String(sale.total ?? 0));
  const [paidAmount, setPaidAmount] = useState(String(sale.paidAmount ?? 0));
  const [notes, setNotes] = useState(sale.notes || "");
  const [lines, setLines] = useState(
    sale.lines.map((line) => {
      const quantity = Math.max(0, Number(line.quantity) || 0);
      const used = Math.min(quantity, Math.max(0, Number(line.used) || 0));
      return {
        ...line,
        quantity,
        used,
        remaining: Math.min(
          quantity - used,
          Math.max(0, Number(line.remaining ?? quantity - used) || 0),
        ),
      };
    }),
  );

  function updateLine(
    id: string,
    patch: Partial<(typeof lines)[number]>,
  ) {
    setLines((current) =>
      current.map((line) => {
        if (line.id !== id) return line;
        const quantity = Math.max(
          0,
          Number(patch.quantity ?? line.quantity) || 0,
        );
        const used = Math.min(
          quantity,
          Math.max(0, Number(patch.used ?? line.used) || 0),
        );
        return {
          ...line,
          ...patch,
          quantity,
          used,
          remaining: quantity - used,
        };
      }),
    );
  }

  async function submit() {
    const normalizedLines = lines.map((line) => {
      const quantity = Math.max(0, Number(line.quantity) || 0);
      const used = Math.min(quantity, Math.max(0, Number(line.used) || 0));
      return {
        ...line,
        quantity,
        used,
        remaining: quantity - used,
      };
    });
    const normalizedTotal = Math.max(0, Number(total) || 0);
    const normalizedPaid = Math.min(
      normalizedTotal,
      Math.max(0, Number(paidAmount) || 0),
    );
    await onSave({
      ...sale,
      date,
      total: normalizedTotal,
      paidAmount: normalizedPaid,
      notes,
      lines: normalizedLines,
    });
  }

  return (
    <div className="fixed inset-0 z-[70] grid place-items-start overflow-y-auto bg-slate-950/40 p-4">
      <section className="mx-auto mt-4 w-full max-w-xl rounded bg-white shadow-xl">
        <ModalHeader title="Paket bilgilerini düzenle" onClose={onClose} />
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Satış tarihi
            <Input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Toplam tutar
            <Input
              type="number"
              value={total}
              onChange={(event) => setTotal(event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Ödenen tutar
            <Input
              type="number"
              value={paidAmount}
              onChange={(event) => setPaidAmount(event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Not
            <Input
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>
          <div className="grid gap-2 sm:col-span-2">
            {lines.map((line) => (
              <div
                key={line.id}
                className="rounded border border-slate-200 bg-slate-50 p-3"
              >
                <div className="text-sm font-semibold text-slate-700">
                  {line.name || "Paket"}
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <label className="grid gap-1 text-xs font-semibold text-slate-600">
                    Toplam seans
                    <Input
                      type="number"
                      min={0}
                      value={line.quantity}
                      onChange={(event) =>
                        updateLine(line.id, {
                          quantity: Number(event.target.value),
                        })
                      }
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-semibold text-slate-600">
                    Kullanılan
                    <Input
                      type="number"
                      min={0}
                      value={line.used}
                      onChange={(event) =>
                        updateLine(line.id, {
                          used: Number(event.target.value),
                        })
                      }
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-semibold text-slate-600">
                    Kalan
                    <Input value={line.remaining} readOnly />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Kapat
          </Button>
          <Button
            type="button"
            disabled={saving}
            onClick={() => void submit()}
            className="bg-[#24a647] text-white"
          >
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </section>
    </div>
  );
}

function ContactDetail({ contact }: { contact: ContactRow | null }) {
  if (!contact) {
    return (
      <aside className="rounded bg-white p-5 shadow-sm">
        <EmptyState
          title="Kişi seçilmedi"
          description="Detayları görmek için listeden bir kişi seçin."
        />
      </aside>
    );
  }

  const messages = getConversationMessages(contact.conversation);

  return (
    <aside className="rounded bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3 border-b border-slate-200 pb-4">
        <div className="grid size-11 place-items-center rounded-full bg-[#5f86b6] text-lg font-semibold text-white">
          {contact.name.slice(0, 1).toLocaleUpperCase("tr-TR")}
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold">{contact.name}</h2>
          <p className="truncate text-sm text-slate-500">{contact.subtitle}</p>
        </div>
      </div>
      <dl className="mt-4 space-y-3 text-sm">
        <InfoRow
          label="Kanal"
          value={contact.channel === "instagram" ? "Instagram" : "WhatsApp"}
        />
        <InfoRow label="Telefon" value={contact.phone || "-"} />
        <InfoRow label="Kullanıcı adı" value={contact.username || "-"} />
        <InfoRow label="Mesaj sayısı" value={String(contact.messageCount)} />
        <InfoRow
          label="Randevu sayısı"
          value={String(contact.appointmentCount)}
        />
        <InfoRow
          label="Son güncelleme"
          value={formatLastUpdate(contact.updatedAt)}
        />
      </dl>
      <div className="mt-5 rounded border border-slate-200 bg-slate-900 p-3">
        <div className="mb-2 text-xs font-semibold uppercase text-slate-500">
          Konuşma
        </div>
        <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[84%] rounded px-3 py-2 text-sm leading-relaxed ${message.role === "user" ? "bg-[#5f86b6] text-white" : "bg-slate-800 text-slate-100"}`}
              >
                <div className="mb-1 text-[10px] font-semibold opacity-70">
                  {message.role === "user" ? "Müşteri" : "Asistan"}
                </div>
                <div className="whitespace-pre-wrap">{message.text}</div>
              </div>
            </div>
          ))}
          {messages.length === 0 && (
            <div className="py-8 text-center text-sm text-slate-500">
              Mesaj bulunamadı.
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
