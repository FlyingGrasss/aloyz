'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

function getMessageText(m: any): string {
  if (!m) return ''
  if (typeof m === 'string') return m
  if (Array.isArray(m.parts)) {
    return m.parts.map((p: any) => p.text || '').join('\n')
  }
  return m.content || m.text || ''
}

const DAYS = [
  { key: 'pazartesi', label: 'Pazartesi' },
  { key: 'sali', label: 'Salı' },
  { key: 'carsamba', label: 'Çarşamba' },
  { key: 'persembe', label: 'Perşembe' },
  { key: 'cuma', label: 'Cuma' },
  { key: 'cumartesi', label: 'Cumartesi' },
  { key: 'pazar', label: 'Pazar' },
]

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<'general' | 'hours' | 'content' | 'tracking'>('general')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Selected conversation JID for the tracking logs view
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null)

  const [business, setBusiness] = useState<{
    name: string
    type: string
    phone: string
    welcome_message: string
    address: string
    website: string
    hours: Record<string, string>
    menu_or_services: string
    faqs: Array<{ question: string; answer: string }>
    special_instructions: string
    conversations?: Array<{ id: string; customerJid: string; messages: any; updatedAt: string }>
    appointments?: Array<{ id: string; customerName: string; phone: string; date: string; time: string; description: string; status: string }>
  }>({
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
    conversations: [],
    appointments: [],
  })

  // Redirect admin users immediately to `/admin`
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      if ((session.user as any).role === 'admin') {
        router.push('/admin')
      }
    }
  }, [session, status, router])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchBusiness()
    }
  }, [status])

  async function fetchBusiness() {
    try {
      setLoading(true)
      const res = await fetch('/api/business')
      if (res.ok) {
        const data = await res.json()
        if (!data.hours || typeof data.hours !== 'object') {
          data.hours = {}
        }
        if (!Array.isArray(data.faqs)) {
          data.faqs = []
        }
        setBusiness(data)
      } else {
        console.warn('Business profile not found, starting fresh')
      }
    } catch (err) {
      console.error('Error fetching business:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleChange(field: string, value: any) {
    setBusiness(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  function updateHour(dayKey: string, val: string) {
    setBusiness(prev => ({
      ...prev,
      hours: {
        ...prev.hours,
        [dayKey]: val,
      },
    }))
  }

  // FAQ array helpers
  function updateFaq(index: number, field: 'question' | 'answer', value: string) {
    const newFaqs = [...(business.faqs || [])]
    newFaqs[index] = { ...newFaqs[index], [field]: value }
    handleChange('faqs', newFaqs)
  }

  function addFaq() {
    handleChange('faqs', [...(business.faqs || []), { question: '', answer: '' }])
  }

  function removeFaq(index: number) {
    const newFaqs = (business.faqs || []).filter((_, i) => i !== index)
    handleChange('faqs', newFaqs)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSuccessMsg('')
    setErrorMsg('')

    try {
      const res = await fetch('/api/business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(business),
      })

      if (res.ok) {
        setSuccessMsg('Ayarlarınız başarıyla kaydedildi.')
        // Refresh business data to get updated relations if any
        fetchBusiness()
      } else {
        const errData = await res.json()
        setErrorMsg(errData.error || 'Ayarlar kaydedilirken hata oluştu.')
      }
    } catch (err) {
      setErrorMsg('Sunucu hatası oluştu.')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-neutral-600">Yükleniyor...</span>
        </div>
      </div>
    )
  }

  const selectedConv = business.conversations?.find(c => c.id === selectedConvId)

  return (
    <div className="min-h-screen bg-slate-50/50 text-neutral-900 pb-16 font-sans">
      {/* Top Banner Navigation */}
      <header className="bg-white border-b border-neutral-200/80 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center shadow-md">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight text-neutral-900">CustomerAI</span>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-semibold text-indigo-600">
              İşletme Portalı
            </span>
          </div>

          <div className="flex items-center gap-4">
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

      {/* Main Grid View */}
      <div className="max-w-6xl mx-auto px-6 mt-8 grid grid-cols-1 md:grid-cols-4 gap-8">

        {/* Sidebar Tabs */}
        <aside className="md:col-span-1 flex flex-col gap-1">
          <button
            onClick={() => setActiveTab('general')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 ${activeTab === 'general'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
          >
            📋 Genel Bilgiler
          </button>
          <button
            onClick={() => setActiveTab('hours')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 ${activeTab === 'hours'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
          >
            🕒 Çalışma Saatleri
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 ${activeTab === 'content'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
          >
            🧠 Yapay Zeka & İçerik
          </button>

          <button
            onClick={() => setActiveTab('tracking')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 ${activeTab === 'tracking'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
          >
            📊 Görüşmeler & Takip
          </button>

          {/* Assistant Status Card */}
          <div className="mt-6 p-4 rounded-2xl border border-neutral-200 bg-white shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Asistan Bağlantısı</h4>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-neutral-700">WhatsApp Durumu</span>
              {business.conversations !== undefined ? (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${(business as any).is_active
                    ? 'bg-emerald-50 border border-emerald-100 text-emerald-600'
                    : 'bg-amber-50 border border-amber-100 text-amber-600'
                  }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${(business as any).is_active ? 'bg-emerald-500' : 'bg-amber-500'
                    }`} />
                  {(business as any).is_active ? 'Aktif' : 'Pasif / Kurulumda'}
                </span>
              ) : null}
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed">
              {(business as any).is_active
                ? 'Yapay zeka asistanınız aktif olarak müşterilere yanıt veriyor.'
                : 'Asistan kurulum aşamasındadır. Takvim ID ve sistem tanımlaması yöneticilerimiz tarafından onaylandığında aktif edilecektir.'
              }
            </p>
          </div>
        </aside>

        {/* Content Forms Area */}
        <main className="md:col-span-3">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* SUCCESS / ERROR BULLETINS */}
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

            {/* TAB 1: GENERAL INFO */}
            {activeTab === 'general' && (
              <Card className="border-neutral-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle>Genel Bilgiler</CardTitle>
                  <CardDescription>Müşteri asistanının şirket detaylarınızı doğru öğrenmesi için temel bilgileri doldurun.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">İşletme Adı</Label>
                      <Input
                        id="name"
                        required
                        value={business.name}
                        onChange={e => handleChange('name', e.target.value)}
                        placeholder="Örn: Lumina Coffee House"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">İşletme Tipi</Label>
                      <Input
                        id="type"
                        required
                        value={business.type}
                        onChange={e => handleChange('type', e.target.value)}
                        placeholder="Örn: Nesil Cafe, Klinik, Güzellik Merkezi"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">İletişim Telefonu</Label>
                      <Input
                        id="phone"
                        required
                        value={business.phone}
                        onChange={e => handleChange('phone', e.target.value)}
                        placeholder="Örn: 0216 123 45 67"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Web Sitesi (Opsiyonel)</Label>
                      <Input
                        id="website"
                        value={business.website}
                        onChange={e => handleChange('website', e.target.value)}
                        placeholder="Örn: www.luminacoffee.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">İşletme Adresi</Label>
                    <Input
                      id="address"
                      required
                      value={business.address}
                      onChange={e => handleChange('address', e.target.value)}
                      placeholder="Örn: Atatürk Cad. No:12, Kadıköy, İstanbul"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* TAB 2: HOURS */}
            {activeTab === 'hours' && (
              <Card className="border-neutral-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle>Çalışma Saatleri</CardTitle>
                  <CardDescription>
                    Her gün için çalışma aralığı belirleyin. Kapalıysa &quot;Kapalı&quot; yazın. Müşteri asistanı bu bilgileri randevu onaylarında kullanacaktır.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {DAYS.map(day => (
                    <div key={day.key} className="flex items-center gap-4 border-b border-neutral-100 pb-3 last:border-0 last:pb-0">
                      <Label className="w-28 text-sm font-semibold text-neutral-700 shrink-0">{day.label}</Label>
                      <Input
                        value={business.hours[day.key] || ''}
                        onChange={e => updateHour(day.key, e.target.value)}
                        placeholder="Örn: 09:00 - 18:00 veya Kapalı"
                        className="flex-1 max-w-sm"
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* TAB 3: AI & CONTENT */}
            {activeTab === 'content' && (
              <Card className="border-neutral-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle>Yapay Zeka &amp; Bilgi Tabanı</CardTitle>
                  <CardDescription>Asistanın müşterilerinize vereceği cevapları ve randevu yönlendirmelerini yapılandırın.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">

                  {/* WELCOME MESSAGE */}
                  <div className="space-y-2">
                    <Label htmlFor="welcome_message" className="flex items-center justify-between">
                      <span>Karşılama Mesajı (Opsiyonel)</span>
                      <span className="text-xs text-neutral-400 font-medium">Asistanın ilk konuşma başlatıcısı</span>
                    </Label>
                    <Textarea
                      id="welcome_message"
                      value={business.welcome_message || ''}
                      onChange={e => handleChange('welcome_message', e.target.value)}
                      placeholder="Örn: Merhaba! Lumina Coffee House'a hoş geldiniz ☕. Size bugün nasıl yardımcı olabilirim? Çalışma saatlerimizi öğrenebilir ya da randevu oluşturabilirsiniz."
                      rows={3}
                    />
                  </div>

                  {/* MENU OR SERVICES */}
                  <div className="space-y-2">
                    <Label htmlFor="menu_or_services">Menü ve Hizmetler</Label>
                    <Textarea
                      id="menu_or_services"
                      required
                      value={business.menu_or_services}
                      onChange={e => handleChange('menu_or_services', e.target.value)}
                      placeholder="Hizmetlerinizi, fiyatlarını ve kategorilerini detaylı bir şekilde yazın. Yapay zeka müşterilere buradaki menüyü doğrudan sunacaktır."
                      rows={8}
                    />
                  </div>

                  {/* FAQS ARRAY */}
                  <div className="space-y-3">
                    <Label className="flex items-center justify-between">
                      <span>Sıkça Sorulan Sorular (SSS)</span>
                      <Button type="button" variant="outline" size="sm" onClick={addFaq} className="text-xs h-7">
                        + Soru Ekle
                      </Button>
                    </Label>

                    <div className="space-y-3">
                      {(business.faqs || []).map((faq, i) => (
                        <div key={i} className="p-4 border border-neutral-200 rounded-xl space-y-3 bg-neutral-50/50 relative group">
                          <button
                            type="button"
                            className="absolute top-2.5 right-2.5 h-6 w-6 text-neutral-400 hover:text-red-600 transition-colors flex items-center justify-center font-bold text-xs"
                            onClick={() => removeFaq(i)}
                          >
                            ✕
                          </button>
                          <div className="space-y-2">
                            <Input
                              placeholder="Soru"
                              value={faq.question || ''}
                              onChange={e => updateFaq(i, 'question', e.target.value)}
                              className="bg-white"
                            />
                            <Textarea
                              placeholder="Cevap"
                              value={faq.answer || ''}
                              onChange={e => updateFaq(i, 'answer', e.target.value)}
                              className="bg-white"
                              rows={2}
                            />
                          </div>
                        </div>
                      ))}

                      {(business.faqs || []).length === 0 && (
                        <div className="text-center py-6 border border-dashed rounded-xl text-xs text-neutral-400">
                          Henüz hiçbir Sıkça Sorulan Soru eklenmemiş.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SPECIAL INSTRUCTIONS */}
                  <div className="space-y-2">
                    <Label htmlFor="special_instructions">Özel Talimatlar / Notlar (Opsiyonel)</Label>
                    <Textarea
                      id="special_instructions"
                      value={business.special_instructions || ''}
                      onChange={e => handleChange('special_instructions', e.target.value)}
                      placeholder="Müşteri temsilcisinin uymasını istediğiniz özel kurallar, otopark durumu, dışarıdan yiyecek getirilip getirilemeyeceği gibi detaylar."
                      rows={4}
                    />
                  </div>

                </CardContent>
              </Card>
            )}



            {/* TAB 4: TRACKING & CONVERSATIONS (NEW!) */}
            {activeTab === 'tracking' && (
              <div className="space-y-6">

                {/* 1. APPOINTMENTS TRACK LIST */}
                <Card className="border-neutral-200 bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle>📋 Kayıtlı Randevular</CardTitle>
                    <CardDescription>Asistan tarafından otomatik olarak oluşturulan ve takvimle eşleşen randevular.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-neutral-200 text-neutral-400 font-semibold">
                            <th className="py-2.5 px-3">Müşteri</th>
                            <th className="py-2.5 px-3">Telefon</th>
                            <th className="py-2.5 px-3">Tarih / Saat</th>
                            <th className="py-2.5 px-3">Detay / Not</th>
                            <th className="py-2.5 px-3">Durum</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {business.appointments?.map(app => (
                            <tr key={app.id} className="hover:bg-neutral-50/50">
                              <td className="py-3 px-3 font-bold text-neutral-900">{app.customerName}</td>
                              <td className="py-3 px-3 text-neutral-600">{app.phone}</td>
                              <td className="py-3 px-3 font-semibold text-indigo-600">
                                {app.date} / {app.time}
                              </td>
                              <td className="py-3 px-3 text-neutral-500 text-xs max-w-xs truncate">{app.description}</td>
                              <td className="py-3 px-3">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${app.status === 'CONFIRMED'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                    : 'bg-neutral-100 text-neutral-600'
                                  }`}>
                                  {app.status === 'CONFIRMED' ? 'Onaylandı' : app.status}
                                </span>
                              </td>
                            </tr>
                          ))}

                          {(business.appointments || []).length === 0 && (
                            <tr>
                              <td colSpan={5} className="text-center py-8 text-neutral-400 text-xs">
                                Henüz asistan tarafından kaydedilmiş bir randevu bulunmamaktadır.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* 2. CHAT CONVERSATIONS LIST & LIVE LOGS VIEW */}
                <Card className="border-neutral-200 bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle>💬 WhatsApp Görüşme Günlükleri</CardTitle>
                    <CardDescription>Müşterileriniz ile asistan arasında gerçekleşen diyalogların anlık takibi.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* LEFT LIST */}
                    <div className="md:col-span-1 border border-neutral-200 rounded-xl divide-y divide-neutral-100 max-h-[400px] overflow-y-auto bg-neutral-50/30">
                      {business.conversations?.map(conv => (
                        <button
                          key={conv.id}
                          type="button"
                          onClick={() => setSelectedConvId(conv.id)}
                          className={`w-full text-left p-3.5 flex flex-col gap-1 transition-all ${selectedConvId === conv.id ? 'bg-indigo-50/80 border-l-4 border-l-indigo-600' : 'hover:bg-neutral-50'
                            }`}
                        >
                          <span className="text-sm font-bold text-neutral-900 truncate">
                            {conv.customerJid.split('@')[0]}
                          </span>
                          <span className="text-xs text-neutral-400">
                            Son Güncelleme: {new Date(conv.updatedAt).toLocaleTimeString('tr-TR')}
                          </span>
                        </button>
                      ))}

                      {(business.conversations || []).length === 0 && (
                        <div className="text-center py-12 text-neutral-400 text-xs">
                          Henüz hiçbir aktif görüşme günlüğü bulunmuyor.
                        </div>
                      )}
                    </div>

                    {/* RIGHT DETAILED MESSAGES WINDOW */}
                    <div className="md:col-span-2 border border-neutral-200 rounded-xl p-4 flex flex-col h-[400px] bg-neutral-950 text-neutral-200">
                      {selectedConv ? (
                        <div className="flex-1 flex flex-col h-full">
                          <div className="pb-3 border-b border-neutral-800 flex justify-between items-center shrink-0">
                            <span className="font-bold text-indigo-400">{selectedConv.customerJid}</span>
                            <span className="text-xs text-neutral-500">Müşteri Diyaloğu</span>
                          </div>

                          <div className="flex-1 overflow-y-auto py-3 space-y-3 text-sm pr-1">
                            {(() => {
                              const msgs = typeof selectedConv.messages === 'string'
                                ? JSON.parse(selectedConv.messages)
                                : selectedConv.messages

                              if (!Array.isArray(msgs)) return null

                              return msgs.map((m: any, idx: number) => {
                                const isUser = m.role === 'user'
                                return (
                                  <div key={idx} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                                    <span className="text-[10px] text-neutral-500 mb-0.5 font-semibold">
                                      {isUser ? 'Müşteri' : 'Yapay Zeka Asistanı'}
                                    </span>
                                    <div className={`p-3 rounded-2xl max-w-[85%] leading-relaxed whitespace-pre-wrap ${isUser
                                        ? 'bg-indigo-600 text-white rounded-tr-none'
                                        : 'bg-neutral-800 text-neutral-100 rounded-tl-none'
                                      }`}>
                                      {getMessageText(m)}
                                    </div>
                                  </div>
                                )
                              })
                            })()}
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-center text-xs text-neutral-500 font-semibold">
                          Konuşma içeriğini görüntülemek için soldan bir görüşme seçin.
                        </div>
                      )}
                    </div>

                  </CardContent>
                </Card>
              </div>
            )}

            {/* TAB ACTIONS (Save button only shown for editable tab configurations) */}
            {activeTab !== 'tracking' && (
              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                </Button>
              </div>
            )}

          </form>
        </main>

      </div>
    </div>
  )
}
