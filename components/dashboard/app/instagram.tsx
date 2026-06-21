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

export function InstagramMessagesPage({
  business,
  contacts,
}: {
  business: Business;
  contacts: ContactRow[];
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const instagramContacts = contacts.filter(
    (contact) => contact.channel === "instagram",
  );
  const [activeId, setActiveId] = useState<string | null>(
    instagramContacts[0]?.id || null,
  );
  const active =
    instagramContacts.find((contact) => contact.id === activeId) ||
    instagramContacts[0] ||
    null;
  const messages = active ? getConversationMessages(active.conversation) : [];
  const account = business.instagram_page_id || business.slug || "emre.bozqurt";
  return (
    <div className="min-h-[calc(100vh-96px)] rounded bg-white shadow-sm">
      <div className="grid min-h-[620px] md:grid-cols-[286px_1fr]">
        <aside className="border-r border-slate-200 p-4">
          <div className="relative flex items-center justify-between">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="font-semibold"
            >
              Instagram {account}⌄
            </button>
            <Search className="size-5" />
            {menuOpen && (
              <div className="absolute left-0 top-8 z-20 w-48 rounded border border-slate-200 bg-white py-1 text-sm shadow">
                <button className="block w-full px-3 py-2 text-left hover:bg-slate-50">
                  Instagram profilini görüntüle
                </button>
                <button className="block w-full px-3 py-2 text-left hover:bg-slate-50">
                  Salon DM ayarları
                </button>
                <button className="block w-full px-3 py-2 text-left hover:bg-slate-50">
                  Instagram'a Yeniden Bağlan
                </button>
                <button className="block w-full px-3 py-2 text-left text-red-600 hover:bg-slate-50">
                  Instagram bağlantısını kes
                </button>
              </div>
            )}
          </div>
          <h2 className="mt-5 font-semibold">Mesajlar</h2>
          <div className="mt-4 flex gap-2 text-sm">
            {["Tümü", "Okunmamış", "Diğer"].map((tab) => (
              <button
                key={tab}
                className="rounded-full border border-slate-300 px-4 py-1"
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="mt-6 space-y-1">
            {instagramContacts.map((contact) => (
              <button
                key={contact.id}
                type="button"
                onClick={() => setActiveId(contact.id)}
                className={`block w-full rounded px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                  active?.id === contact.id ? "bg-[#fff4e8]" : ""
                }`}
              >
                <span className="block font-semibold">{contact.name}</span>
                <span className="block truncate text-xs text-slate-500">
                  {contact.lastMessage || "Mesaj yok"}
                </span>
              </button>
            ))}
            {instagramContacts.length === 0 && (
              <div className="mt-10 text-center text-sm font-semibold text-slate-700">
                Sohbet bulunamadı
              </div>
            )}
          </div>
        </aside>
        <section className="flex min-h-0 flex-col">
          {active ? (
            <>
              <div className="border-b border-slate-200 px-4 py-3">
                <h2 className="font-semibold">{active.name}</h2>
                <p className="text-sm text-slate-500">
                  {active.username || active.subtitle || account}
                </p>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto bg-slate-900 p-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`mb-3 flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[76%] rounded px-3 py-2 text-sm leading-relaxed ${
                        message.role === "user"
                          ? "bg-[#5f86b6] text-white"
                          : "bg-slate-800 text-slate-100"
                      }`}
                    >
                      <div className="mb-1 text-[10px] font-semibold opacity-70">
                        {message.role === "user" ? "Müşteri" : "Asistan"}
                      </div>
                      <div className="whitespace-pre-wrap">{message.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="grid flex-1 place-items-center">
              <div className="text-center">
                <MessageCircle className="mx-auto size-12 text-pink-600" />
                <h2 className="mt-3 font-semibold">Mesajlar</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Instagram hesabınıza gelen mesajları Aloyz üzerinden yönetin
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
