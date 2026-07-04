"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ExternalLink, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  Business,
  ContactRow,
  StatusBanner,
  ToggleRow,
  ViewId,
  InstagramBrandIcon,
  getConversationMessages,
} from "./shared";

export function InstagramSetupPage({
  business,
  saving,
  onUpdateAndSave,
  onSelectView,
}: {
  business: Business;
  saving: boolean;
  onUpdateAndSave: (fields: Partial<Business>) => Promise<boolean>;
  onSelectView: (view: ViewId) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [instagramActive, setInstagramActive] = useState(
    !!business.botSettings?.instagram,
  );
  const [testMode, setTestMode] = useState(business.test_mode);
  const connected =
    !!business.instagram_page_id || !!business.botSettings?.instagramConnected;
  const username =
    business.botSettings?.instagramUsername || business.instagram_page_id || "";

  useEffect(() => {
    setInstagramActive(!!business.botSettings?.instagram);
    setTestMode(!!business.test_mode);
  }, [business.botSettings, business.test_mode]);

  function connectInstagram() {
    window.location.href = "/api/integrations/instagram/connect";
  }

  async function disconnectInstagram() {
    setBusy(true);
    try {
      const res = await fetch("/api/integrations/instagram/disconnect", {
        method: "POST",
      });
      if (res.ok) {
        await onUpdateAndSave({
          botSettings: {
            ...(business.botSettings || {}),
            instagramConnected: false,
            instagram: false,
            instagramUsername: "",
            instagramProfilePicture: "",
          },
        });
      }
    } finally {
      setBusy(false);
    }
  }

  async function saveChannelSettings(next: {
    instagram?: boolean;
    testMode?: boolean;
  }) {
    const nextInstagram = next.instagram ?? instagramActive;
    const nextTestMode = next.testMode ?? testMode;
    setInstagramActive(nextInstagram);
    setTestMode(nextTestMode);
    setBusy(true);
    try {
      await onUpdateAndSave({
        botSettings: {
          ...(business.botSettings || {}),
          instagram: nextInstagram,
          instagramConnected: connected,
        },
        test_mode: nextTestMode,
        is_active: nextInstagram ? true : business.is_active,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          { label: "Aloyz", view: "dashboard" },
          { label: "Instagram", view: "messaging/instagram/setup" },
          { label: "IG Kurulumu", view: "messaging/instagram/setup" },
        ]}
        onSelectView={onSelectView}
      />
      <section className="rounded bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-700">
              Instagram Kurulumu
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Instagram profesyonel hesabınızı Aloyz mesaj kutusuna bağlayın.
            </p>
          </div>
          {connected ? (
            <Button
              type="button"
              disabled={busy || saving}
              onClick={disconnectInstagram}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Bağlantıyı Kes
            </Button>
          ) : (
            <Button
              type="button"
              disabled={busy || saving}
              onClick={connectInstagram}
              className="bg-[#24a647] text-white hover:bg-[#1f913e]"
            >
              Instagram ile Giriş Yap
            </Button>
          )}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="rounded border border-slate-200">
            {[
              "Instagram'da Ayarlar > İnternet Sitesi İzinleri bölümünü açın",
              "Uygulamalar ve internet siteleri > Test Kullanıcısı Davetleri sekmesine gidin",
              "Aloyz davetini Kabul Et seçeneğiyle onaylayın",
              "Aloyz'a dönün ve Instagram ile Giriş Yap butonuna basın",
              "Instagram izin ekranını onaylayın; bağlantı tamamlandığında bu sayfaya geri dönersiniz",
            ].map((step, index) => (
              <div
                key={step}
                className="flex items-center gap-3 border-b border-slate-200 p-4 last:border-b-0"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#24a647] text-sm font-semibold leading-none text-white">
                  {index + 1}
                </span>
                <span className="font-semibold text-slate-700">{step}</span>
              </div>
            ))}
            <div className="border-t border-slate-200 p-4">
              <a
                href="https://www.instagram.com/accounts/manage_access/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Test Kullanıcısı Davetlerini Aç
                <ExternalLink className="size-4" />
              </a>
            </div>
          </div>

          <div className="rounded border border-slate-200 p-4">
            <div className="text-sm font-semibold text-slate-700">
              Bağlantı durumu
            </div>
            {connected ? (
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-3">
                  {business.botSettings?.instagramProfilePicture ? (
                    <img
                      src={business.botSettings.instagramProfilePicture}
                      alt=""
                      className="size-12 rounded-full"
                    />
                  ) : (
                    <div className="grid size-12 place-items-center rounded-full bg-pink-100 text-pink-700">
                      <InstagramBrandIcon className="size-5" />
                    </div>
                  )}
                  <div>
                    <div className="font-semibold">
                      {username ? `@${username}` : "Instagram hesabı"}
                    </div>
                    <div className="text-xs text-slate-500">
                      Profesyonel Instagram hesabı bağlandı
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={() => onSelectView("messaging/instagram/list")}
                  className="w-full bg-[#5f86b6] text-white"
                >
                  Mesajlara Git
                </Button>
              </div>
            ) : (
              <StatusBanner tone="warning">
                Bağlantı için Instagram tarafından açılan izin ekranını onaylamanız gerekir. Aloyz bu şekilde hesabı işletmenize kaydeder.
              </StatusBanner>
            )}
          </div>
        </div>
        <div className="mt-5 rounded border border-slate-200 p-3">
          <ToggleRow
            label="Instagram aktif"
            description="Kapalıyken bot gelen mesajlara otomatik yanıt vermez."
            checked={instagramActive}
            onChange={(checked) => saveChannelSettings({ instagram: checked })}
          />
          <ToggleRow
            label="Test modu"
            description="Açıkken bot yalnızca işletmenin kendi kendine gönderdiği mesajlara yanıt verir."
            checked={testMode}
            onChange={(checked) => saveChannelSettings({ testMode: checked })}
          />
        </div>
      </section>
    </div>
  );
}

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
  const account =
    business.botSettings?.instagramUsername ||
    business.instagram_page_id ||
    business.slug ||
    "instagram";

  function reconnectInstagram() {
    window.location.href = "/api/integrations/instagram/connect";
  }

  async function disconnectInstagram() {
    const res = await fetch("/api/integrations/instagram/disconnect", {
      method: "POST",
    });
    if (res.ok) window.location.reload();
  }

  return (
    <div className="min-h-[calc(100vh-96px)] rounded bg-white shadow-sm">
      <div className="grid min-h-[620px] md:grid-cols-[286px_1fr]">
        <aside className="border-r border-slate-200 p-4">
          <div className="relative flex items-center justify-between">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="flex items-center gap-1 font-semibold"
            >
              Instagram @{account}
              <ChevronDown className="size-4" />
            </button>
            <Search className="size-5" />
            {menuOpen && (
              <div className="absolute left-0 top-8 z-20 w-56 rounded border border-slate-200 bg-white py-1 text-sm shadow">
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left hover:bg-slate-50"
                  onClick={() =>
                    account &&
                    window.open(`https://instagram.com/${account}`, "_blank")
                  }
                >
                  Instagram profilini görüntüle
                </button>
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left hover:bg-slate-50"
                >
                  Salon DM ayarları
                </button>
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left hover:bg-slate-50"
                  onClick={reconnectInstagram}
                >
                  Instagram'a Yeniden Bağlan
                </button>
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-red-600 hover:bg-slate-50"
                  onClick={disconnectInstagram}
                >
                  Instagram bağlantısını kes
                </button>
              </div>
            )}
          </div>
          <h2 className="mt-5 font-semibold">Mesajlar</h2>
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
                    className={`mb-3 flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
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
                <InstagramBrandIcon className="mx-auto size-12 text-pink-600" />
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
