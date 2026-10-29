"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { ContactRow, CustomerProfile } from "./shared";

export type CustomerSelection = {
  id?: string;
  name: string;
  phone?: string;
  email?: string;
  source: "customer" | "contact" | "manual";
};

export function CustomerPicker({
  value,
  selectedId,
  customers,
  contacts = [],
  placeholder = "Müşteri",
  onTextChange,
  onSelect,
  onCreateCustomer,
}: {
  value: string;
  selectedId?: string;
  customers: CustomerProfile[];
  contacts?: ContactRow[];
  placeholder?: string;
  onTextChange: (value: string) => void;
  onSelect: (selection: CustomerSelection) => void;
  onCreateCustomer: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const baseRows = useMemo(() => {
    const rows: CustomerSelection[] = [];
    const seen = new Set<string>();
    const keyFor = (item: CustomerSelection) => {
      const phone = String(item.phone || "").replace(/\D/g, "");
      if (phone) return `phone:${phone}`;
      const email = String(item.email || "").trim().toLocaleLowerCase("tr-TR");
      if (email) return `email:${email}`;
      return `${item.source}:${item.id || item.name.toLocaleLowerCase("tr-TR")}`;
    };
    const push = (item: CustomerSelection) => {
      const key = keyFor(item);
      if (seen.has(key)) return;
      seen.add(key);
      rows.push(item);
    };

    for (const customer of customers) {
      push({
        id: customer.id,
        name: customer.name,
        phone: [customer.countryCode, customer.phone].filter(Boolean).join(" "),
        email: customer.email,
        source: "customer",
      });
    }
    for (const contact of contacts) {
      push({
        id: `contact:${contact.id}`,
        name: contact.name,
        phone: contact.phone,
        email: contact.username,
        source: "contact",
      });
    }
    return rows;
  }, [contacts, customers]);

  const matches = useMemo(() => {
    const query = value.trim().toLocaleLowerCase("tr-TR");
    if (!query) return baseRows.slice(0, 6);
    return baseRows
      .filter(
        (item) =>
          item.name.toLocaleLowerCase("tr-TR").startsWith(query) ||
          (item.phone || "").toLocaleLowerCase("tr-TR").startsWith(query) ||
          (item.email || "").toLocaleLowerCase("tr-TR").startsWith(query),
      )
      .slice(0, 6);
  }, [baseRows, value]);

  return (
    <div className="relative">
      <Input
        value={value}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          onTextChange(event.target.value);
          setOpen(true);
        }}
        placeholder={placeholder}
        aria-autocomplete="list"
      />
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded border border-slate-200 bg-white shadow-lg">
          {matches.map((item) => (
            <button
              key={`${item.source}-${item.id || item.name}`}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onSelect(item);
                setOpen(false);
              }}
              className={[
                "block w-full px-3 py-2 text-left text-sm hover:bg-slate-50",
                selectedId === item.id ? "bg-slate-50 font-semibold" : "",
              ].join(" ")}
            >
              <span className="block font-medium">{item.name}</span>
              {(item.phone || item.email) && (
                <span className="block truncate text-xs text-slate-500">
                  {[item.phone, item.email].filter(Boolean).join(" · ")}
                </span>
              )}
            </button>
          ))}
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              onCreateCustomer(value.trim());
              setOpen(false);
            }}
            className="block w-full border-t border-slate-100 px-3 py-2 text-left text-sm font-semibold text-[#24a647] hover:bg-slate-50"
          >
            + Yeni müşteri olarak ekle
          </button>
        </div>
      )}
    </div>
  );
}
