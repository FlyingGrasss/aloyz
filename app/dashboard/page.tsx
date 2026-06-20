// app/dashboard/page.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { getContactDisplayName, getContactSubtitle } from '@/lib/contactDisplay';

// Helper to extract message text from WhatsApp message objects
function getMessageText(m: any): string {
  if (!m) return '';
  if (typeof m === 'string') return m;
  if (Array.isArray(m.parts)) {
    return m.parts.map((p: any) => p.text || '').join('\n');
  }
  return m.content || m.text || '';
}

const DAYS = [
  { key: 'pazartesi', label: 'Pazartesi' },
  { key: 'sali', label: 'Salı' },
  { key: 'carsamba', label: 'Çarşamba' },
  { key: 'persembe', label: 'Perşembe' },
  { key: 'cuma', label: 'Cuma' },
  { key: 'cumartesi', label: 'Cumartesi' },
  { key: 'pazar', label: 'Pazar' },
];

const GOOGLE_SERVICE_ACCOUNT_EMAIL = 'arkansas@arkansas-495411.iam.gserviceaccount.com';

function getWhatsAppInstanceStatus(instance: any) {
  return instance?.connectionStatus || instance?.status || instance?.instance?.status || null;
}

export default function DashboardPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-neutral-600">Yükleniyor…</span>
        </div>
      </div>
    }>
      <DashboardPage />
    </Suspense>
  );
}

function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const adminBusinessId = searchParams.get('businessId');
  const isAdminMode = (session?.user as any)?.role === 'admin' && !!adminBusinessId;

  const [activeTab, setActiveTab] = useState<'general' | 'hours' | 'content' | 'tracking'>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [whatsAppInstance, setWhatsAppInstance] = useState<any | null>(null);
  const [whatsAppInstanceLoading, setWhatsAppInstanceLoading] = useState(false);
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);

  // Business entity holds all editable fields for the owner
  const [business, setBusiness] = useState<any>({
    name: '',
    type: '',
    phone: '',
    welcome_message: '',
    address: '',
    website: '',
    hours: {},
    menu_or_services: '',
    faqs: [],
    special_instructions: '',
    calendarId: '', // stored as email address of calendar owner
    is_active: false,
    test_mode: false,
    conversations: [],
    appointments: [],
  });

  // Redirect admin users to /admin unless editing a specific business
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      if ((session.user as any).role === 'admin' && !adminBusinessId) {
        router.push('/admin');
      }
    }
  }, [session, status, router, adminBusinessId]);

  // Unauthenticated users go to login
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  // Load business data on mount
  useEffect(() => {
    if (status === 'authenticated') {
      if ((session?.user as any)?.role === 'admin' && !adminBusinessId) return;
      fetchBusiness();
    }
  }, [status, adminBusinessId]);

  async function fetchBusiness() {
    try {
      setLoading(true);
      const url = isAdminMode
        ? `/api/business?id=${encodeURIComponent(adminBusinessId!)}`
        : '/api/business';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        // Ensure defaults for optional fields
        data.hours = data.hours || {};
        data.faqs = data.faqs || [];
        data.calendarId = data.calendarId || '';
        data.phone = data.phone || '';
        data.address = data.address || '';
        data.is_active = !!data.is_active;
        data.test_mode = !!data.test_mode;
        setBusiness(data);
        if (!isAdminMode) {
          fetchWhatsAppInstanceStatus();
        }
      }
    } catch (err) {
      console.error('Error fetching business:', err);
    } finally {
      setLoading(false);
    }
  }

  async function adminPatch(fields: Record<string, unknown>) {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId: adminBusinessId, ...fields }),
    });
    return res;
  }

  async function fetchWhatsAppInstanceStatus() {
    try {
      setWhatsAppInstanceLoading(true);
      const res = await fetch('/api/instances/list');
      if (res.ok) {
        const data = await res.json();
        const instance = Array.isArray(data.instances) ? data.instances[0] : null;
        setWhatsAppInstance(instance || null);
        setQrCodeBase64(null);
      }
    } catch (err) {
      console.error('Error fetching WhatsApp instance status:', err);
    } finally {
      setWhatsAppInstanceLoading(false);
    }
  }

  function handleChange(field: string, value: any) {
    setBusiness((prev: any) => ({ ...prev, [field]: value }));
  }

  function updateHour(dayKey: string, val: string) {
    setBusiness((prev: any) => ({
      ...prev,
      hours: { ...prev.hours, [dayKey]: val },
    }));
  }

  // FAQ helpers
  function updateFaq(index: number, field: 'question' | 'answer', value: string) {
    const newFaqs = [...(business.faqs || [])];
    newFaqs[index] = { ...newFaqs[index], [field]: value };
    handleChange('faqs', newFaqs);
  }
  function addFaq() {
    handleChange('faqs', [...(business.faqs || []), { question: '', answer: '' }]);
  }
  function removeFaq(index: number) {
    const newFaqs = (business.faqs || []).filter((_: any, i: number) => i !== index);
    handleChange('faqs', newFaqs);
  }

  // General save (POST) – used for most fields except toggles & bot status
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = isAdminMode
        ? await adminPatch({
            name: business.name,
            type: business.type,
            phone: business.phone || null,
            address: business.address || null,
            website: business.website,
            welcome_message: business.welcome_message,
            hours: business.hours,
            menu_or_services: business.menu_or_services,
            faqs: business.faqs,
            special_instructions: business.special_instructions,
            calendarId: business.calendarId,
          })
        : await fetch('/api/business', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(business),
          });
      if (res.ok) {
        const data = await res.json();
        setBusiness((prev: any) => ({
          ...prev,
          ...data,
          hours: data.hours || prev.hours || {},
          faqs: data.faqs || prev.faqs || [],
          conversations: prev.conversations,
          appointments: prev.appointments,
        }));
        setSuccessMsg('Ayarlarınız başarıyla kaydedildi.');
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Ayarlar kaydedilirken hata oluştu.');
      }
    } catch (err) {
      setErrorMsg('Sunucu hatası oluştu.');
    } finally {
      setSaving(false);
    }
  }

  // Bot active toggle – PATCH endpoint updates is_active flag
  async function toggleBot(active: boolean) {
    setSaving(true);
    try {
      const res = isAdminMode
        ? await adminPatch({ is_active: active })
        : await fetch('/api/business', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: active }),
          });
      if (res.ok) {
        setBusiness((prev: any) => ({ ...prev, is_active: active }));
        setSuccessMsg('Bot durumu güncellendi.');
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Bot durumu kaydedilirken hata.');
      }
    } catch (e) {
      setErrorMsg('Sunucu hatası.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleTestMode(active: boolean) {
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = isAdminMode
        ? await adminPatch({ test_mode: active })
        : await fetch('/api/business', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ test_mode: active }),
          });
      if (res.ok) {
        setBusiness((prev: any) => ({ ...prev, test_mode: active }));
        setSuccessMsg(active ? 'Test modu açıldı.' : 'Test modu kapatıldı.');
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Test modu kaydedilirken hata oluştu.');
      }
    } catch (e) {
      setErrorMsg('Sunucu hatası.');
    } finally {
      setSaving(false);
    }
  }

  async function copyServiceAccountEmail() {
    try {
      await navigator.clipboard.writeText(GOOGLE_SERVICE_ACCOUNT_EMAIL);
      setSuccessMsg('Google servis hesabı e-postası kopyalandı.');
      setErrorMsg('');
    } catch (e) {
      setErrorMsg('E-posta kopyalanamadı. Lütfen manuel kopyalayın.');
    }
  }

  // WhatsApp QR/reconnect and disconnect controls
  async function reconnectWhatsApp() {
    if (!business.slug || !whatsAppInstance) return;
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await fetch(`/api/instances/qr?slug=${encodeURIComponent(business.slug)}`);
      const data = await res.json();
      if (res.ok && data.qrBase64) {
        setQrCodeBase64(data.qrBase64);
        setSuccessMsg('QR kod yüklendi. WhatsApp uygulamasından taratabilirsiniz.');
      } else {
        setErrorMsg(data.error || 'QR kod alınamadı.');
      }
    } catch (e) {
      setErrorMsg('QR kod alınırken sunucu hatası oluştu.');
    } finally {
      setSaving(false);
    }
  }
  async function disconnectWhatsApp() {
    await toggleBot(false);
    await fetchWhatsAppInstanceStatus();
  }

  // Calendar email update – PATCH endpoint updates calendarId field
  async function saveCalendarEmail() {
    setSaving(true);
    try {
      const res = isAdminMode
        ? await adminPatch({ calendarId: business.calendarId })
        : await fetch('/api/business', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ calendarId: business.calendarId }),
          });
      if (res.ok) {
        setSuccessMsg('Takvim e‑posta kaydedildi.');
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Takvim e‑posta kaydedilirken hata.');
      }
    } catch (e) {
      setErrorMsg('Sunucu hatası.');
    } finally {
      setSaving(false);
    }
  }

  // Workspace handling for conversations & appointments – unchanged from original
  const selectedConv = business.conversations?.find((c: any) => c.id === selectedConvId);
  const whatsAppInstanceStatus = getWhatsAppInstanceStatus(whatsAppInstance);
  const hasWhatsAppInstance = !!whatsAppInstance;
  const isWhatsAppConnected = whatsAppInstanceStatus === 'open' || whatsAppInstanceStatus === 'connected';
  const hasInstagramIntegration = !!business.instagram_page_id;
  const isAnyMessagingChannelReady = isWhatsAppConnected || hasInstagramIntegration;

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-neutral-600">Yükleniyor…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 text-neutral-900 pb-16 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200/80 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.jpg" alt="Aloyz" width={34} height={34} className="rounded-lg shadow-sm" />
            <span className="text-lg font-bold tracking-tight text-neutral-900">Aloyz</span>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-semibold text-indigo-600">
              {isAdminMode ? 'Yönetici Düzenleme' : 'İşletme Portalı'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            {isAdminMode && (
              <button
                type="button"
                onClick={() => router.push('/admin')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors border border-indigo-200 px-3 py-1.5 rounded-lg bg-indigo-50 shadow-sm cursor-pointer"
              >
                ← Yönetici Paneline Dön
              </button>
            )}
            <span className="text-sm font-medium text-neutral-600 hidden sm:inline-block">
              {session?.user?.email}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-xs font-bold text-neutral-500 hover:text-neutral-900 transition-colors border border-neutral-200 px-3 py-1.5 rounded-lg bg-white shadow-sm cursor-pointer"
            >
              Çıkış Yap
            </button>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <div className="max-w-6xl mx-auto px-6 mt-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        {isAdminMode && (
          <div className="md:col-span-4 p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 text-sm font-medium">
            <strong>{business.name || 'İşletme'}</strong> profilini yönetici olarak düzenliyorsunuz. Kaydettiğiniz değişiklikler doğrudan bu işletmeye uygulanır.
          </div>
        )}
        {/* Sidebar */}
        <aside className="md:col-span-1 flex flex-col gap-1">
          <button
            onClick={() => setActiveTab('general')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 ${
              activeTab === 'general' ? 'bg-indigo-600 text-white shadow-md' : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            📋 Genel Bilgiler
          </button>
          <button
            onClick={() => setActiveTab('hours')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 ${
              activeTab === 'hours' ? 'bg-indigo-600 text-white shadow-md' : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            🕒 Çalışma Saatleri
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 ${
              activeTab === 'content' ? 'bg-indigo-600 text-white shadow-md' : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            🧠 Yapay Zeka & İçerik
          </button>
          <button
            onClick={() => setActiveTab('tracking')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 ${
              activeTab === 'tracking' ? 'bg-indigo-600 text-white shadow-md' : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            📊 Görüşmeler & Takip
          </button>

          {/* Bot status card */}
          <div className="mt-6 p-4 rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Asistan Bağlantısı</h4>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-semibold text-neutral-700">Bot Durumu</span>
              <Switch
                checked={isAnyMessagingChannelReady && !!business.is_active}
                onCheckedChange={(c) => toggleBot(c)}
                disabled={!isAnyMessagingChannelReady || saving}
                id="bot-toggle"
              />
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              {isAnyMessagingChannelReady && business.is_active ? 'Bot şu anda aktif ve bağlı kanallardan müşterilere yanıt veriyor.' : 'Bot şu anda pasif. WhatsApp veya Instagram bağlantısını yönetin.'}
            </p>
            <div className="mt-3 grid gap-2 text-xs">
              <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-2">
                <span className="font-semibold text-neutral-600">WhatsApp</span>
                <span className={`font-bold ${isWhatsAppConnected ? 'text-emerald-700' : 'text-neutral-500'}`}>
                  {isWhatsAppConnected ? 'Bağlı' : hasWhatsAppInstance ? 'Kurulu / Bağlı değil' : 'Kurulu değil'}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-2">
                <span className="font-semibold text-neutral-600">Instagram</span>
                <span className={`font-bold ${hasInstagramIntegration ? 'text-emerald-700' : 'text-neutral-500'}`}>
                  {hasInstagramIntegration ? 'Bağlı' : 'Bağlı değil'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 p-4 rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Test Modu</h4>
                <p className="text-xs text-neutral-500 mt-1">Canlı müşteri akışından önce denemeler için kullanın.</p>
              </div>
              <Switch
                checked={!!business.test_mode}
                onCheckedChange={(c) => toggleTestMode(c)}
                disabled={saving}
                id="test-mode-toggle"
              />
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="md:col-span-3">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Success / error alerts */}
            {successMsg && (
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm font-semibold shadow-sm">
                🎉 {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm font-semibold shadow-sm">
                ⚠️ {errorMsg}
              </div>
            )}

            {/* ---------- General Tab ---------- */}
            {activeTab === 'general' && (
              <>
                <Card className="border-neutral-200 bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle>Genel Bilgiler</CardTitle>
                    <CardDescription>
                      İşletmenizin temel bilgilerini yönetin.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">İşletme Adı</Label>
                        <Input id="name" required value={business.name} onChange={e => handleChange('name', e.target.value)} placeholder="Örn: Lumina Coffee House" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="type">İşletme Tipi</Label>
                        <Input id="type" required value={business.type} onChange={e => handleChange('type', e.target.value)} placeholder="Örn: Kafe, Klinik" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">İletişim Telefonu (Opsiyonel)</Label>
                        <Input id="phone" value={business.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="0216 123 45 67" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">Web Sitesi (Opsiyonel)</Label>
                        <Input id="website" value={business.website} onChange={e => handleChange('website', e.target.value)} placeholder="www.example.com" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">İşletme Adresi (Opsiyonel)</Label>
                        <Input id="address" value={business.address} onChange={e => handleChange('address', e.target.value)} placeholder="Atatürk Cad. No:12, Kadıköy" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Bot toggle already in sidebar – we add WhatsApp reconnect controls here */}
                <Card className="border-neutral-200 bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle>WhatsApp Bağlantısı</CardTitle>
                    <CardDescription>
                      WhatsApp oturum durumunu buradan yönetebilirsiniz.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {whatsAppInstanceLoading && (
                      <p className="text-sm text-neutral-500">WhatsApp oturumu kontrol ediliyor...</p>
                    )}

                    {!whatsAppInstanceLoading && !hasWhatsAppInstance && (
                      <p className="text-sm text-neutral-500">
                        Bu işletme için henüz WhatsApp oturumu oluşturulmamış.
                      </p>
                    )}

                    {!whatsAppInstanceLoading && hasWhatsAppInstance && (
                      <div className="flex flex-wrap gap-4">
                        {!isWhatsAppConnected && (
                          <Button type="button" onClick={reconnectWhatsApp} disabled={saving} variant="default">
                            QR ile Yeniden Bağlan
                          </Button>
                        )}
                        {isWhatsAppConnected && (
                          <Button type="button" onClick={disconnectWhatsApp} disabled={saving} variant="destructive">
                            Bağlantıyı Kes
                          </Button>
                        )}
                      </div>
                    )}

                    {qrCodeBase64 && (
                      <div className="inline-flex rounded-xl border border-neutral-200 bg-white p-3">
                        <img
                          src={qrCodeBase64.startsWith('data:') ? qrCodeBase64 : `data:image/png;base64,${qrCodeBase64}`}
                          alt="WhatsApp QR Kodu"
                          className="h-44 w-44"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Calendar configuration */}
                <Card className="border-neutral-200 bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle>Google Takvim Entegrasyonu</CardTitle>
                    <CardDescription>
                      Takvim sahibinin e‑posta adresini girin. <strong>Aşağıdaki açıklamayı okuyun.</strong>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-neutral-600">
                      <p>Takvimi bağlamak için:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Google Takvim → Sol menüde takvimin yanındaki 3 nokta</li>
                        <li>"Ayarlar ve Paylaşım" menüsünü seçin</li>
                        <li>"Şunlarla paylaşıldı:" kısmına şu Google servis hesabı e‑postasını ekleyin:<br />
                          <button
                            type="button"
                            onClick={copyServiceAccountEmail}
                            className="mt-1 inline-flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-2 py-1 font-mono text-xs text-neutral-800 shadow-sm hover:border-neutral-400 hover:bg-neutral-50"
                            title="E-postayı kopyala"
                          >
                            <span>{GOOGLE_SERVICE_ACCOUNT_EMAIL}</span>
                            <span className="font-sans font-semibold text-indigo-600">Kopyala</span>
                          </button>
                        </li>
                        <li>Rol olarak "Editor" seçin ve kaydedin.</li>
                      </ol>
                    </div>
                    <div className="flex items-center gap-3">
                      <Label htmlFor="calendar_email" className="shrink-0">Takvimin bağlı olduğu e‑posta</Label>
                      <Input id="calendar_email" className="flex-1" value={business.calendarId} onChange={e => handleChange('calendarId', e.target.value)} placeholder="örnek@domain.com" />
                      <Button type="button" onClick={saveCalendarEmail} disabled={saving}>Kaydet</Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* ---------- Hours Tab ---------- */}
            {activeTab === 'hours' && (
              <Card className="border-neutral-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle>Çalışma Saatleri</CardTitle>
                  <CardDescription>
                    Her gün için çalışma saatlerini ayarlayın. Kapalı günler için "Kapalı" yazın.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {DAYS.map(day => (
                    <div key={day.key} className="flex items-center gap-4 border-b pb-3 last:border-0">
                      <Label className="w-28 text-sm font-semibold text-neutral-700 shrink-0">{day.label}</Label>
                      <Input value={business.hours[day.key] || ''} onChange={e => updateHour(day.key, e.target.value)} placeholder="Örn: 09:00 - 18:00 veya Kapalı" className="flex-1 max-w-sm" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* ---------- Content Tab ---------- */}
            {activeTab === 'content' && (
              <Card className="border-neutral-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle>Yapay Zeka & İçerik</CardTitle>
                  <CardDescription>Asistanın yanıtlarını ve randevu akışını yapılandırın.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Welcome message */}
                  <div className="space-y-2">
                    <Label htmlFor="welcome_message" className="flex items-center justify-between">
                      <span>Karşılama Mesajı (Opsiyonel)</span>
                      <span className="text-xs text-neutral-400 font-medium">Asistanın ilk konuşma başlatıcısı</span>
                    </Label>
                    <Textarea id="welcome_message" value={business.welcome_message || ''} onChange={e => handleChange('welcome_message', e.target.value)} placeholder="Merhaba! …" rows={3} />
                  </div>
                  {/* Menu / Services */}
                  <div className="space-y-2">
                    <Label htmlFor="menu_or_services">Menü ve Hizmetler</Label>
                    <Textarea id="menu_or_services" required value={business.menu_or_services} onChange={e => handleChange('menu_or_services', e.target.value)} placeholder="Hizmetlerinizi detaylandırın..." rows={8} />
                  </div>
                  {/* FAQs */}
                  <div className="space-y-3">
                    <Label className="flex items-center justify-between">
                      <span>Sıkça Sorulan Sorular (SSS)</span>
                      <Button type="button" variant="outline" size="sm" onClick={addFaq} className="text-xs h-7">+ Soru Ekle</Button>
                    </Label>
                    <div className="space-y-3">
                      {(business.faqs || []).map((faq: any, i: number) => (
                        <div key={i} className="p-4 border rounded-xl bg-neutral-50/50 relative group">
                          <button type="button" className="absolute top-2.5 right-2.5 h-6 w-6 text-neutral-400 hover:text-red-600" onClick={() => removeFaq(i)}>
                            ✕
                          </button>
                          <Input placeholder="Soru" value={faq.question || ''} onChange={e => updateFaq(i, 'question', e.target.value)} className="bg-white" />
                          <Textarea placeholder="Cevap" value={faq.answer || ''} onChange={e => updateFaq(i, 'answer', e.target.value)} className="bg-white" rows={2} />
                        </div>
                      ))}
                      {(business.faqs || []).length === 0 && (
                        <div className="text-center py-6 border-dashed rounded-xl text-xs text-neutral-400">
                          Henüz bir SSS eklenmemiş.
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Special instructions */}
                  <div className="space-y-2">
                    <Label htmlFor="special_instructions">Özel Talimatlar / Notlar (Opsiyonel)</Label>
                    <Textarea id="special_instructions" value={business.special_instructions || ''} onChange={e => handleChange('special_instructions', e.target.value)} placeholder="Ek bilgiler..." rows={4} />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ---------- Tracking Tab ---------- */}
            {activeTab === 'tracking' && (
              <div className="space-y-6">
                {/* Appointments list */}
                <Card className="border-neutral-200 bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle>📋 Kayıtlı Randevular</CardTitle>
                    <CardDescription>Asistan tarafından oluşturulan randevular.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b text-neutral-400 font-semibold">
                            <th className="py-2.5 px-3">Müşteri</th>
                            <th className="py-2.5 px-3">Telefon</th>
                            <th className="py-2.5 px-3">Tarih / Saat</th>
                            <th className="py-2.5 px-3">Detay / Not</th>
                            <th className="py-2.5 px-3">Durum</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {(business.appointments || []).map((app: any) => (
                            <tr key={app.id} className="hover:bg-neutral-50/50">
                              <td className="py-3 px-3 font-bold text-neutral-900">{app.customerName}</td>
                              <td className="py-3 px-3 text-neutral-600">{app.phone}</td>
                              <td className="py-3 px-3 font-semibold text-indigo-600">{app.date} / {app.time}</td>
                              <td className="py-3 px-3 text-neutral-500 text-xs max-w-xs truncate">{app.description}</td>
                              <td className="py-3 px-3">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${app.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-neutral-100 text-neutral-600'}`}>
                                  {app.status === 'CONFIRMED' ? 'Onaylandı' : app.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {(business.appointments || []).length === 0 && (
                            <tr>
                              <td colSpan={5} className="text-center py-8 text-neutral-400 text-xs">
                                Henüz kayıtlı randevu yok.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Conversations log */}
                <Card className="border-neutral-200 bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle>💬 Görüşme & Kişi Günlükleri</CardTitle>
                    <CardDescription>Müşterilerle gerçekleşen diyalogların ve kayıtlı kişi bilgilerinin takibi.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Conversation list */}
                    <div className="border rounded-xl divide-y max-h-[400px] overflow-y-auto bg-neutral-50/30">
                      {business.conversations?.map((conv: any) => {
                        const subtitle = getContactSubtitle(conv);
                        return (
                        <button
                          key={conv.id}
                          type="button"
                          onClick={() => setSelectedConvId(conv.id)}
                          className={`w-full text-left p-3.5 flex flex-col gap-1 ${selectedConvId === conv.id ? 'bg-indigo-50/80 border-l-4 border-l-indigo-600' : 'hover:bg-neutral-50'}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold truncate text-neutral-900">{getContactDisplayName(conv)}</span>
                            <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${conv.channel === 'instagram' ? 'bg-pink-50 text-pink-700' : 'bg-emerald-50 text-emerald-700'}`}>
                              {conv.channel === 'instagram' ? 'IG' : 'WA'}
                            </span>
                          </div>
                          {subtitle && (
                            <span className="text-xs text-neutral-500 truncate">{subtitle}</span>
                          )}
                          <span className="text-xs text-neutral-400">Son Güncelleme: {new Date(conv.updatedAt).toLocaleTimeString('tr-TR')}</span>
                        </button>
                        );
                      })}
                      {(business.conversations || []).length === 0 && (
                        <div className="text-center py-12 text-neutral-400 text-xs">Aktif görüşme günlüğü yok.</div>
                      )}
                    </div>
                    {/* Conversation detail */}
                    <div className="md:col-span-2 border rounded-xl p-4 flex flex-col h-[400px] bg-neutral-950 text-neutral-200">
                      {selectedConv ? (
                        <div className="flex-1 flex flex-col h-full">
                          <div className="pb-3 border-b border-neutral-800 flex justify-between items-center gap-3">
                            <div className="min-w-0">
                              <span className="font-bold text-indigo-400 block truncate">{getContactDisplayName(selectedConv)}</span>
                              {getContactSubtitle(selectedConv) && (
                                <span className="text-xs text-neutral-500 block truncate">{getContactSubtitle(selectedConv)}</span>
                              )}
                            </div>
                            <span className="text-xs text-neutral-500 shrink-0">{selectedConv.channel === 'instagram' ? 'Instagram' : 'WhatsApp'}</span>
                          </div>
                          <div className="flex-1 overflow-y-auto py-3 space-y-3 text-sm pr-1">
                            {(() => {
                              const msgs = typeof selectedConv.messages === 'string' ? JSON.parse(selectedConv.messages) : selectedConv.messages;
                              if (!Array.isArray(msgs)) return null;
                              return msgs.map((m: any, idx: number) => {
                                const isUser = m.role === 'user';
                                return (
                                  <div key={idx} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                                    <span className="text-[10px] text-neutral-500 mb-0.5 font-semibold">
                                      {isUser ? 'Müşteri' : 'Yapay Zeka Asistanı'}
                                    </span>
                                    <div className={`p-3 rounded-2xl max-w-[85%] leading-relaxed whitespace-pre-wrap ${isUser ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-neutral-800 text-neutral-100 rounded-tl-none'}`}>
                                      {getMessageText(m)}
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-center text-xs text-neutral-500 font-semibold">
                          Görüşme içeriğini görmek için soldan bir sohbet seçin.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Save button for editable tabs */}
            {activeTab !== 'tracking' && (
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl shadow-md">
                  {saving ? 'Kaydediliyor…' : 'Değişiklikleri Kaydet'}
                </Button>
              </div>
            )}
          </form>
        </main>
      </div>
    </div>
  );
}
