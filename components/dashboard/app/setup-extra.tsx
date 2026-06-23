"use client";

import type React from "react";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Business,
  ClientTagItem,
  ModalHeader,
  NativeSelect,
  PackageCatalogItem,
  ProductCatalogItem,
  SpecialWorkingHourItem,
  ViewId,
} from "./shared";

type SaveBusiness = (fields: Partial<Business>) => Promise<boolean>;

export function SetupExtraPage({
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
  if (view === "setup/special-working-hours") {
    return (
      <SpecialWorkingHoursPage
        business={business}
        saving={saving}
        onUpdateAndSave={onUpdateAndSave}
      />
    );
  }
  if (view === "setup/products") {
    return (
      <ProductsSetupPage
        business={business}
        saving={saving}
        onUpdateAndSave={onUpdateAndSave}
      />
    );
  }
  if (view === "setup/service_packages") {
    return (
      <ServicePackagesSetupPage
        business={business}
        saving={saving}
        onUpdateAndSave={onUpdateAndSave}
      />
    );
  }
  if (view === "setup/tag_settings") {
    return (
      <TagsSetupPage
        business={business}
        saving={saving}
        onUpdateAndSave={onUpdateAndSave}
      />
    );
  }
  return null;
}

function SpecialWorkingHoursPage({
  business,
  saving,
  onUpdateAndSave,
}: {
  business: Business;
  saving: boolean;
  onUpdateAndSave: SaveBusiness;
}) {
  const promotions = business.promotions || {};
  const rows = promotions.specialWorkingHours || [];
  const [modalOpen, setModalOpen] = useState(false);
  async function save(rowsNext: SpecialWorkingHourItem[]) {
    setModalOpen(false);
    await onUpdateAndSave({ promotions: { ...promotions, specialWorkingHours: rowsNext } });
  }
  return (
    <SetupTableShell title="Dönemsel çalışma saatleri" onNew={() => setModalOpen(true)}>
      <DataTable
        headers={["Başlık", "Tarih", "Durum", "Saat", "Personel", ""]}
        rows={rows.map((item) => [
          item.title,
          displayDate(item.date),
          item.open ? "Açık" : "Kapalı",
          item.open ? `${item.start} - ${item.end}` : "-",
          item.staffIds.length
            ? item.staffIds
                .map((id) => business.staff?.find((staff) => staff.id === id)?.name)
                .filter(Boolean)
                .join(", ")
            : "Tüm personel",
          <DeleteButton key={item.id} onClick={() => save(rows.filter((row) => row.id !== item.id))} />,
        ])}
      />
      {modalOpen && (
        <SpecialWorkingHourModal
          business={business}
          saving={saving}
          onClose={() => setModalOpen(false)}
          onSubmit={(item) => save([item, ...rows])}
        />
      )}
    </SetupTableShell>
  );
}

function ProductsSetupPage({
  business,
  saving,
  onUpdateAndSave,
}: {
  business: Business;
  saving: boolean;
  onUpdateAndSave: SaveBusiness;
}) {
  const promotions = business.promotions || {};
  const rows = promotions.products || [];
  const [editing, setEditing] = useState<ProductCatalogItem | null>(null);
  async function saveProduct(item: ProductCatalogItem) {
    setEditing(null);
    await onUpdateAndSave({
      promotions: {
        ...promotions,
        products: rows.some((row) => row.id === item.id)
          ? rows.map((row) => (row.id === item.id ? item : row))
          : [item, ...rows],
      },
    });
  }
  return (
    <SetupTableShell title="Ürünler" onNew={() => setEditing(emptyProduct())}>
      <DataTable
        headers={["Ürün", "Barkod", "Fiyat", ""]}
        rows={rows.map((item) => [
          item.name,
          item.barcode || "-",
          money(item.price),
          <Button key={item.id} type="button" variant="outline" onClick={() => setEditing(item)}>
            Düzenle
          </Button>,
        ])}
      />
      {editing && (
        <ProductModal
          item={editing}
          saving={saving}
          onClose={() => setEditing(null)}
          onSubmit={saveProduct}
        />
      )}
    </SetupTableShell>
  );
}

function ServicePackagesSetupPage({
  business,
  saving,
  onUpdateAndSave,
}: {
  business: Business;
  saving: boolean;
  onUpdateAndSave: SaveBusiness;
}) {
  const promotions = business.promotions || {};
  const rows = promotions.packages || [];
  const [editing, setEditing] = useState<PackageCatalogItem | null>(null);
  async function savePackage(item: PackageCatalogItem) {
    setEditing(null);
    await onUpdateAndSave({
      promotions: {
        ...promotions,
        packages: rows.some((row) => row.id === item.id)
          ? rows.map((row) => (row.id === item.id ? item : row))
          : [item, ...rows],
      },
    });
  }
  return (
    <SetupTableShell title="Paketler" onNew={() => setEditing(emptyPackage(business))}>
      <DataTable
        headers={["Paket", "Tip", "Hizmet", "Miktar", "Fiyat", ""]}
        rows={rows.map((item) => [
          item.name,
          item.type,
          business.services?.find((service) => service.id === item.serviceId)?.name || "-",
          item.quantity,
          money(item.price),
          <Button key={item.id} type="button" variant="outline" onClick={() => setEditing(item)}>
            Düzenle
          </Button>,
        ])}
      />
      {editing && (
        <PackageModal
          business={business}
          item={editing}
          saving={saving}
          onClose={() => setEditing(null)}
          onSubmit={savePackage}
        />
      )}
    </SetupTableShell>
  );
}

function TagsSetupPage({
  business,
  saving,
  onUpdateAndSave,
}: {
  business: Business;
  saving: boolean;
  onUpdateAndSave: SaveBusiness;
}) {
  const promotions = business.promotions || {};
  const rows = promotions.tags || [];
  const [editing, setEditing] = useState<ClientTagItem | null>(null);
  async function saveTag(item: ClientTagItem) {
    setEditing(null);
    await onUpdateAndSave({
      promotions: {
        ...promotions,
        tags: rows.some((row) => row.id === item.id)
          ? rows.map((row) => (row.id === item.id ? item : row))
          : [item, ...rows],
      },
    });
  }
  return (
    <SetupTableShell title="Etiket ayarları" onNew={() => setEditing(emptyTag())}>
      <DataTable
        headers={["Etiket", "Renk", "İndirim", ""]}
        rows={rows.map((item) => [
          item.name,
          <span key={`${item.id}-color`} className="inline-flex items-center gap-2">
            <span className="size-4 rounded" style={{ backgroundColor: item.color }} />
            {item.color}
          </span>,
          `${item.discountRate}%`,
          <Button key={item.id} type="button" variant="outline" onClick={() => setEditing(item)}>
            Düzenle
          </Button>,
        ])}
      />
      {editing && (
        <TagModal
          item={editing}
          saving={saving}
          onClose={() => setEditing(null)}
          onSubmit={saveTag}
        />
      )}
    </SetupTableShell>
  );
}

function SetupTableShell({
  title,
  onNew,
  children,
}: {
  title: string;
  onNew: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h1 className="text-2xl font-semibold text-slate-700">{title}</h1>
        <Button type="button" onClick={onNew} className="min-w-40 bg-[#24a647] text-white">
          <Plus className="size-4" />
          Yeni
        </Button>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}

function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: Array<Array<React.ReactNode>>;
}) {
  return (
    <table className="w-full min-w-[760px] text-left text-sm">
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
  );
}

function ProductModal({
  item,
  saving,
  onClose,
  onSubmit,
}: {
  item: ProductCatalogItem;
  saving: boolean;
  onClose: () => void;
  onSubmit: (item: ProductCatalogItem) => void;
}) {
  const [form, setForm] = useState({
    ...item,
    price: String(item.price),
  });
  return (
    <FormModal
      title={item.name ? "Ürün düzenle" : "Yeni ürün"}
      saving={saving}
      onClose={onClose}
      onSave={() => onSubmit({ ...form, price: parseNumber(form.price) })}
    >
      <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Ürün adı" />
      <Input value={form.barcode} onChange={(event) => setForm({ ...form, barcode: event.target.value })} placeholder="Barkod" />
      <MoneyField value={form.price} onChange={(price) => setForm({ ...form, price })} />
    </FormModal>
  );
}

function PackageModal({
  business,
  item,
  saving,
  onClose,
  onSubmit,
}: {
  business: Business;
  item: PackageCatalogItem;
  saving: boolean;
  onClose: () => void;
  onSubmit: (item: PackageCatalogItem) => void;
}) {
  const [form, setForm] = useState({
    ...item,
    quantity: String(item.quantity),
    price: String(item.price),
  });
  return (
    <FormModal
      title={item.name ? "Paket düzenle" : "Yeni paket"}
      saving={saving}
      onClose={onClose}
      onSave={() =>
        onSubmit({
          ...form,
          quantity: parseNumber(form.quantity),
          price: parseNumber(form.price),
        })
      }
    >
      <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Paket adı" />
      <NativeSelect
        value={form.type}
        onChange={(type) => setForm({ ...form, type })}
        options={["Seans", "Süre", "Ürün"].map((value) => ({ value, label: value }))}
      />
      <NativeSelect
        value={form.serviceId}
        onChange={(serviceId) => setForm({ ...form, serviceId })}
        options={(business.services || []).map((service) => ({
          value: service.id,
          label: service.name,
        }))}
      />
      <Input value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} placeholder="Miktar" />
      <MoneyField value={form.price} onChange={(price) => setForm({ ...form, price })} />
    </FormModal>
  );
}

function TagModal({
  item,
  saving,
  onClose,
  onSubmit,
}: {
  item: ClientTagItem;
  saving: boolean;
  onClose: () => void;
  onSubmit: (item: ClientTagItem) => void;
}) {
  const [form, setForm] = useState({
    ...item,
    discountRate: String(item.discountRate),
  });
  return (
    <FormModal
      title={item.name ? "Etiket düzenle" : "Yeni etiket"}
      saving={saving}
      onClose={onClose}
      onSave={() => onSubmit({ ...form, discountRate: parseNumber(form.discountRate) })}
    >
      <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Etiket adı" />
      <Input type="color" value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} />
      <Input value={form.discountRate} onChange={(event) => setForm({ ...form, discountRate: event.target.value })} placeholder="İndirim yüzdesi" />
    </FormModal>
  );
}

function SpecialWorkingHourModal({
  business,
  saving,
  onClose,
  onSubmit,
}: {
  business: Business;
  saving: boolean;
  onClose: () => void;
  onSubmit: (item: SpecialWorkingHourItem) => void;
}) {
  const [form, setForm] = useState({
    title: "",
    date: todayInput(),
    open: "true",
    start: "09:00",
    end: "18:00",
    staffId: "all",
  });
  return (
    <FormModal
      title="Yeni dönemsel çalışma saati"
      saving={saving}
      onClose={onClose}
      onSave={() =>
        onSubmit({
          id: createId(),
          title: form.title || "Dönemsel saat",
          date: form.date,
          open: form.open === "true",
          start: form.start,
          end: form.end,
          staffIds: form.staffId === "all" ? [] : [form.staffId],
        })
      }
    >
      <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Başlık" />
      <Input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
      <NativeSelect
        value={form.open}
        onChange={(open) => setForm({ ...form, open })}
        options={[
          { value: "true", label: "Açık" },
          { value: "false", label: "Kapalı" },
        ]}
      />
      <div className="grid grid-cols-2 gap-2">
        <Input value={form.start} onChange={(event) => setForm({ ...form, start: event.target.value })} />
        <Input value={form.end} onChange={(event) => setForm({ ...form, end: event.target.value })} />
      </div>
      <NativeSelect
        value={form.staffId}
        onChange={(staffId) => setForm({ ...form, staffId })}
        options={[
          { value: "all", label: "Tüm personel" },
          ...(business.staff || []).map((staff) => ({ value: staff.id, label: staff.name })),
        ]}
      />
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

function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" variant="destructive" size="icon-sm" onClick={onClick}>
      <Trash2 className="size-4" />
    </Button>
  );
}

function emptyProduct(): ProductCatalogItem {
  return { id: createId(), name: "", barcode: "", price: 0 };
}

function emptyPackage(business: Business): PackageCatalogItem {
  return {
    id: createId(),
    name: "",
    type: "Seans",
    serviceId: business.services?.[0]?.id || "",
    quantity: 1,
    price: 0,
  };
}

function emptyTag(): ClientTagItem {
  return { id: createId(), name: "", color: "#5f86b6", discountRate: 0 };
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

function money(value: number) {
  return `${Math.round(value * 100) / 100} TL`;
}

function createId() {
  return globalThis.crypto?.randomUUID?.() || `id-${Date.now()}-${Math.random()}`;
}
