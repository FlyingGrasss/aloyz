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
  const matches = useMemo(() => {
    const query = value.trim().toLocaleLowerCase("tr-TR");
    const customerRows: CustomerSelection[] = customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      phone: [customer.countryCode, customer.phone].filter(Boolean).join(" "),
      email: customer.email,
      source: "customer",
    }));
    const contactRows: CustomerSelection[] = contacts.map((contact) => ({
      id: `contact:${contact.id}`,
      name: contact.name,
      phone: contact.phone,
      email: contact.username,
      source: "contact",
    }));
    return [...customerRows, ...contactRows]
      .filter((item, index, list) => {
        const firstIndex = list.findIndex(
          (other) =>
            other.name.toLocaleLowerCase("tr-TR") ===
            item.name.toLocaleLowerCase("tr-TR"),
        );
        return firstIndex === index;
      })
      .filter((item) => {
        if (!query) return true;
        return (
          item.name.toLocaleLowerCase("tr-TR").startsWith(query) ||
          (item.phone || "").toLocaleLowerCase("tr-TR").startsWith(query) ||
          (item.email || "").toLocaleLowerCase("tr-TR").startsWith(query)
        );
      })
      .slice(0, 6);
  }, [contacts, customers, value]);

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
