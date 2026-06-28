"use client";

import { Download, FileText, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Breadcrumb, Business, ViewId } from "./shared";
import { getAccessTill, hasDashboardAccess } from "@/lib/access";

const MONTHLY_PRICE = 500;
const PAYMENT_IBAN = "0000";

export function AccountPage({
  view,
  business,
}: {
  view: ViewId;
  business: Business;
}) {
  const access = getAccessState(business);
  const invoices = buildInvoices(access);

  if (view === "invoice/list") {
    return (
      <SimpleAccountShell title="Faturalar">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-y border-slate-200 text-slate-700">
            <tr>
              <th className="px-3 py-3">Fatura tarihi</th>
              <th className="px-3 py-3">Açıklama</th>
              <th className="px-3 py-3">Tutar</th>
              <th className="px-3 py-3">Durum</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="border-b border-slate-100">
                <td className="px-3 py-3">{invoice.date}</td>
                <td className="px-3 py-3">{invoice.description}</td>
                <td className="px-3 py-3">{invoice.amount} TL</td>
                <td className="px-3 py-3">{invoice.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </SimpleAccountShell>
    );
  }

  return (
    <SimpleAccountShell title="Üyelik">
        <SubscriptionPanel
          business={business}
          access={access}
        />
    </SimpleAccountShell>
  );
}

function SubscriptionPanel({
  business,
  access,
}: {
  business: Business;
  access: AccessState;
}) {
  const paymentRequired = !access.active;
  const [paymentOpen, setPaymentOpen] = useState(paymentRequired);
  return (
    <>
      <div className="grid gap-3 md:grid-cols-4">
        <InfoCard
          label="İşletme"
          value={business.name || business.slug || "-"}
        />
        <InfoCard label="Plan" value={`Aloyz - ${MONTHLY_PRICE} TL / ay`} />
        <InfoCard
          label="Durum"
          value={access.active ? "Aktif" : "Ödeme bekleniyor"}
        />
        <InfoCard label="Erişim bitişi" value={formatDate(access.accessTill)} />
      </div>

      <div className="mt-4 rounded border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        {paymentRequired ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              Deneme süreniz sona erdi. Devam etmek için aylık {MONTHLY_PRICE}{" "}
              TL ödemeyi aşağıdaki IBAN'a gönderebilirsiniz.
            </div>
            <Button
              type="button"
              className="bg-slate-900 text-white"
              onClick={() => setPaymentOpen(true)}
            >
              Ödeme bilgileri
            </Button>
          </div>
        ) : access.trialActive ? (
          <div>
            Deneme sürenizde {access.daysLeft} gün kaldı. Deneme süresi bittikten
            sonra abonelik aylık {MONTHLY_PRICE} TL olarak devam eder.
          </div>
        ) : (
          <div>
            Üyeliğiniz aktif. Erişim bitiş tarihiniz:{" "}
            <strong>{formatDate(access.accessTill)}</strong>.
          </div>
        )}
      </div>

      {paymentOpen && (
        <PaymentInfoModal
          email={business.email || "hesap e-postanız"}
          onClose={() => setPaymentOpen(false)}
        />
      )}
    </>
  );
}

function PaymentInfoModal({
  email,
  onClose,
}: {
  email: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-start bg-slate-950/35 p-6">
      <section className="mx-auto mt-8 w-full max-w-md rounded bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="font-semibold">Ödeme bilgileri</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded hover:bg-slate-100"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="grid gap-3 p-4 text-sm">
          <div className="rounded border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs font-semibold uppercase text-slate-500">
              IBAN
            </div>
            <div className="mt-1 font-mono text-lg font-semibold">
              {PAYMENT_IBAN}
            </div>
          </div>
          <p>
            Açıklama kısmına hesap e-postanızı yazın:
            <strong> {email}</strong>
          </p>
          <p>
            Ödemenizi yapmanızla beraber en fazla 1 gün içinde erişiminiz güncellenir.
          </p>
          <Button
            type="button"
            onClick={onClose}
            className="bg-[#5f86b6] text-white"
          >
            Tamam
          </Button>
        </div>
      </section>
    </div>
  );
}

function SimpleAccountShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <Breadcrumb items={[{ label: "Aloyz", view: "dashboard" }, title]} />
      <section className="rounded bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h1 className="text-xl font-semibold text-slate-700">{title}</h1>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.print()}
            >
              <FileText className="size-4" />
              Detay
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => downloadAccountCsv(title)}
            >
              <Download className="size-4" />
              İndir
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto p-4">{children}</div>
      </section>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-slate-200 bg-white p-4">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-semibold text-slate-700">{value}</div>
    </div>
  );
}

type AccessState = {
  createdAt: Date;
  trialEndsAt: Date;
  accessTill: Date;
  daysLeft: number;
  active: boolean;
  trialActive: boolean;
};

function getAccessState(business: Business): AccessState {
  const createdAtValue = business.createdAt;
  const createdAt = createdAtValue ? new Date(createdAtValue) : new Date();
  const safeCreatedAt = Number.isNaN(createdAt.getTime())
    ? new Date()
    : createdAt;
  const trialEndsAt = new Date(safeCreatedAt);
  trialEndsAt.setDate(safeCreatedAt.getDate() + 14);
  const accessTill = getAccessTill(business.botSettings, business.createdAt);
  const diffDays = Math.ceil((accessTill.getTime() - Date.now()) / 86_400_000);
  return {
    createdAt: safeCreatedAt,
    trialEndsAt,
    accessTill,
    daysLeft: Math.max(0, diffDays),
    active: hasDashboardAccess(business.botSettings, business.createdAt),
    trialActive: Date.now() <= trialEndsAt.getTime(),
  };
}

function buildInvoices(access: AccessState) {
  if (access.active && !access.trialActive) {
    return [
      {
        id: "active-subscription",
        date: formatDate(new Date()),
        description: "Aloyz aylık abonelik",
        amount: MONTHLY_PRICE,
        status: "Aktif",
      },
    ];
  }
  if (access.trialActive && access.active) {
    return [
      {
        id: "trial",
        date: formatDate(access.createdAt),
        description: "14 günlük ücretsiz deneme",
        amount: 0,
        status: "Aktif",
      },
    ];
  }
  return [
    {
      id: "monthly-current",
      date: formatDate(access.accessTill),
      description: "Aloyz aylık abonelik",
      amount: MONTHLY_PRICE,
      status: "Ödeme bekleniyor",
    },
  ];
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function downloadAccountCsv(title: string) {
  const rows = collectVisibleRows();
  const csv = rows.length
    ? rows.map((row) => row.map(escapeCsv).join(",")).join("\n")
    : `Başlık,${escapeCsv(title)}\nTarih,${escapeCsv(new Date().toISOString())}`;
  downloadBlob(`${accountDownloadTitle(title)} - ${todayFileDate()}.csv`, csv);
}

function collectVisibleRows() {
  const table = document.querySelector("section table");
  if (table) {
    return Array.from(table.querySelectorAll("tr")).map((row) =>
      Array.from(row.querySelectorAll("th,td")).map(
        (cell) => cell.textContent?.trim() || "",
      ),
    );
  }
  return Array.from(document.querySelectorAll("section .rounded.border")).map(
    (card) =>
      Array.from(card.querySelectorAll("div")).map(
        (node) => node.textContent?.trim() || "",
      ),
  );
}

function escapeCsv(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function downloadBlob(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function accountDownloadTitle(title: string) {
  return (
    {
      "Üyelik": "Subscription",
      "Faturalar": "Invoices",
    }[title] || title
  );
}

function todayFileDate() {
  return new Date().toISOString().slice(0, 10);
}
