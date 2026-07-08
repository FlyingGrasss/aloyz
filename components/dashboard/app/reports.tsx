"use client";

import type React from "react";
import { useState } from "react";
import { CalendarDays, Download, Filter, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  Business,
  CheckoutItem,
  PackageSaleItem,
  ProductSaleItem,
  ViewId,
} from "./shared";

export function ReportPage({
  view,
  business,
}: {
  view: ViewId;
  business: Business;
}) {
  if (view === "report/staff") return <StaffReport business={business} />;
  if (view === "report/sales") return <SalesReport business={business} />;
  return <CashierReport business={business} />;
}

function ReportShell({
  title,
  period,
  sortDesc,
  onPeriodChange,
  onSortChange,
  showSort = true,
  children,
}: {
  title: string;
  period: ReportPeriod;
  sortDesc: boolean;
  onPeriodChange: (period: ReportPeriod) => void;
  onSortChange: () => void;
  showSort?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <Breadcrumb items={[{ label: "Aloyz", view: "dashboard" }, title]} />
      <section className="rounded bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <h1 className="text-xl font-semibold text-slate-700">{title}</h1>
          <div className="flex items-center gap-2">
            <select
              value={period}
              onChange={(event) => onPeriodChange(event.target.value as ReportPeriod)}
              className="h-8 rounded border border-slate-300 bg-white px-3 text-sm"
            >
              {REPORT_PERIODS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <Button type="button" variant="outline" onClick={() => window.print()}>
              <CalendarDays className="size-4" />
              Tarih
            </Button>
          </div>
        </div>
        <div className="border-b border-slate-200 bg-slate-100 px-4 py-3">
          <div className="flex justify-between gap-2">
            {showSort ? (
              <Button
                type="button"
                variant="secondary"
                onClick={onSortChange}
              >
                <Filter className="size-4" />
                {sortDesc ? "Yeni → Eski" : "Eski → Yeni"}
              </Button>
            ) : (
              <span className="text-sm text-slate-500">Dönem filtresi aktif</span>
            )}
            <div className="flex gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => downloadReportSnapshot(title, period)}
              >
                <Download className="size-4" />
                İndir
              </Button>
            </div>
          </div>
        </div>
        <div className="p-4">{children}</div>
      </section>
    </div>
  );
}

function downloadReportSnapshot(title: string, period: string) {
  const rows = collectVisibleReportRows(title, period);
  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${reportDownloadTitle(title)} - ${todayFileDate()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function reportDownloadTitle(title: string) {
  return (
    {
      "Kasa raporu": "Cashier Report",
      "Personel raporu": "Staff Report",
      "Satış raporu": "Sales Report",
    }[title] || title
  );
}

function todayFileDate() {
  return new Date().toISOString().slice(0, 10);
}

function collectVisibleReportRows(title: string, period: string) {
  const rows: string[][] = [
    ["Rapor", title],
    ["Dönem", period],
    [],
  ];
  document.querySelectorAll("section table").forEach((table) => {
    table.querySelectorAll("tr").forEach((row) => {
      rows.push(
        Array.from(row.querySelectorAll("th,td")).map(
          (cell) => cell.textContent?.trim() || "",
        ),
      );
    });
    rows.push([]);
  });
  document.querySelectorAll("section .rounded.border").forEach((card) => {
    const text = Array.from(card.querySelectorAll("div"))
      .map((node) => node.textContent?.trim() || "")
      .filter(Boolean);
    if (text.length) rows.push(text);
  });
  return rows;
}

function escapeCsv(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function CashierReport({ business }: { business: Business }) {
  const [period, setPeriod] = useState<ReportPeriod>("Bu ay");
  const [sortDesc, setSortDesc] = useState(true);
  const data = getFinancialSnapshot(business, period);
  return (
    <ReportShell
      title="Kasa raporu"
      period={period}
      sortDesc={sortDesc}
      onPeriodChange={setPeriod}
      onSortChange={() => setSortDesc((value) => !value)}
    >
      <div className="grid gap-3 md:grid-cols-4">
        <ReportCard label="Hizmet toplamı" value={data.checkoutTotal} />
        <ReportCard label="Ürün satışları" value={data.productTotal} />
        <ReportCard label="Paket satışları" value={data.packageTotal} />
        <ReportCard label="Tahsilatlar" value={data.paymentTotal} />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <ReportCard label="Masraflar" value={data.expenseTotal} tone="danger" />
        <ReportCard label="Alacaklar" value={data.receivableRemaining} tone="warning" />
        <ReportCard label="Borçlar" value={data.debtRemaining} tone="warning" />
      </div>
      <SummaryTable
        rows={[
          ["Toplam ciro", data.revenue],
          ["Tahsil edilen", data.collected],
          ["Bekleyen ödeme", data.pending],
          ["Net kasa", data.collected - data.expenseTotal],
        ]}
      />
    </ReportShell>
  );
}

function StaffReport({ business }: { business: Business }) {
  const [period, setPeriod] = useState<ReportPeriod>("Bu ay");
  const [sortDesc, setSortDesc] = useState(true);
  const filteredCheckouts = filterByPeriod(
    business.checkouts || [],
    period,
    (checkout) => checkout.date || checkout.createdAt,
  );
  const filteredCommissions = filterByPeriod(
    business.promotions?.commissions || [],
    period,
    (item) => getItemDate(item),
  );
  const rows = (business.staff || []).map((staff) => {
    const checkouts = filteredCheckouts.filter((checkout) =>
      getCheckoutStaffIds(checkout).includes(staff.id),
    );
    const serviceTotal = checkouts.reduce((sum, checkout) => sum + checkout.amount, 0);
    const staffCommissions = filteredCommissions.filter((item) => item.staffId === staff.id);
    const commissions = staffCommissions
      .filter((item) => item.staffId === staff.id)
      .reduce((sum, item) => sum + item.amount, 0);
    const latestActivity =
      [
        ...checkouts.map((checkout) => checkout.date || checkout.createdAt),
        ...staffCommissions.map((item) => getItemDate(item)),
      ]
        .filter(Boolean)
        .sort()
        .at(-1) || "-";
    return {
      staff: staff.name,
      serviceCount: checkouts.length,
      serviceTotal,
      commission: commissions,
      net: serviceTotal - commissions,
      latestActivity,
    };
  }).sort((a, b) =>
    sortDesc
      ? b.latestActivity.localeCompare(a.latestActivity)
      : a.latestActivity.localeCompare(b.latestActivity),
  );
  return (
    <ReportShell
      title="Personel raporu"
      period={period}
      sortDesc={sortDesc}
      onPeriodChange={setPeriod}
      onSortChange={() => setSortDesc((value) => !value)}
      showSort={false}
    >
      <ReportTable
        headers={["Personel", "Hizmet", "Hizmet tutarı", "Komisyon", "Net", "Son işlem"]}
        rows={rows.map((row) => [
          row.staff,
          row.serviceCount,
          money(row.serviceTotal),
          money(row.commission),
          money(row.net),
          row.latestActivity,
        ])}
      />
    </ReportShell>
  );
}

function SalesReport({ business }: { business: Business }) {
  const [period, setPeriod] = useState<ReportPeriod>("Bu ay");
  const [sortDesc, setSortDesc] = useState(true);
  const productSales = sortByDate(
    filterByPeriod(
      business.promotions?.productSales || [],
      period,
      (item) => item.date || item.createdAt,
    ),
    sortDesc,
    (item) => item.date || item.createdAt,
  );
  const packageSales = sortByDate(
    filterByPeriod(
      business.promotions?.packageSales || [],
      period,
      (item) => item.date || item.createdAt,
    ),
    sortDesc,
    (item) => item.date || item.createdAt,
  );
  const serviceSales = sortByDate(
    filterByPeriod(
      business.checkouts || [],
      period,
      (item) => item.date || item.createdAt,
    ),
    sortDesc,
    (item) => item.date || item.createdAt,
  );
  const rows = [
    {
      type: "Hizmet satışları",
      count: serviceSales.length,
      total: serviceSales.reduce((sum, item) => sum + item.amount, 0),
    },
    {
      type: "Ürün satışları",
      count: productSales.length,
      total: productSales.reduce((sum, item) => sum + item.total, 0),
    },
    {
      type: "Paket satışları",
      count: packageSales.length,
      total: packageSales.reduce((sum, item) => sum + item.total, 0),
    },
  ];
  return (
    <ReportShell
      title="Satış raporu"
      period={period}
      sortDesc={sortDesc}
      onPeriodChange={setPeriod}
      onSortChange={() => setSortDesc((value) => !value)}
      showSort={false}
    >
      <div className="grid gap-3 md:grid-cols-3">
        {rows.map((row) => (
          <ReportCard key={row.type} label={row.type} value={row.total} />
        ))}
      </div>
      <ReportTable
        headers={["Satış tipi", "Kayıt sayısı", "Toplam tutar"]}
        rows={rows.map((row) => [row.type, row.count, money(row.total)])}
      />
    </ReportShell>
  );
}

function ReportCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "danger" | "warning";
}) {
  const toneClass =
    tone === "danger"
      ? "border-red-200 bg-red-50 text-red-800"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-slate-200 bg-white text-slate-700";
  return (
    <div className={`rounded border p-4 ${toneClass}`}>
      <div className="text-sm font-medium">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{money(value)}</div>
    </div>
  );
}

function SummaryTable({ rows }: { rows: Array<[string, number]> }) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <tbody className="divide-y divide-slate-100">
          {rows.map(([label, value]) => (
            <tr key={label}>
              <td className="px-3 py-3 font-medium text-slate-600">{label}</td>
              <td className="px-3 py-3 text-right font-semibold">{money(value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReportTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: Array<Array<string | number>>;
}) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-y border-slate-200 bg-slate-50 text-slate-700">
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
        </tbody>
      </table>
    </div>
  );
}

const REPORT_PERIODS = ["Bu ay", "Bugün", "Dün", "Geçen ay"] as const;
type ReportPeriod = (typeof REPORT_PERIODS)[number];

function getFinancialSnapshot(business: Business, period: ReportPeriod) {
  const checkouts = filterByPeriod(
    business.checkouts || [],
    period,
    (item) => item.date || item.createdAt,
  );
  const productSales = filterByPeriod(
    business.promotions?.productSales || [],
    period,
    (item) => item.date || item.createdAt,
  );
  const packageSales = filterByPeriod(
    business.promotions?.packageSales || [],
    period,
    (item) => item.date || item.createdAt,
  );
  const payments = filterByPeriod(
    business.promotions?.payments || [],
    period,
    (item) => item.date || item.createdAt,
  );
  const expenses = filterByPeriod(
    business.promotions?.expenses || [],
    period,
    (item) => item.date || item.createdAt,
  );
  const receivables = filterByPeriod(
    business.promotions?.receivables || [],
    period,
    (item) => item.date || item.createdAt,
  );
  const debts = filterByPeriod(
    business.promotions?.debts || [],
    period,
    (item) => item.date || item.createdAt,
  );
  const checkoutTotal = checkouts.reduce((sum, item) => sum + item.amount, 0);
  const productTotal = productSales.reduce((sum, item) => sum + item.total, 0);
  const packageTotal = packageSales.reduce((sum, item) => sum + item.total, 0);
  const paymentTotal = payments.reduce((sum, item) => sum + item.amount, 0);
  const expenseTotal = expenses.reduce((sum, item) => sum + item.amount, 0);
  const receivableRemaining = receivables.reduce(
    (sum, item) => sum + Math.max(0, item.amount - item.paidAmount),
    0,
  );
  const debtRemaining = debts.reduce(
    (sum, item) => sum + Math.max(0, item.amount - item.paidAmount),
    0,
  );
  const revenue = checkoutTotal + productTotal + packageTotal;
  const collected =
    paymentTotal +
    checkouts.reduce((sum, item) => sum + paidFromCheckout(item), 0) +
    productSales.reduce((sum, item) => sum + item.paidAmount, 0) +
    packageSales.reduce((sum, item) => sum + item.paidAmount, 0);
  return {
    checkoutTotal,
    productTotal,
    packageTotal,
    paymentTotal,
    expenseTotal,
    receivableRemaining,
    debtRemaining,
    revenue,
    collected,
    pending: Math.max(0, revenue + receivableRemaining - collected),
  };
}

function filterByPeriod<T>(
  items: T[],
  period: ReportPeriod,
  getDate: (item: T) => string | undefined,
) {
  const range = getPeriodRange(period);
  return items.filter((item) => {
    const date = getDateOnly(getDate(item));
    return date >= range.start && date <= range.end;
  });
}

function sortByDate<T>(
  items: T[],
  sortDesc: boolean,
  getDate: (item: T) => string | undefined,
) {
  return [...items].sort((a, b) => {
    const left = getDateOnly(getDate(a));
    const right = getDateOnly(getDate(b));
    return sortDesc ? right.localeCompare(left) : left.localeCompare(right);
  });
}

function getPeriodRange(period: ReportPeriod) {
  const today = new Date();
  const start = new Date(today);
  const end = new Date(today);

  if (period === "Bugün") {
    return { start: formatDateKey(today), end: formatDateKey(today) };
  }

  if (period === "Dün") {
    start.setDate(today.getDate() - 1);
    end.setDate(today.getDate() - 1);
    return { start: formatDateKey(start), end: formatDateKey(end) };
  }

  if (period === "Geçen ay") {
    start.setMonth(today.getMonth() - 1, 1);
    end.setDate(0);
    return { start: formatDateKey(start), end: formatDateKey(end) };
  }

  start.setDate(1);
  end.setMonth(today.getMonth() + 1, 0);
  return { start: formatDateKey(start), end: formatDateKey(end) };
}

function getDateOnly(value?: string) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return formatDateKey(parsed);
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getItemDate(item: { date?: string; createdAt?: string }) {
  return item.date || item.createdAt;
}

function getCheckoutStaffIds(checkout: CheckoutItem) {
  if (checkout.lines?.length) {
    return Array.from(new Set(checkout.lines.map((line) => line.staffId)));
  }
  return checkout.staffId ? [checkout.staffId] : [];
}

function paidFromCheckout(checkout: CheckoutItem) {
  return checkout.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
}

function money(value: number) {
  return `${Math.round(value * 100) / 100} TL`;
}
