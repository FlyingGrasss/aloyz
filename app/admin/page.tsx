'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

function getMessageText(m: any): string {
  if (!m) return ''
  if (typeof m === 'string') return m
  if (Array.isArray(m.parts)) {
    return m.parts.map((p: any) => p.text || '').join('\n')
  }
  return m.content || m.text || ''
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<'businesses' | 'create' | 'conversations' | 'appointments'>('businesses')
  const [loading, setLoading] = useState(true)

  // Lists of fetched businesses (which include nested owner, conversations, and appointments)
  const [businesses, setBusinesses] = useState<any[]>([])

  // Row changes state tracking
  const [localChanges, setLocalChanges] = useState<Record<string, { calendarId: string; slug: string; is_active: boolean }>>({})
  const [rowLoading, setRowLoading] = useState<Record<string, boolean>>({})

  // Action status triggers
  const [actionSuccess, setActionSuccess] = useState('')
  const [actionError, setActionError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // Whitelist Registration Form states (website, address, phone removed!)
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('')

  // Detailed selected log viewer state
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null)

  // Redirect non-admins immediately to `/dashboard`
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      if ((session.user as any).role !== 'admin') {
        router.push('/dashboard')
      }
    }
  }, [session, status, router])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated' && (session?.user as any)?.role === 'admin') {
      fetchAdminData()
    }
  }, [status])

  async function fetchAdminData() {
    try {
      setLoading(true)
      const res = await fetch('/api/admin')
      if (res.ok) {
        const data = await res.json()
        setBusinesses(data)
      }
    } catch (err) {
      console.error('Error fetching admin data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Handle local cell updates in the React state without saving yet
  const updateLocalField = (businessId: string, field: string, value: any) => {
    setLocalChanges(prev => {
      const biz = businesses.find(b => b.id === businessId)
      const existing = prev[businessId] || {
        calendarId: biz?.calendarId || '',
        slug: biz?.slug || '',
        is_active: !!biz?.is_active
      }
      return {
        ...prev,
        [businessId]: {
          ...existing,
          [field]: value
        }
      }
    })
  }

  // Handle whitelisting / creation of a new business client
  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()
    setActionLoading(true)
    setActionSuccess('')
    setActionError('')

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          name: newName,
          type: newType,
        }),
      })

      if (res.ok) {
        setActionSuccess(`"${newName}" başarıyla sisteme eklendi ve boş işletme profili oluşturuldu.`)
        // Reset inputs
        setNewEmail('')
        setNewPassword('')
        setNewName('')
        setNewType('')
        // Refresh businesses
        fetchAdminData()
        setActiveTab('businesses')
      } else {
        const data = await res.json()
        setActionError(data.error || 'Müşteri eklenirken bir hata oluştu.')
      }
    } catch (err) {
      setActionError('Sistem hatası oluştu.')
    } finally {
      setActionLoading(false)
    }
  }

  // Explicit Update Button Handler for a single row
  async function handleSaveRow(businessId: string) {
    setRowLoading(prev => ({ ...prev, [businessId]: true }))
    setActionSuccess('')
    setActionError('')

    const biz = businesses.find(b => b.id === businessId)
    const current = localChanges[businessId] || {
      calendarId: biz?.calendarId || '',
      slug: biz?.slug || '',
      is_active: !!biz?.is_active
    }

    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          calendarId: current.calendarId,
          is_active: current.is_active,
          slug: current.slug,
        }),
      })

      if (res.ok) {
        // Update local React state array without triggering jumpy fetch refreshes!
        setBusinesses(prev =>
          prev.map(b =>
            b.id === businessId
              ? { ...b, calendarId: current.calendarId, is_active: current.is_active, slug: current.slug }
              : b
          )
        )
        setActionSuccess('İşletme ayarları başarıyla kaydedildi.')
      } else {
        const data = await res.json()
        setActionError(data.error || 'Güncelleme sırasında hata oluştu.')
      }
    } catch (err) {
      setActionError('Bağlantı hatası.')
    } finally {
      setRowLoading(prev => ({ ...prev, [businessId]: false }))
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-neutral-600">Yönetici Paneli Yükleniyor...</span>
        </div>
      </div>
    )
  }

  // Create a flat list of all conversations across ALL businesses in the system, sorted chronologically!
  const allConversations = businesses
    .flatMap(b =>
      (b.conversations || []).map((conv: any) => ({
        ...conv,
        businessName: b.name,
        businessId: b.id,
      }))
    )
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  const selectedConv = allConversations.find(c => c.id === selectedConvId)

  return (
    <div className="min-h-screen bg-slate-50/50 text-neutral-900 pb-16 font-sans">
      {/* Top Banner Navigation */}
      <header className="bg-white border-b border-neutral-200/80 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-neutral-900 text-white rounded-lg flex items-center justify-center shadow-md">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight text-neutral-900">CustomerAI</span>
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-neutral-900 text-xs font-bold text-white">
              Sistem Yöneticisi
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-neutral-600">
              Yönetici: {session?.user?.email}
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

      {/* Main Grid Layout */}
      <div className="max-w-6xl mx-auto px-6 mt-8 grid grid-cols-1 md:grid-cols-4 gap-8">

        {/* Admin Navigation Sidebar */}
        <aside className="md:col-span-1 flex flex-col gap-1">
          <button
            onClick={() => setActiveTab('businesses')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 ${activeTab === 'businesses'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
          >
            🏢 Kayıtlı İşletmeler
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 ${activeTab === 'create'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
          >
            ➕ Yeni İşletme Tanımla
          </button>
          <button
            onClick={() => setActiveTab('conversations')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 ${activeTab === 'conversations'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
          >
            💬 Son Görüşmeler
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 ${activeTab === 'appointments'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
          >
            📅 Randevu Veri Havuzu
          </button>
        </aside>

        {/* Admin Dashboard Area */}
        <main className="md:col-span-3 space-y-6">

          {/* Action Bulletins */}
          {actionSuccess && (
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm font-semibold shadow-sm">
              🎉 {actionSuccess}
            </div>
          )}
          {actionError && (
            <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm font-semibold shadow-sm">
              ⚠️ {actionError}
            </div>
          )}

          {/* TAB 1: BUSINESSES CONFIGURATION LIST */}
          {activeTab === 'businesses' && (
            <Card className="border-neutral-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Sistem Kayıtlı İşletmeler</CardTitle>
                <CardDescription>
                  İşletmelerin Google Calendar Takvim ID ve WhatsApp aramaları için kullanılan benzersiz Slug tanımlamalarını yönetin.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-neutral-200">
                  {businesses.map(b => {
                    const rowChanges = localChanges[b.id] || {
                      calendarId: b.calendarId || '',
                      slug: b.slug || '',
                      is_active: !!b.is_active
                    }
                    const isSaving = !!rowLoading[b.id]

                    return (
                      <div key={b.id} className="py-6 first:pt-0 last:pb-0 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <h3 className="text-base font-bold text-neutral-900">{b.name}</h3>
                            <p className="text-xs text-neutral-500 mt-0.5">
                              Tipi: <span className="font-semibold">{b.type}</span> | Sahibi: <span className="font-semibold">{b.owner?.email}</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold text-neutral-500">Asistan Durumu:</span>
                            <select
                              value={rowChanges.is_active ? 'active' : 'inactive'}
                              onChange={e => updateLocalField(b.id, 'is_active', e.target.value === 'active')}
                              className="text-xs font-bold px-2.5 py-1 rounded border border-neutral-200 bg-white shadow-sm cursor-pointer"
                            >
                              <option value="inactive">Pasif / Kurulumda</option>
                              <option value="active">Aktif (WhatsApp Çalışıyor)</option>
                            </select>
                          </div>
                        </div>

                        {/* CalendarID & Slug Setting Inline */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-50 p-3 rounded-xl border border-neutral-200/60">
                          <div className="flex items-center gap-3">
                            <Label className="text-xs font-bold text-neutral-600 shrink-0 w-20">Takvim ID:</Label>
                            <Input
                              placeholder="Takvim ID atanmamış"
                              value={rowChanges.calendarId}
                              onChange={e => updateLocalField(b.id, 'calendarId', e.target.value)}
                              className="h-8 text-xs bg-white flex-1"
                            />
                          </div>

                          <div className="flex items-center gap-3">
                            <Label className="text-xs font-bold text-neutral-600 shrink-0 w-20">Slug Adresi:</Label>
                            <Input
                              placeholder="Slug girilmemiş"
                              value={rowChanges.slug}
                              onChange={e => updateLocalField(b.id, 'slug', e.target.value)}
                              className="h-8 text-xs bg-white flex-1 font-mono"
                            />
                          </div>
                        </div>

                        {/* Explicit Save Action Grid */}
                        <div className="flex justify-end pt-1">
                          <Button
                            onClick={() => handleSaveRow(b.id)}
                            disabled={isSaving}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-1.5 rounded-lg transition-all shadow-sm cursor-pointer"
                          >
                            {isSaving ? (
                              <div className="flex items-center gap-1.5">
                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Kaydediliyor...</span>
                              </div>
                            ) : (
                              'Kaydet ve Güncelle'
                            )}
                          </Button>
                        </div>
                      </div>
                    )
                  })}

                  {businesses.length === 0 && (
                    <div className="text-center py-12 text-neutral-400 text-sm">
                      Sisteme kayıtlı hiçbir işletme bulunmamaktadır.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 2: CREATE / REGISTER NEW CLIENT */}
          {activeTab === 'create' && (
            <Card className="border-neutral-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Yeni İşletme ve Yetkili Hesabı Ekle</CardTitle>
                <CardDescription>
                  Yalnızca yöneticiler yeni kullanıcı kaydı yapabilir. Tanımlanan kullanıcı kendi giriş bilgileriyle asistan ayarlarını yönetebilir.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cName">İşletme Yetkilisi / Şirket İsmi</Label>
                      <Input
                        id="cName"
                        required
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        placeholder="Örn: Lumina Coffee House veya Ahmet Yılmaz"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cType">İşletme Tipi</Label>
                      <Input
                        id="cType"
                        required
                        value={newType}
                        onChange={e => setNewType(e.target.value)}
                        placeholder="Örn: Diş Kliniği, Güzellik Merkezi"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cEmail">Giriş E-postası (Eşsiz)</Label>
                      <Input
                        id="cEmail"
                        type="email"
                        required
                        value={newEmail}
                        onChange={e => setNewEmail(e.target.value)}
                        placeholder="isletme@sistem.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cPassword">Giriş Şifresi</Label>
                      <Input
                        id="cPassword"
                        type="password"
                        required
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-3">
                    <Button
                      type="submit"
                      disabled={actionLoading}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                    >
                      {actionLoading ? 'Oluşturuluyor...' : 'İşletmeyi Yetkilendir ve Ekle'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* TAB 3: DIALOGUE LOGS TRACKER (Last messages list across ALL businesses!) */}
          {activeTab === 'conversations' && (
            <Card className="border-neutral-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Son Görüşmeler (Diyalog Geçmişi)</CardTitle>
                <CardDescription>
                  Sistemdeki tüm işletmelerin en son diyaloglarını ve görüşme geçmişini izleyin.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                  {/* LEFT LIST: Flat aggregate of all conversations */}
                  <div className="md:col-span-1 border border-neutral-200 rounded-xl divide-y divide-neutral-100 max-h-[380px] overflow-y-auto bg-neutral-50/30">
                    {allConversations.map((conv: any) => (
                      <button
                        key={conv.id}
                        type="button"
                        onClick={() => setSelectedConvId(conv.id)}
                        className={`w-full text-left p-3.5 flex flex-col gap-1 transition-all ${selectedConvId === conv.id ? 'bg-indigo-50/80 border-l-4 border-l-indigo-600' : 'hover:bg-neutral-50'
                          }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-neutral-900 truncate">
                            {conv.customerJid.split('@')[0]}
                          </span>
                          <span className="text-[9px] text-indigo-600 font-bold bg-indigo-50 border border-indigo-100/60 px-1.5 py-0.5 rounded truncate max-w-[80px]">
                            {conv.businessName}
                          </span>
                        </div>
                        <span className="text-[10px] text-neutral-400 font-medium">
                          Tarih: {new Date(conv.updatedAt).toLocaleDateString('tr-TR')} {new Date(conv.updatedAt).toLocaleTimeString('tr-TR')}
                        </span>
                      </button>
                    ))}

                    {allConversations.length === 0 && (
                      <div className="text-center py-12 text-neutral-400 text-xs">
                        Sistemde kayıtlı aktif bir diyalog geçmişi bulunmamaktadır.
                      </div>
                    )}
                  </div>

                  {/* RIGHT MESSAGE BODY */}
                  <div className="md:col-span-2 border border-neutral-200 rounded-xl p-4 flex flex-col h-[380px] bg-neutral-950 text-neutral-200">
                    {selectedConv ? (
                      <div className="flex-1 flex flex-col h-full">
                        <div className="pb-3 border-b border-neutral-800 flex justify-between items-center shrink-0">
                          <div className="flex flex-col">
                            <span className="font-bold text-indigo-400">{selectedConv.customerJid}</span>
                            <span className="text-[10px] text-neutral-400 font-medium italic mt-0.5">
                              İşletme: <span className="font-bold text-neutral-300">{selectedConv.businessName}</span>
                            </span>
                          </div>
                          <span className="text-[9px] text-neutral-500 font-bold uppercase">Yönetici Görünümü</span>
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
                        Görüşme geçmişini incelemek için soldaki listeden bir diyalog seçin.
                      </div>
                    )}
                  </div>

                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 4: APPOINTMENTS TRACKER ACROSS ALL BUSINESSES */}
          {activeTab === 'appointments' && (
            <Card className="border-neutral-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Tüm Sistemin Randevu Havuzu</CardTitle>
                <CardDescription>İşletmelerin takvimine asistanlar tarafından eklenen tüm randevuları filtreleyin ve inceleyin.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-neutral-200 text-neutral-400 font-semibold">
                        <th className="py-2.5 px-3">İşletme</th>
                        <th className="py-2.5 px-3">Müşteri</th>
                        <th className="py-2.5 px-3">Telefon</th>
                        <th className="py-2.5 px-3">Tarih / Saat</th>
                        <th className="py-2.5 px-3">Durum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {businesses.flatMap(b =>
                        (b.appointments || []).map((app: any) => ({
                          ...app,
                          businessName: b.name
                        }))
                      ).map((app: any) => (
                        <tr key={app.id} className="hover:bg-neutral-50/50">
                          <td className="py-3 px-3 font-bold text-neutral-900">{app.businessName}</td>
                          <td className="py-3 px-3 font-semibold text-neutral-800">{app.customerName}</td>
                          <td className="py-3 px-3 text-neutral-600">{app.phone}</td>
                          <td className="py-3 px-3 font-bold text-indigo-600">
                            {app.date} / {app.time}
                          </td>
                          <td className="py-3 px-3">
                            <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                              Onaylandı
                            </span>
                          </td>
                        </tr>
                      ))}

                      {businesses.flatMap(b => b.appointments || []).length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-neutral-400 text-xs">
                            Sistemde kayıtlı randevu kaydı bulunmamaktadır.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

        </main>

      </div>
    </div>
  )
}
