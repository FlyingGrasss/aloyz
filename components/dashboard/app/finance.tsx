"use client";

import type React from "react";
import { Download, Filter, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Breadcrumb,
  Business,
  CallLogItem,
  CommissionItem,
  CustomerProfile,
  ExpenseItem,
  LedgerItem,
  ModalHeader,
  NativeSelect,
  PaymentItem,
  ReviewItem,
  ViewId,
} from "./shared";
import { CustomerModal } from "./customers";
import { CustomerPicker, CustomerSelection } from "./customer-picker";

type SaveBusiness = (fields: Partial<Business>) => Promise<boolean>;
type PageKind =
  | "expenses"
  | "payments"
  | "receivables"
  | "debts"
  | "commissions"
  | "reviews"
  | "calls";

export function FinancePage({
  view,
  business,
  saving,
  onUpdateAndSave,
}: {
  view: ViewId;
  business: Business;
  saving: boolean;
  onUpdateAndSave: SaveBusiness;
}) {
  const kind = getKind(view);
  const meta = pageMeta[kind];
  const promotions = business.promotions || {};
  const [modalOpen, setModalOpen] = useState(false);
  const [period, setPeriod] = useState("Bu ay");
  const [sortDesc, setSortDesc] = useState(true);
  const filteredExpenses = filterByPeriod(promotions.expenses || [], period, (item) => item.date).sort(
    dateSorter(sortDesc),
  );
  const filteredPayments = filterByPeriod(promotions.payments || [], period, (item) => item.date).sort(
    dateSorter(sortDesc),
  );
  const filteredReceivables = filterByPeriod(promotions.receivables || [], period, (item) => item.date).sort(
    dateSorter(sortDesc),
  );
  const filteredDebts = filterByPeriod(promotions.debts || [], period, (item) => item.date).sort(
    dateSorter(sortDesc),
  );
  const filteredCommissions = filterByPeriod(promotions.commissions || [], period, (item) => item.date).sort(
    dateSorter(sortDesc),
  );
  const filteredReviews = filterByPeriod(promotions.reviews || [], period, (item) => item.date).sort(
    dateSorter(sortDesc),
  );
  const filteredCalls = filterByPeriod(promotions.callLogs || [], period, (item) => item.date).sort(
    dateSorter(sortDesc),
  );

  async function saveList(key: keyof Business["promotions"], list: unknown[]) {
    setModalOpen(false);
    await onUpdateAndSave({
      promotions: {
        ...promotions,
        [key]: list,
      },
    });
  }

  return (
    <div className="space-y-3">
      <Breadcrumb items={[{ label: "Aloyz", view: "dashboard" }, meta.title]} />
      <section key={kind} className="rounded bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <h1 className="text-xl font-semibold text-slate-700">{meta.title}</h1>
          <div className="flex items-center gap-2">
            <NativeSelect
              value={period}
              onChange={setPeriod}
              options={["Bu ay", "Bugün", "Dün", "Tüm zamanlar"].map((value) => ({
                value,
                label: value,
              }))}
            />
            {meta.canCreate && (
              <Button
                type="button"
                onClick={() => setModalOpen(true)}
                className="min-w-36 bg-[#24a647] text-white"
              >
                <Plus className="size-4" />
                Yeni
              </Button>
            )}
          </div>
        </div>
        <div className="border-b border-slate-200 bg-slate-100 px-4 py-3">
          <div className="flex justify-between gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setSortDesc((value) => !value)}
            >
              <Filter className="size-4" />
              Filtrele / Sırala
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                exportFinanceCsv(
                  kind,
                  getFinanceExportRows(kind, {
                    expenses: filteredExpenses,
                    payments: filteredPayments,
                    receivables: filteredReceivables,
                    debts: filteredDebts,
                    commissions: filteredCommissions,
                    reviews: filteredReviews,
                    calls: filteredCalls,
                  }),
                )
              }
            >
              <Download className="size-4" />
              İndir
            </Button>
          </div>
        </div>
        {kind === "expenses" && (
          <ExpenseTable
            rows={filteredExpenses}
            onDelete={(id) =>
              saveList(
                "expenses",
                (promotions.expenses || []).filter((item) => item.id !== id),
              )
            }
          />
        )}
        {kind === "payments" && <PaymentTable rows={filteredPayments} />}
        {kind === "receivables" && (
          <LedgerTable
            rows={filteredReceivables}
            label="Alacak"
            onDelete={(id) =>
              saveList(
                "receivables",
                (promotions.receivables || []).filter((item) => item.id !== id),
              )
            }
          />
        )}
        {kind === "debts" && (
          <LedgerTable
            rows={filteredDebts}
            label="Borç"
            onDelete={(id) =>
              saveList(
                "debts",
                (promotions.debts || []).filter((item) => item.id !== id),
              )
            }
          />
        )}
        {kind === "commissions" && (
          <CommissionTable business={business} rows={filteredCommissions} />
        )}
        {kind === "reviews" && <ReviewTable rows={filteredReviews} />}
        {kind === "calls" && <CallTable rows={filteredCalls} />}
      </section>
      {modalOpen && kind === "expenses" && (
        <ExpenseModal
          saving={saving}
          onClose={() => setModalOpen(false)}
          onSubmit={(item) => saveList("expenses", [item, ...(promotions.expenses || [])])}
        />
      )}
      {modalOpen && kind === "payments" && (
        <PaymentModal
          business={business}
          saving={saving}
          onCreateCustomer={async (customer) => {
            await onUpdateAndSave({
              customers: [customer, ...(business.customers || [])],
            });
          }}
          onClose={() => setModalOpen(false)}
          onSubmit={(item) => saveList("payments", [item, ...(promotions.payments || [])])}
        />
      )}
      {modalOpen && (kind === "receivables" || kind === "debts") && (
        <LedgerModal
          business={business}
          title={kind === "receivables" ? "Yeni alacak" : "Yeni borç"}
          saving={saving}
          onCreateCustomer={async (customer) => {
            await onUpdateAndSave({
              customers: [customer, ...(business.customers || [])],
            });
          }}
          onClose={() => setModalOpen(false)}
          onSubmit={(item) =>
            saveList(
              kind === "receivables" ? "receivables" : "debts",
              [item, ...((kind === "receivables" ? promotions.receivables : promotions.debts) || [])],
            )
          }
        />
      )}
      {modalOpen && kind === "commissions" && (
        <CommissionModal
          business={business}
          saving={saving}
          onClose={() => setModalOpen(false)}
          onSubmit={(item) =>
            saveList("commissions", [item, ...(promotions.commissions || [])])
          }
        />
      )}
    </div>
  );
}

function ExpenseTable({
  rows,
  onDelete,
}: {
  rows: ExpenseItem[];
  onDelete: (id: string) => void;
}) {
  return (
    <DataTable
      headers={["Tarih", "Kategori", "Başlık", "Tutar", "Ödeme yöntemi", "Durum", ""]}
      rows={rows.map((item) => [
        displayDate(item.date),
        item.category,
        item.title,
        money(item.amount),
        item.paymentMethod,
        item.status,
        <Button
          key={item.id}
          type="button"
          variant="destructive"
          size="icon-sm"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 className="size-4" />
        </Button>,
      ])}
      footer={`Toplam kayıt sayısı: ${rows.length} | Toplam tutar: ${money(sum(rows, "amount"))}`}
    />
  );
}

function PaymentTable({ rows }: { rows: PaymentItem[] }) {
  return (
    <DataTable
      headers={["Tarih", "Müşteri", "Tutar", "Ödeme yöntemi", "Kaynak", "Notlar"]}
      rows={rows.map((item) => [
        displayDate(item.date),
        item.customerName,
        money(item.amount),
        item.method,
        item.source,
        item.notes || "-",
      ])}
      footer={`Toplam kayıt sayısı: ${rows.length} | Toplam tahsilat: ${money(sum(rows, "amount"))}`}
    />
  );
}

function LedgerTable({
  rows,
  label,
  onDelete,
}: {
  rows: LedgerItem[];
  label: string;
  onDelete: (id: string) => void;
}) {
  return (
    <DataTable
      headers={["Tarih", "Kişi", "Açıklama", "Toplam", "Ödenen", "Kalan", "Durum", ""]}
      rows={rows.map((item) => [
        displayDate(item.date),
        item.personName,
        item.description,
        money(item.amount),
        money(item.paidAmount),
        money(Math.max(0, item.amount - item.paidAmount)),
        item.status,
        <Button
          key={item.id}
          type="button"
          variant="destructive"
          size="icon-sm"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 className="size-4" />
        </Button>,
      ])}
      footer={`${label === "Alacak" ? "Toplam alacak" : "Toplam borç"}: ${money(sum(rows, "amount"))}`}
    />
  );
}

function CommissionTable({
  business,
  rows,
}: {
  business: Business;
  rows: CommissionItem[];
}) {
  return (
    <DataTable
      headers={["Tarih", "Personel", "Kaynak", "Tutar", "Durum"]}
      rows={rows.map((item) => [
        displayDate(item.date),
        business.staff?.find((staff) => staff.id === item.staffId)?.name || "-",
        item.source,
        money(item.amount),
        item.status,
      ])}
      footer={`Toplam komisyon: ${money(sum(rows, "amount"))}`}
    />
  );
}

function ReviewTable({ rows }: { rows: ReviewItem[] }) {
  return (
    <DataTable
      headers={["Tarih", "Müşteri", "Puan", "Kanal", "Yorum", "Durum"]}
      rows={rows.map((item) => [
        displayDate(item.date),
        item.customerName,
        item.rating,
        item.channel,
        item.comment,
        item.status,
      ])}
      footer={`Toplam yorum: ${rows.length}`}
    />
  );
}

function CallTable({ rows }: { rows: CallLogItem[] }) {
  return (
    <DataTable
      headers={["Tarih", "Müşteri", "Telefon", "Yön", "Sonuç", "Notlar"]}
      rows={rows.map((item) => [
        displayDate(item.date),
        item.customerName,
        item.phone,
        item.direction,
        item.result,
        item.notes || "-",
      ])}
      footer={`Toplam arama: ${rows.length}`}
    />
  );
}

function DataTable({
  headers,
  rows,
  footer,
}: {
  headers: string[];
  rows: Array<Array<React.ReactNode>>;
  footer: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[840px] text-left text-sm">
        <thead className="border-y border-slate-200 text-slate-700">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-3 py-3 font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-3 py-3">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={headers.length} className="px-3 py-10 text-center text-slate-400">
                Kayıt bulunamadı
              </td>
            </tr>
          )}
          <tr className="bg-slate-50 font-semibold">
            <td colSpan={headers.length} className="px-3 py-3">
              {footer}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function ExpenseModal({
  saving,
  onClose,
  onSubmit,
}: {
  saving: boolean;
  onClose: () => void;
  onSubmit: (item: ExpenseItem) => void;
}) {
  const [form, setForm] = useState({
    date: todayInput(),
    category: "Genel",
    title: "",
    amount: "0",
    paymentMethod: "Nakit",
    notes: "",
  });
  return (
    <FormModal
      title="Yeni masraf"
      saving={saving}
      onClose={onClose}
      onSave={() =>
        onSubmit({
          id: createId(),
          ...form,
          amount: parseNumber(form.amount),
          status: "Aktif",
          createdAt: new Date().toISOString(),
        })
      }
    >
      <Input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
      <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Masraf adı" />
      <Input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="Kategori" />
      <MoneyField value={form.amount} onChange={(amount) => setForm({ ...form, amount })} />
      <NativeSelect
        value={form.paymentMethod}
        onChange={(paymentMethod) => setForm({ ...form, paymentMethod })}
        options={paymentMethods()}
      />
      <Input value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Notlar" />
    </FormModal>
  );
}

export function PaymentModal({
  business,
  saving,
  onCreateCustomer,
  onClose,
  onSubmit,
}: {
  business: Business;
  saving: boolean;
  onCreateCustomer: (customer: CustomerProfile) => Promise<void>;
  onClose: () => void;
  onSubmit: (item: PaymentItem) => void;
}) {
  const [form, setForm] = useState({
    date: todayInput(),
    customerId: "",
    customerName: "",
    amount: "0",
    method: "Nakit",
    source: "Manuel",
    notes: "",
  });
  const [newCustomerName, setNewCustomerName] = useState("");

  function selectCustomer(selection: CustomerSelection) {
    setForm({
      ...form,
      customerId: selection.id?.startsWith("contact:") ? "" : selection.id || "",
      customerName: selection.name,
    });
  }

  return (
    <>
      <FormModal
        title="Yeni tahsilat"
        saving={saving}
        onClose={onClose}
        onSave={() =>
          onSubmit({
            id: createId(),
            ...form,
            customerId: form.customerId || undefined,
            amount: parseNumber(form.amount),
            createdAt: new Date().toISOString(),
          })
        }
      >
        <Input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
        <CustomerPicker
          value={form.customerName}
          selectedId={form.customerId}
          customers={business.customers || []}
          contacts={[]}
          onTextChange={(customerName) =>
            setForm({ ...form, customerName, customerId: "" })
          }
          onSelect={selectCustomer}
          onCreateCustomer={(name) => setNewCustomerName(name)}
        />
        <MoneyField value={form.amount} onChange={(amount) => setForm({ ...form, amount })} />
        <NativeSelect value={form.method} onChange={(method) => setForm({ ...form, method })} options={paymentMethods()} />
        <Input value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Notlar" />
      </FormModal>
      {newCustomerName && (
        <CustomerModal
          saving={saving}
          initialName={newCustomerName}
          onClose={() => setNewCustomerName("")}
          onSubmit={async (customer) => {
            await onCreateCustomer(customer);
            setForm({
              ...form,
              customerId: customer.id,
              customerName: customer.name,
            });
            setNewCustomerName("");
          }}
        />
      )}
    </>
  );
}

export function LedgerModal({
  business,
  title,
  saving,
  onCreateCustomer,
  onClose,
  onSubmit,
}: {
  business: Business;
  title: string;
  saving: boolean;
  onCreateCustomer: (customer: CustomerProfile) => Promise<void>;
  onClose: () => void;
  onSubmit: (item: LedgerItem) => void;
}) {
  const [form, setForm] = useState({
    date: todayInput(),
    personName: "",
    amount: "0",
    paidAmount: "0",
    description: "",
    customerId: "",
  });
  const [newCustomerName, setNewCustomerName] = useState("");
  function selectCustomer(selection: CustomerSelection) {
    setForm({
      ...form,
      customerId: selection.id?.startsWith("contact:") ? "" : selection.id || "",
      personName: selection.name,
    });
  }
  return (
    <>
      <FormModal
        title={title}
        saving={saving}
        onClose={onClose}
        onSave={() =>
          onSubmit({
            id: createId(),
            date: form.date,
            customerId: form.customerId || undefined,
            personName: form.personName,
            amount: parseNumber(form.amount),
            paidAmount: parseNumber(form.paidAmount),
            description: form.description,
            status:
              parseNumber(form.paidAmount) >= parseNumber(form.amount)
                ? "Kapandı"
                : "Aktif",
            createdAt: new Date().toISOString(),
          })
        }
      >
        <Input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
        <CustomerPicker
          value={form.personName}
          selectedId={form.customerId}
          customers={business.customers || []}
          contacts={[]}
          onTextChange={(personName) =>
            setForm({ ...form, personName, customerId: "" })
          }
          onSelect={selectCustomer}
          onCreateCustomer={(name) => setNewCustomerName(name)}
        />
        <MoneyField value={form.amount} onChange={(amount) => setForm({ ...form, amount })} />
        <MoneyField value={form.paidAmount} onChange={(paidAmount) => setForm({ ...form, paidAmount })} />
        <Input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Açıklama" />
      </FormModal>
      {newCustomerName && (
        <CustomerModal
          saving={saving}
          initialName={newCustomerName}
          onClose={() => setNewCustomerName("")}
          onSubmit={async (customer) => {
            await onCreateCustomer(customer);
            setForm({
              ...form,
              customerId: customer.id,
              personName: customer.name,
            });
            setNewCustomerName("");
          }}
        />
      )}
    </>
  );
}

export function CommissionModal({
  business,
  saving,
  onClose,
  onSubmit,
}: {
  business: Business;
  saving: boolean;
  onClose: () => void;
  onSubmit: (item: CommissionItem) => void;
}) {
  const [form, setForm] = useState({
    date: todayInput(),
    staffId: business.staff?.[0]?.id || "",
    source: "Randevu",
    amount: "0",
  });
  return (
    <FormModal
      title="Yeni komisyon"
      saving={saving}
      onClose={onClose}
      onSave={() =>
        onSubmit({
          id: createId(),
          date: form.date,
          staffId: form.staffId,
          source: form.source,
          amount: parseNumber(form.amount),
          status: "Aktif",
        })
      }
    >
      <Input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
      <NativeSelect
        value={form.staffId}
        onChange={(staffId) => setForm({ ...form, staffId })}
        options={(business.staff || []).map((staff) => ({ value: staff.id, label: staff.name }))}
      />
      <Input value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value })} placeholder="Kaynak" />
      <MoneyField value={form.amount} onChange={(amount) => setForm({ ...form, amount })} />
    </FormModal>
  );
}

function FormModal({
  title,
  saving,
  onClose,
  onSave,
  children,
}: {
  title: string;
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-start bg-slate-950/35 p-6">
      <section className="mx-auto mt-4 w-full max-w-md rounded bg-white shadow-xl">
        <ModalHeader title={title} onClose={onClose} />
        <div className="grid gap-2 p-4">
          {children}
          <Button type="button" disabled={saving} onClick={onSave}>
            Kaydet
          </Button>
        </div>
      </section>
    </div>
  );
}

function MoneyField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex">
      <Input value={value} onChange={(event) => onChange(event.target.value)} className="rounded-r-none" />
      <span className="grid h-8 place-items-center rounded-r border border-l-0 border-slate-300 bg-slate-50 px-3 text-xs font-semibold text-emerald-700">
        TL
      </span>
    </div>
  );
}

const pageMeta: Record<PageKind, { title: string; canCreate: boolean }> = {
  expenses: { title: "Masraflar", canCreate: true },
  payments: { title: "Tahsilatlar", canCreate: true },
  receivables: { title: "Alacaklar", canCreate: true },
  debts: { title: "Borçlar", canCreate: true },
  commissions: { title: "Randevu Komisyonları", canCreate: true },
  reviews: { title: "Yorumlar", canCreate: false },
  calls: { title: "Arama kayıtları", canCreate: false },
};

function getKind(view: ViewId): PageKind {
  if (view === "other/payment/list") return "payments";
  if (view === "other/receivable/list") return "receivables";
  if (view === "other/debt/list") return "debts";
  if (view === "other/commissions") return "commissions";
  if (view === "other/review/list") return "reviews";
  if (view === "other/call_log/list") return "calls";
  return "expenses";
}

function paymentMethods() {
  return ["Nakit", "Kredi kartı", "Havale", "Online ödeme", "Diğer"].map((value) => ({
    value,
    label: value,
  }));
}

function filterByPeriod<T>(rows: T[], period: string, getDate: (item: T) => string) {
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  if (period === "Bugün") return rows.filter((item) => getDate(item) === todayKey);
  if (period === "Dün") {
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayKey = yesterday.toISOString().slice(0, 10);
    return rows.filter((item) => getDate(item) === yesterdayKey);
  }
  if (period === "Bu ay") {
    const monthKey = todayKey.slice(0, 7);
    return rows.filter((item) => getDate(item).startsWith(monthKey));
  }
  return [...rows];
}

function dateSorter<T extends { date: string }>(desc: boolean) {
  return (a: T, b: T) =>
    desc ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date);
}

function getFinanceExportRows(
  kind: PageKind,
  rows: {
    expenses: ExpenseItem[];
    payments: PaymentItem[];
    receivables: LedgerItem[];
    debts: LedgerItem[];
    commissions: CommissionItem[];
    reviews: ReviewItem[];
    calls: CallLogItem[];
  },
) {
  if (kind === "expenses") {
    return {
      headers: ["Tarih", "Kategori", "Başlık", "Tutar", "Ödeme yöntemi"],
      rows: rows.expenses.map((item) => [
        item.date,
        item.category,
        item.title,
        item.amount,
        item.paymentMethod,
      ]),
    };
  }
  if (kind === "payments") {
    return {
      headers: ["Tarih", "Müşteri", "Tutar", "Ödeme yöntemi"],
      rows: rows.payments.map((item) => [
        item.date,
        item.customerName,
        item.amount,
        item.method,
      ]),
    };
  }
  if (kind === "receivables" || kind === "debts") {
    const ledgerRows = kind === "receivables" ? rows.receivables : rows.debts;
    return {
      headers: ["Tarih", "Kişi", "Açıklama", "Toplam", "Ödenen", "Kalan"],
      rows: ledgerRows.map((item) => [
        item.date,
        item.personName,
        item.description,
        item.amount,
        item.paidAmount,
        Math.max(0, item.amount - item.paidAmount),
      ]),
    };
  }
  if (kind === "commissions") {
    return {
      headers: ["Tarih", "Personel", "Kaynak", "Tutar", "Durum"],
      rows: rows.commissions.map((item) => [
        item.date,
        item.staffId,
        item.source,
        item.amount,
        item.status,
      ]),
    };
  }
  if (kind === "reviews") {
    return {
      headers: ["Tarih", "Müşteri", "Puan", "Kanal", "Yorum", "Durum"],
      rows: rows.reviews.map((item) => [
        item.date,
        item.customerName,
        item.rating,
        item.channel,
        item.comment,
        item.status,
      ]),
    };
  }
  return {
    headers: ["Tarih", "Müşteri", "Telefon", "Yön", "Sonuç", "Notlar"],
    rows: rows.calls.map((item) => [
      item.date,
      item.customerName,
      item.phone,
      item.direction,
      item.result,
      item.notes,
    ]),
  };
}

function exportFinanceCsv(
  kind: PageKind,
  payload: { headers: Array<string | number>; rows: Array<Array<string | number>> },
) {
  const escapeCell = (value: string | number) =>
    `"${String(value).replaceAll('"', '""')}"`;
  const csv = [payload.headers, ...payload.rows]
    .map((row) => row.map(escapeCell).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${downloadTitle(kind)} - ${todayFileDate()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadTitle(kind: PageKind) {
  return {
    expenses: "Expenses",
    payments: "Collections",
    receivables: "Receivables",
    debts: "Debts",
    commissions: "Commissions",
    reviews: "Reviews",
    calls: "Call Logs",
  }[kind];
}

function todayFileDate() {
  return new Date().toISOString().slice(0, 10);
}

function sum<T extends Record<string, unknown>>(rows: T[], key: keyof T) {
  return rows.reduce((total, item) => total + Number(item[key] || 0), 0);
}

function money(value: number) {
  return `${Math.round(value * 100) / 100} TL`;
}

function displayDate(value: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

function parseNumber(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function createId() {
  return globalThis.crypto?.randomUUID?.() || `id-${Date.now()}-${Math.random()}`;
}
