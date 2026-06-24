"use client";

import type React from "react";
import { useMemo, useState } from "react";
import {
  ChevronDown,
  FileText,
  Plus,
  RefreshCw,
  Settings,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Breadcrumb,
  Business,
  ModalHeader,
  NativeSelect,
  PackageCatalogItem,
  PackageSaleItem,
  PackageSaleLine,
  ProductCatalogItem,
  ProductSaleItem,
  ProductSaleLine,
  PromotionsSettings,
  CustomerProfile,
} from "./shared";
import { CustomerModal } from "./customers";
import { CustomerPicker, CustomerSelection } from "./customer-picker";

type SaveBusiness = (fields: Partial<Business>) => Promise<boolean>;

const defaultPromotions: PromotionsSettings = {
  cashReward: "",
  cardReward: "",
  rewardUsage: "",
  birthdayDiscount: "",
  onlineBookingDiscount: "",
  products: [],
  packages: [],
  productSales: [],
  packageSales: [],
};

export function ProductSalesPage({
  business,
  saving,
  onUpdateAndSave,
}: {
  business: Business;
  saving: boolean;
  onUpdateAndSave: SaveBusiness;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [period, setPeriod] = useState("Bu ay");
  const [sortDesc, setSortDesc] = useState(true);
  const promotions = normalizePromotions(business.promotions);
  const sales = filterSalesByPeriod(promotions.productSales || [], period).sort(
    (a, b) =>
      sortDesc
        ? b.date.localeCompare(a.date)
        : a.date.localeCompare(b.date),
  );
  const total = sales.reduce((sum, sale) => sum + sale.total, 0);

  async function saveSale(
    sale: ProductSaleItem,
    products: ProductCatalogItem[],
  ) {
    setModalOpen(false);
    await onUpdateAndSave({
      promotions: {
        ...promotions,
        products,
        productSales: [sale, ...sales],
      },
    });
  }

  return (
    <SalesShell
      title="Ürün satışları"
      newLabel="Yeni"
      period={period}
      onPeriodChange={setPeriod}
      onRefresh={() => setSortDesc((value) => !value)}
      onDownload={() =>
        downloadCsv(
          "urun-satislari.csv",
          ["Satış tarihi", "Müşteri", "Ürün", "Toplam tutar", "Ödenen tutar"],
          sales.map((sale) => [
            sale.date,
            sale.customerName,
            sale.lines.map((line) => line.name).join(", "),
            sale.total,
            sale.paidAmount,
          ]),
        )
      }
      onNew={() => setModalOpen(true)}
    >
      <table className="w-full min-w-[980px] text-left text-sm">
        <thead className="border-y border-slate-200 text-slate-700">
          <tr>
            {[
              "Satış tarihi",
              "Müşteri",
              "Ürün",
              "Satıcı",
              "Adet",
              "Toplam tutar",
              "Ödenen tutar",
              "Kalan ödeme",
              "Oluşturan",
              "Oluşturulma",
            ].map((label) => (
              <th key={label} className="px-3 py-3 font-semibold">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sales.map((sale) => (
            <tr key={sale.id} className="border-b border-slate-100">
              <td className="px-3 py-3">{formatDisplayDate(sale.date)}</td>
              <td className="px-3 py-3">{sale.customerName || "-"}</td>
              <td className="px-3 py-3">{sale.lines.map((line) => line.name).join(", ")}</td>
              <td className="px-3 py-3">{staffName(business, sale.sellerId)}</td>
              <td className="px-3 py-3">
                {sale.lines.reduce((sum, line) => sum + line.quantity, 0)}
              </td>
              <td className="px-3 py-3">{sale.total} TL</td>
              <td className="px-3 py-3">{sale.paidAmount} TL</td>
              <td className="px-3 py-3">{sale.total - sale.paidAmount} TL</td>
              <td className="px-3 py-3">{sale.createdBy}</td>
              <td className="px-3 py-3">{formatDisplayDate(sale.createdAt.slice(0, 10))}</td>
            </tr>
          ))}
          <tr className="border-b border-slate-200 bg-slate-50 font-semibold">
            <td colSpan={10} className="px-3 py-3">
              Sayfadaki ürün satışlarının toplam tutarı: {total} TL
            </td>
          </tr>
          <tr className="bg-slate-50 font-semibold">
            <td colSpan={10} className="px-3 py-3">
              Toplam kayıt sayısı: {sales.length}
            </td>
          </tr>
        </tbody>
      </table>
      {modalOpen && (
        <ProductSaleModal
          business={business}
          products={promotions.products || []}
          saving={saving}
          onCreateCustomer={async (customer) => {
            await onUpdateAndSave({
              customers: [customer, ...(business.customers || [])],
            });
          }}
          onClose={() => setModalOpen(false)}
          onSubmit={saveSale}
        />
      )}
    </SalesShell>
  );
}

export function PackageSalesPage({
  business,
  saving,
  onUpdateAndSave,
}: {
  business: Business;
  saving: boolean;
  onUpdateAndSave: SaveBusiness;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [period, setPeriod] = useState("Bu ay");
  const [sortDesc, setSortDesc] = useState(true);
  const promotions = normalizePromotions(business.promotions);
  const sales = filterSalesByPeriod(promotions.packageSales || [], period).sort(
    (a, b) =>
      sortDesc
        ? b.date.localeCompare(a.date)
        : a.date.localeCompare(b.date),
  );
  const total = sales.reduce((sum, sale) => sum + sale.total, 0);

  async function saveSale(
    sale: PackageSaleItem,
    packages: PackageCatalogItem[],
  ) {
    setModalOpen(false);
    await onUpdateAndSave({
      promotions: {
        ...promotions,
        packages,
        packageSales: [sale, ...sales],
      },
    });
  }

  return (
    <SalesShell
      title="Paket satışları"
      newLabel="Yeni"
      period={period}
      onPeriodChange={setPeriod}
      onRefresh={() => setSortDesc((value) => !value)}
      onDownload={() =>
        downloadCsv(
          "paket-satislari.csv",
          ["Satış tarihi", "Müşteri", "Hizmet", "Toplam tutar", "Ödenen tutar"],
          sales.map((sale) => [
            sale.date,
            sale.customerName,
            sale.lines.map((line) => line.name).join(", "),
            sale.total,
            sale.paidAmount,
          ]),
        )
      }
      onNew={() => setModalOpen(true)}
    >
      <table className="w-full min-w-[1060px] text-left text-sm">
        <thead className="border-y border-slate-200 text-slate-700">
          <tr>
            {[
              "Satış tarihi",
              "Müşteri",
              "Satıcı",
              "Hizmet",
              "Miktar",
              "Kullanılan",
              "Kalan kullanım",
              "Toplam tutar",
              "Ödenen tutar",
              "Kalan ödeme",
              "Oluşturan",
              "Geçerlilik bitişi",
              "Oluşturulma",
            ].map((label) => (
              <th key={label} className="px-3 py-3 font-semibold">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sales.map((sale) => {
            const quantity = sale.lines.reduce((sum, line) => sum + line.quantity, 0);
            return (
              <tr key={sale.id} className="border-b border-slate-100">
                <td className="px-3 py-3">{formatDisplayDate(sale.date)}</td>
                <td className="px-3 py-3">{sale.customerName || "-"}</td>
                <td className="px-3 py-3">{staffName(business, sale.sellerId)}</td>
                <td className="px-3 py-3">
                  {sale.lines.map((line) => serviceName(business, line.serviceId) || line.name).join(", ")}
                </td>
                <td className="px-3 py-3">{quantity}</td>
                <td className="px-3 py-3">0</td>
                <td className="px-3 py-3">{quantity}</td>
                <td className="px-3 py-3">{sale.total} TL</td>
                <td className="px-3 py-3">{sale.paidAmount} TL</td>
                <td className="px-3 py-3">{sale.total - sale.paidAmount} TL</td>
                <td className="px-3 py-3">{sale.createdBy}</td>
                <td className="px-3 py-3">-</td>
                <td className="px-3 py-3">{formatDisplayDate(sale.createdAt.slice(0, 10))}</td>
              </tr>
            );
          })}
          <tr className="border-b border-slate-200 bg-slate-50 font-semibold">
            <td colSpan={13} className="px-3 py-3">
              Sayfadaki paket satışlarının toplam tutarı: {total} TL
            </td>
          </tr>
          <tr className="bg-slate-50 font-semibold">
            <td colSpan={13} className="px-3 py-3">
              Toplam kayıt sayısı: {sales.length}
            </td>
          </tr>
        </tbody>
      </table>
      {modalOpen && (
        <PackageSaleModal
          business={business}
          packages={promotions.packages || []}
          saving={saving}
          onCreateCustomer={async (customer) => {
            await onUpdateAndSave({
              customers: [customer, ...(business.customers || [])],
            });
          }}
          onClose={() => setModalOpen(false)}
          onSubmit={saveSale}
        />
      )}
    </SalesShell>
  );
}

function SalesShell({
  title,
  newLabel,
  period,
  onPeriodChange,
  onRefresh,
  onDownload,
  onNew,
  children,
}: {
  title: string;
  newLabel: string;
  period: string;
  onPeriodChange: (value: string) => void;
  onRefresh: () => void;
  onDownload: () => void;
  onNew: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <Breadcrumb items={[{ label: "Aloyz", view: "dashboard" }, title]} />
      <section className="rounded bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <h1 className="text-xl font-semibold text-slate-700">{title}</h1>
          <div className="flex items-center gap-3">
            <NativeSelect
              value={period}
              onChange={onPeriodChange}
              options={["Bu ay", "Bugün", "Geçen ay", "Bu yıl", "Tümü"].map((value) => ({
                value,
                label: value,
              }))}
            />
            <Button type="button" onClick={onNew} className="min-w-44 bg-[#24a647] text-white">
              <Plus className="size-4" />
              {newLabel}
            </Button>
          </div>
        </div>
        <div className="border-b border-slate-200 bg-slate-100 px-4 py-3">
          <div className="flex flex-wrap justify-between gap-2">
            <Button type="button" variant="secondary" onClick={onRefresh}>
              Filtrele / Sırala
            </Button>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={() => window.print()}
              >
                <Settings className="size-4" />
              </Button>
              <Button type="button" variant="outline" size="icon-sm" onClick={onRefresh}>
                <RefreshCw className="size-4" />
              </Button>
              <Button type="button" variant="outline" onClick={onDownload}>
                <FileText className="size-4" />
                İndir
                <ChevronDown className="size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  window.alert("İçe aktarma için ürün ve paketleri Kurulum bölümünden ekleyin.")
                }
              >
                <Upload className="size-4" />
                İçe aktar
                <ChevronDown className="size-4" />
              </Button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">{children}</div>
      </section>
    </div>
  );
}

export function ProductSaleModal({
  business,
  products,
  saving,
  onCreateCustomer,
  onClose,
  onSubmit,
}: {
  business: Business;
  products: ProductCatalogItem[];
  saving: boolean;
  onCreateCustomer: (customer: CustomerProfile) => Promise<void>;
  onClose: () => void;
  onSubmit: (sale: ProductSaleItem, products: ProductCatalogItem[]) => void;
}) {
  const [date, setDate] = useState(todayInput());
  const [customerName, setCustomerName] = useState("");
  const [customerId, setCustomerId] = useState<string | undefined>();
  const [sellerId, setSellerId] = useState("");
  const [notes, setNotes] = useState("");
  const [paid, setPaid] = useState(false);
  const [catalog, setCatalog] = useState(products);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newProductForLine, setNewProductForLine] = useState<{
    lineId: string;
    name: string;
    amount: number;
  } | null>(null);
  const [lines, setLines] = useState<ProductSaleLine[]>([
    { id: createId(), productId: "", name: "", quantity: 1, amount: 0 },
  ]);

  const total = lines.reduce((sum, line) => sum + line.quantity * line.amount, 0);

  function submit() {
    onSubmit(
      {
        id: createId(),
        date,
        customerId,
        customerName,
        sellerId,
        notes,
        lines,
        paid,
        total,
        paidAmount: paid ? total : 0,
        createdBy: "Aloyz",
        createdAt: new Date().toISOString(),
      },
      catalog,
    );
  }

  function selectCustomer(selection: CustomerSelection) {
    setCustomerName(selection.name);
    setCustomerId(selection.id?.startsWith("contact:") ? undefined : selection.id);
  }

  function saveProduct(product: ProductCatalogItem) {
    setCatalog([product, ...catalog]);
    if (newProductForLine) {
      setLines((current) =>
        current.map((line) =>
          line.id === newProductForLine.lineId
            ? {
                ...line,
                productId: product.id,
                name: product.name,
                amount: product.price,
              }
            : line,
        ),
      );
    }
    setNewProductForLine(null);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-start bg-slate-950/35 p-6">
      <section className="mx-auto mt-4 w-full max-w-lg rounded bg-white shadow-xl">
        <ModalHeader title="Yeni ürün satışı" onClose={onClose} />
        <div className="grid gap-2 p-4">
          <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          <CustomerPicker
            value={customerName}
            selectedId={customerId}
            customers={business.customers || []}
            contacts={[]}
            onTextChange={(value) => {
              setCustomerName(value);
              setCustomerId(undefined);
            }}
            onSelect={selectCustomer}
            onCreateCustomer={(name) => setNewCustomerName(name)}
          />
          {lines.map((line, index) => (
            <ProductLineEditor
              key={line.id}
              line={line}
              products={catalog}
              onCatalogChange={setCatalog}
              onCreateProduct={(name, lineId, amount) =>
                setNewProductForLine({ name, lineId, amount })
              }
              onChange={(nextLine) =>
                setLines(lines.map((item) => (item.id === line.id ? nextLine : item)))
              }
              onRemove={() => setLines(lines.filter((item) => item.id !== line.id))}
              removable={lines.length > 1}
            />
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setLines([
                ...lines,
                { id: createId(), productId: "", name: "", quantity: 1, amount: 0 },
              ])
            }
          >
            + Bir ürün daha ekle
          </Button>
          <NativeSelect
            value={sellerId}
            onChange={setSellerId}
            options={[
              { value: "", label: "Satıcı" },
              ...(business.staff || []).map((staff) => ({
                value: staff.id,
                label: staff.name,
              })),
            ]}
          />
          <Input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notlar" />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={paid}
              onChange={(event) => setPaid(event.target.checked)}
            />
            Tüm tutar tahsil edildi
          </label>
          <Button type="button" disabled={saving || !customerName.trim()} onClick={submit}>
            Kaydet
          </Button>
        </div>
      </section>
      {newCustomerName && (
        <CustomerModal
          saving={saving}
          initialName={newCustomerName}
          onClose={() => setNewCustomerName("")}
          onSubmit={async (customer) => {
            await onCreateCustomer(customer);
            setCustomerName(customer.name);
            setCustomerId(customer.id);
            setNewCustomerName("");
          }}
        />
      )}
      {newProductForLine && (
        <ProductCatalogModal
          initialName={newProductForLine.name}
          initialPrice={newProductForLine.amount}
          saving={saving}
          onClose={() => setNewProductForLine(null)}
          onSubmit={saveProduct}
        />
      )}
    </div>
  );
}

export function PackageSaleModal({
  business,
  packages,
  saving,
  onCreateCustomer,
  onClose,
  onSubmit,
}: {
  business: Business;
  packages: PackageCatalogItem[];
  saving: boolean;
  onCreateCustomer: (customer: CustomerProfile) => Promise<void>;
  onClose: () => void;
  onSubmit: (sale: PackageSaleItem, packages: PackageCatalogItem[]) => void;
}) {
  const [date, setDate] = useState(todayInput());
  const [customerName, setCustomerName] = useState("");
  const [customerId, setCustomerId] = useState<string | undefined>();
  const [sellerId, setSellerId] = useState("");
  const [notes, setNotes] = useState("");
  const [hasExpiry, setHasExpiry] = useState(false);
  const [openPaymentWindow, setOpenPaymentWindow] = useState(false);
  const [createReceivable, setCreateReceivable] = useState(false);
  const [catalog, setCatalog] = useState(packages);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newPackageForLine, setNewPackageForLine] = useState<{
    lineId: string;
    name: string;
    amount: number;
    quantity: number;
    packageType: string;
    serviceId: string;
  } | null>(null);
  const [lines, setLines] = useState<PackageSaleLine[]>([
    {
      id: createId(),
      packageId: "",
      name: "",
      packageType: "Paket tipi",
      serviceId: "",
      quantity: 1,
      amount: 0,
    },
  ]);
  const total = lines.reduce((sum, line) => sum + line.quantity * line.amount, 0);

  function submit() {
    onSubmit(
      {
        id: createId(),
        date,
        customerId,
        customerName,
        sellerId,
        notes,
        lines,
        hasExpiry,
        openPaymentWindow,
        createReceivable,
        total,
        paidAmount: createReceivable ? 0 : total,
        createdBy: "Aloyz",
        createdAt: new Date().toISOString(),
      },
      catalog,
    );
  }

  function selectCustomer(selection: CustomerSelection) {
    setCustomerName(selection.name);
    setCustomerId(selection.id?.startsWith("contact:") ? undefined : selection.id);
  }

  function savePackage(item: PackageCatalogItem) {
    setCatalog([item, ...catalog]);
    if (newPackageForLine) {
      setLines((current) =>
        current.map((line) =>
          line.id === newPackageForLine.lineId
            ? {
                ...line,
                packageId: item.id,
                name: item.name,
                packageType: item.type,
                serviceId: item.serviceId,
                quantity: item.quantity,
                amount: item.price,
              }
            : line,
        ),
      );
    }
    setNewPackageForLine(null);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-start bg-slate-950/35 p-6">
      <section className="mx-auto mt-4 w-full max-w-lg rounded bg-white shadow-xl">
        <ModalHeader title="Yeni paket satışı" onClose={onClose} />
        <div className="grid gap-2 p-4">
          <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          <CustomerPicker
            value={customerName}
            selectedId={customerId}
            customers={business.customers || []}
            contacts={[]}
            onTextChange={(value) => {
              setCustomerName(value);
              setCustomerId(undefined);
            }}
            onSelect={selectCustomer}
            onCreateCustomer={(name) => setNewCustomerName(name)}
          />
          {lines.map((line) => (
            <PackageLineEditor
              key={line.id}
              business={business}
              line={line}
              packages={catalog}
              onCatalogChange={setCatalog}
              onCreatePackage={(name, selectedLine) =>
                setNewPackageForLine({
                  lineId: selectedLine.id,
                  name,
                  amount: selectedLine.amount,
                  quantity: selectedLine.quantity,
                  packageType: selectedLine.packageType,
                  serviceId: selectedLine.serviceId,
                })
              }
              onChange={(nextLine) =>
                setLines(lines.map((item) => (item.id === line.id ? nextLine : item)))
              }
              onRemove={() => setLines(lines.filter((item) => item.id !== line.id))}
              removable={lines.length > 1}
            />
          ))}
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setLines([
                  ...lines,
                  {
                    id: createId(),
                    packageId: "",
                    name: "",
                    packageType: "Paket tipi",
                    serviceId: "",
                    quantity: 1,
                    amount: 0,
                  },
                ])
              }
            >
              + Yeni paket ekle
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={catalog.length === 0}
              onClick={() => {
                const firstPackage = catalog[0];
                if (!firstPackage) return;
                setLines([
                  ...lines,
                  {
                    id: createId(),
                    packageId: firstPackage.id,
                    name: firstPackage.name,
                    packageType: firstPackage.type,
                    serviceId: firstPackage.serviceId,
                    quantity: firstPackage.quantity,
                    amount: firstPackage.price,
                  },
                ]);
              }}
            >
              + Kayıtlı paketlerden seç
            </Button>
          </div>
          <NativeSelect
            value={sellerId}
            onChange={setSellerId}
            options={[
              { value: "", label: "Satıcı" },
              ...(business.staff || []).map((staff) => ({
                value: staff.id,
                label: staff.name,
              })),
            ]}
          />
          <Input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notlar" />
          <CheckboxLine checked={hasExpiry} onChange={setHasExpiry} label="Son geçerlilik tarihi" />
          <CheckboxLine
            checked={openPaymentWindow}
            onChange={setOpenPaymentWindow}
            label="Eklendikten sonra ödeme penceresini aç"
          />
          <CheckboxLine
            checked={createReceivable}
            onChange={setCreateReceivable}
            label="Tüm tutar için alacak kaydı oluştur"
          />
          <Button type="button" disabled={saving || !customerName.trim()} onClick={submit}>
            Kaydet
          </Button>
        </div>
      </section>
      {newCustomerName && (
        <CustomerModal
          saving={saving}
          initialName={newCustomerName}
          onClose={() => setNewCustomerName("")}
          onSubmit={async (customer) => {
            await onCreateCustomer(customer);
            setCustomerName(customer.name);
            setCustomerId(customer.id);
            setNewCustomerName("");
          }}
        />
      )}
      {newPackageForLine && (
        <PackageCatalogModal
          business={business}
          initialName={newPackageForLine.name}
          initialPrice={newPackageForLine.amount}
          initialQuantity={newPackageForLine.quantity}
          initialType={newPackageForLine.packageType}
          initialServiceId={newPackageForLine.serviceId}
          saving={saving}
          onClose={() => setNewPackageForLine(null)}
          onSubmit={savePackage}
        />
      )}
    </div>
  );
}

function ProductLineEditor({
  line,
  products,
  onCatalogChange,
  onCreateProduct,
  onChange,
  onRemove,
  removable,
}: {
  line: ProductSaleLine;
  products: ProductCatalogItem[];
  onCatalogChange: (products: ProductCatalogItem[]) => void;
  onCreateProduct: (name: string, lineId: string, amount: number) => void;
  onChange: (line: ProductSaleLine) => void;
  onRemove: () => void;
  removable: boolean;
}) {
  return (
    <div className="grid grid-cols-[1fr_64px_92px_32px] gap-2">
      <CatalogSearch
        value={line.name}
        placeholder="Ürün adı veya barkoduyla arayın"
        items={products}
        getLabel={(product) => product.name}
        getSubtitle={(product) => product.barcode}
        createLabel="Yeni ürün ekle"
        onPick={(product) =>
          onChange({
            ...line,
            productId: product.id,
            name: product.name,
            amount: product.price,
          })
        }
        onCreate={(name) => onCreateProduct(name, line.id, line.amount)}
        onText={(name) => onChange({ ...line, name })}
      />
      <Input
        value={line.quantity}
        onChange={(event) =>
          onChange({ ...line, quantity: parseNumber(event.target.value, 1) })
        }
        aria-label="Adet"
      />
      <MoneyInput
        value={line.amount}
        onChange={(amount) => onChange({ ...line, amount })}
      />
      <button
        type="button"
        disabled={!removable}
        onClick={onRemove}
        className="grid size-8 place-items-center rounded bg-red-50 text-red-600 disabled:opacity-30"
        aria-label="Ürünü sil"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

function PackageLineEditor({
  business,
  line,
  packages,
  onCatalogChange,
  onCreatePackage,
  onChange,
  onRemove,
  removable,
}: {
  business: Business;
  line: PackageSaleLine;
  packages: PackageCatalogItem[];
  onCatalogChange: (packages: PackageCatalogItem[]) => void;
  onCreatePackage: (name: string, line: PackageSaleLine) => void;
  onChange: (line: PackageSaleLine) => void;
  onRemove: () => void;
  removable: boolean;
}) {
  return (
    <div className="grid grid-cols-[72px_110px_1fr_92px_32px] gap-2">
      <Input
        value={line.quantity}
        onChange={(event) =>
          onChange({ ...line, quantity: parseNumber(event.target.value, 1) })
        }
        placeholder="Miktar"
      />
      <NativeSelect
        value={line.packageType}
        onChange={(packageType) => onChange({ ...line, packageType })}
        options={["Paket tipi", "Seans", "Süre", "Ürün"].map((value) => ({
          value,
          label: value,
        }))}
      />
      <CatalogSearch
        value={line.name}
        placeholder="Hizmet"
        items={packages}
        getLabel={(item) => item.name}
        getSubtitle={(item) => serviceName(business, item.serviceId)}
        createLabel="Yeni paket ekle"
        onPick={(item) =>
          onChange({
            ...line,
            packageId: item.id,
            name: item.name,
            packageType: item.type,
            serviceId: item.serviceId,
            quantity: item.quantity,
            amount: item.price,
          })
        }
        onCreate={(name) => onCreatePackage(name, line)}
        onText={(name) => onChange({ ...line, name })}
      />
      <MoneyInput
        value={line.amount}
        onChange={(amount) => onChange({ ...line, amount })}
      />
      <button
        type="button"
        disabled={!removable}
        onClick={onRemove}
        className="grid size-8 place-items-center rounded bg-red-50 text-red-600 disabled:opacity-30"
        aria-label="Paketi sil"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

function CatalogSearch<T extends { id: string }>({
  value,
  placeholder,
  items,
  getLabel,
  getSubtitle,
  createLabel,
  onPick,
  onCreate,
  onText,
}: {
  value: string;
  placeholder: string;
  items: T[];
  getLabel: (item: T) => string;
  getSubtitle: (item: T) => string;
  createLabel: string;
  onPick: (item: T) => void;
  onCreate: (name: string) => void;
  onText: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const matches = useMemo(() => {
    const query = value.trim().toLocaleLowerCase("tr-TR");
    if (!query) return items.slice(0, 5);
    return items
      .filter((item) => getLabel(item).toLocaleLowerCase("tr-TR").startsWith(query))
      .slice(0, 5);
  }, [getLabel, items, value]);

  return (
    <div className="relative">
      <Input
        value={value}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          onText(event.target.value);
          setOpen(true);
        }}
        placeholder={placeholder}
      />
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded border border-slate-200 bg-white shadow-lg">
          {matches.map((item) => (
            <button
              key={item.id}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onPick(item);
                setOpen(false);
              }}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
            >
              <span className="block font-medium">{getLabel(item)}</span>
              {getSubtitle(item) && (
                <span className="block text-xs text-slate-500">{getSubtitle(item)}</span>
              )}
            </button>
          ))}
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              onCreate(value.trim() || "Yeni kayıt");
              setOpen(false);
            }}
            className="block w-full border-t border-slate-100 px-3 py-2 text-left text-sm font-medium text-[#1f7a3a] hover:bg-slate-50"
          >
            + {createLabel}
          </button>
        </div>
      )}
    </div>
  );
}

function MoneyInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex">
      <Input
        value={value}
        onChange={(event) => onChange(parseNumber(event.target.value, 0))}
        aria-label="Tutar"
        className="rounded-r-none"
      />
      <span className="grid h-8 place-items-center rounded-r border border-l-0 border-slate-300 bg-slate-50 px-3 text-xs font-semibold text-emerald-700">
        TL
      </span>
    </div>
  );
}

function CheckboxLine({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}

function ProductCatalogModal({
  initialName,
  initialPrice,
  saving,
  onClose,
  onSubmit,
}: {
  initialName: string;
  initialPrice: number;
  saving: boolean;
  onClose: () => void;
  onSubmit: (product: ProductCatalogItem) => void;
}) {
  const [form, setForm] = useState({
    name: initialName,
    barcode: "",
    price: String(initialPrice || 0),
  });
  return (
    <div className="fixed inset-0 z-[60] grid place-items-start bg-slate-950/35 p-6">
      <section className="mx-auto mt-8 w-full max-w-md rounded bg-white shadow-xl">
        <ModalHeader title="Yeni ürün" onClose={onClose} />
        <div className="grid gap-2 p-4">
          <Input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Ürün adı"
          />
          <Input
            value={form.barcode}
            onChange={(event) =>
              setForm({ ...form, barcode: event.target.value })
            }
            placeholder="Barkod"
          />
          <MoneyTextInput
            value={form.price}
            onChange={(price) => setForm({ ...form, price })}
          />
          <Button
            type="button"
            disabled={saving || !form.name.trim()}
            onClick={() =>
              onSubmit({
                id: createId(),
                name: form.name.trim(),
                barcode: form.barcode.trim(),
                price: parseNumber(form.price, 0),
              })
            }
          >
            Kaydet
          </Button>
        </div>
      </section>
    </div>
  );
}

function PackageCatalogModal({
  business,
  initialName,
  initialPrice,
  initialQuantity,
  initialType,
  initialServiceId,
  saving,
  onClose,
  onSubmit,
}: {
  business: Business;
  initialName: string;
  initialPrice: number;
  initialQuantity: number;
  initialType: string;
  initialServiceId: string;
  saving: boolean;
  onClose: () => void;
  onSubmit: (item: PackageCatalogItem) => void;
}) {
  const [form, setForm] = useState({
    name: initialName,
    type: initialType || "Seans",
    serviceId: initialServiceId || business.services?.[0]?.id || "",
    quantity: String(initialQuantity || 1),
    price: String(initialPrice || 0),
  });
  return (
    <div className="fixed inset-0 z-[60] grid place-items-start bg-slate-950/35 p-6">
      <section className="mx-auto mt-8 w-full max-w-md rounded bg-white shadow-xl">
        <ModalHeader title="Yeni paket" onClose={onClose} />
        <div className="grid gap-2 p-4">
          <Input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Paket adı"
          />
          <NativeSelect
            value={form.type}
            onChange={(type) => setForm({ ...form, type })}
            options={["Seans", "Süre", "Ürün"].map((value) => ({
              value,
              label: value,
            }))}
          />
          <NativeSelect
            value={form.serviceId}
            onChange={(serviceId) => setForm({ ...form, serviceId })}
            options={(business.services || []).map((service) => ({
              value: service.id,
              label: service.name,
            }))}
          />
          <Input
            value={form.quantity}
            onChange={(event) =>
              setForm({ ...form, quantity: event.target.value })
            }
            placeholder="Miktar"
          />
          <MoneyTextInput
            value={form.price}
            onChange={(price) => setForm({ ...form, price })}
          />
          <Button
            type="button"
            disabled={saving || !form.name.trim()}
            onClick={() =>
              onSubmit({
                id: createId(),
                name: form.name.trim(),
                type: form.type,
                serviceId: form.serviceId,
                quantity: parseNumber(form.quantity, 1),
                price: parseNumber(form.price, 0),
              })
            }
          >
            Kaydet
          </Button>
        </div>
      </section>
    </div>
  );
}

function MoneyTextInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex">
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        inputMode="decimal"
        className="rounded-r-none"
        placeholder="Tutar"
      />
      <span className="grid h-8 place-items-center rounded-r border border-l-0 border-slate-300 bg-slate-50 px-3 text-xs font-semibold text-emerald-700">
        TL
      </span>
    </div>
  );
}

function normalizePromotions(value: PromotionsSettings | undefined) {
  return {
    ...defaultPromotions,
    ...(value || {}),
    products: value?.products || [],
    packages: value?.packages || [],
    productSales: value?.productSales || [],
    packageSales: value?.packageSales || [],
  };
}

function filterSalesByPeriod<
  T extends { date: string },
>(rows: T[], period: string) {
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const monthKey = todayKey.slice(0, 7);
  const previousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    .toISOString()
    .slice(0, 7);
  if (period === "Bugün") return rows.filter((row) => row.date === todayKey);
  if (period === "Bu ay") return rows.filter((row) => row.date.startsWith(monthKey));
  if (period === "Geçen ay") {
    return rows.filter((row) => row.date.startsWith(previousMonth));
  }
  if (period === "Bu yıl") {
    return rows.filter((row) => row.date.startsWith(todayKey.slice(0, 4)));
  }
  return [...rows];
}

function downloadCsv(
  filename: string,
  headers: Array<string | number>,
  rows: Array<Array<string | number>>,
) {
  const escapeCell = (value: string | number) =>
    `"${String(value).replaceAll('"', '""')}"`;
  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCell).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function staffName(business: Business, staffId: string) {
  return business.staff?.find((staff) => staff.id === staffId)?.name || "-";
}

function serviceName(business: Business, serviceId: string) {
  return business.services?.find((service) => service.id === serviceId)?.name || "";
}

function parseNumber(value: string, fallback: number) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

function formatDisplayDate(value: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function createId() {
  return globalThis.crypto?.randomUUID?.() || `id-${Date.now()}-${Math.random()}`;
}
