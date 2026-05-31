'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
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

  const [activeTab, setActiveTab] = useState<'businesses' | 'create' | 'conversations' | 'appointments' | 'whatsapp'>('businesses')
  const [loading, setLoading] = useState(true)

  // WhatsApp Setup tab states
  const [selectedBusinessId, setSelectedBusinessId] = useState('')
  const [slugInput, setSlugInput] = useState('')
  const [qrCodeLoading, setQrCodeLoading] = useState(false)
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null)

  // Lists of fetched businesses (which include nested owner, conversations, and appointments)
  const [businesses, setBusinesses] = useState<any[]>([])
  const [instances, setInstances] = useState<any[]>([])
  const [instancesLoading, setInstancesLoading] = useState(false)

  // Row changes state tracking
  const [localChanges, setLocalChanges] = useState<Record<string, { calendarId: string; slug: string; is_active: boolean; test_mode: boolean; instagram_page_id: string; instagram_access_token: string }>>({})
  const [rowLoading, setRowLoading] = useState<Record<string, boolean>>({})
  const [showInstagramToken, setShowInstagramToken] = useState<Record<string, boolean>>({})

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

  async function fetchInstances() {
    try {
      setInstancesLoading(true)
      const res = await fetch('/api/instances/list')
      if (res.ok) {
        const data = await res.json()
        if (data.success && Array.isArray(data.instances)) {
          setInstances(data.instances)
        }
      }
    } catch (err) {
      console.error('Error fetching instances:', err)
    } finally {
      setInstancesLoading(false)
    }
  }

  async function fetchAdminData() {
    try {
      setLoading(true)
      const res = await fetch('/api/admin')
      if (res.ok) {
        const data = await res.json()
        setBusinesses(data)
      }
      await fetchInstances()
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
        is_active: !!biz?.is_active,
        test_mode: !!biz?.test_mode,
        instagram_page_id: biz?.instagram_page_id || '',
        instagram_access_token: biz?.instagram_access_token || '',
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
      is_active: !!biz?.is_active,
      test_mode: !!biz?.test_mode,
      instagram_page_id: biz?.instagram_page_id || '',
      instagram_access_token: biz?.instagram_access_token || '',
    }

    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          calendarId: current.calendarId,
          is_active: current.is_active,
          test_mode: current.test_mode,
          slug: current.slug,
          instagram_page_id: current.instagram_page_id,
          instagram_access_token: current.instagram_access_token,
        }),
      })

      if (res.ok) {
        // Update local React state array without triggering jumpy fetch refreshes!
        setBusinesses(prev =>
          prev.map(b =>
            b.id === businessId
              ? { ...b, calendarId: current.calendarId, is_active: current.is_active, test_mode: current.test_mode, slug: current.slug, instagram_page_id: current.instagram_page_id, instagram_access_token: current.instagram_access_token }
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

  // Handle WhatsApp Business Selection & Slug auto-population
  const handleSelectBusiness = (businessId: string) => {
    setSelectedBusinessId(businessId)
    const biz = businesses.find(b => b.id === businessId)
    setSlugInput(biz?.slug || '')
    setQrCodeBase64(null)
  }

  // Handle WhatsApp Create Instance
  async function handleCreateWhatsAppInstance() {
    if (!selectedBusinessId || !slugInput) {
      setActionError('Lütfen bir işletme seçin ve geçerli bir slug girin.')
      return
    }

    setActionLoading(true)
    setActionSuccess('')
    setActionError('')
    setQrCodeBase64(null)

    try {
      const res = await fetch('/api/instances/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: slugInput,
          businessId: selectedBusinessId,
        }),
      })

      if (res.ok) {
        setActionSuccess(`WhatsApp oturumu "${slugInput}" başarıyla oluşturuldu ve ayarlandı!`)
        // Refresh businesses data in state to include new slug if changed
        await fetchAdminData()
      } else {
        const data = await res.json()
        setActionError(data.error || 'Oturum oluşturulurken bir hata oluştu.')
      }
    } catch (err) {
      setActionError('Sistem hatası oluştu.')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle QR Code Retrieval
  async function handleFetchQRCode() {
    if (!slugInput) {
      setActionError('QR kodunu almak için geçerli bir slug bulunmalıdır.')
      return
    }

    setQrCodeLoading(true)
    setActionSuccess('')
    setActionError('')
    setQrCodeBase64(null)

    try {
      const res = await fetch(`/api/instances/qr?slug=${encodeURIComponent(slugInput)}`)
      if (res.ok) {
        const data = await res.json()
        if (data.qrBase64) {
          setQrCodeBase64(data.qrBase64)
          setActionSuccess('QR Kod başarıyla yüklendi! Lütfen WhatsApp uygulamanızdan taratın.')
        } else {
          setActionError('QR Kod verisi alınamadı. Bağlantının aktif veya bağlanmaya hazır olduğundan emin olun.')
        }
      } else {
        const data = await res.json()
        setActionError(data.error || 'QR kod yüklenirken hata oluştu.')
      }
    } catch (err) {
      setActionError('Sistem veya bağlantı hatası oluştu.')
    } finally {
      setQrCodeLoading(false)
    }
  }

  // Handle WhatsApp Instance Deletion
  async function handleDeleteInstance(slug: string) {
    if (!window.confirm(`"${slug}" oturumunu silmek istediğinizden emin misiniz? Bu işlem WhatsApp bağlantısını tamamen koparacaktır.`)) {
      return
    }

    setActionLoading(true)
    setActionSuccess('')
    setActionError('')

    try {
      const res = await fetch(`/api/instances/delete?slug=${encodeURIComponent(slug)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      })

      if (res.ok) {
        setActionSuccess(`"${slug}" oturumu başarıyla silindi!`)
        // Refresh businesses and instances
        await fetchAdminData()
      } else {
        const data = await res.json()
        setActionError(data.error || 'Oturum silinirken bir hata oluştu.')
      }
    } catch (err) {
      setActionError('Sistem hatası oluştu.')
    } finally {
      setActionLoading(false)
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
            <Image src="/logo.jpg" alt="Aloyz" width={34} height={34} className="rounded-lg shadow-sm" />
            <span className="text-lg font-bold tracking-tight text-neutral-900">Aloyz</span>
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
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 ${activeTab === 'whatsapp'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
          >
            🔌 WhatsApp Kurulumu
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
                      is_active: !!b.is_active,
                      test_mode: !!b.test_mode,
                      instagram_page_id: b.instagram_page_id || '',
                      instagram_access_token: b.instagram_access_token || '',
                    }
                    const isSaving = !!rowLoading[b.id]

                    const bizSlug = b.slug || ''
                    const matchingInstance = instances.find((inst: any) => {
                      const name = inst.name || inst.instance?.instanceName || inst.instanceName
                      return name === bizSlug
                    })
                    const instanceStatus = matchingInstance?.connectionStatus || matchingInstance?.status || matchingInstance?.instance?.status || null

                    return (
                      <div key={b.id} className="py-6 first:pt-0 last:pb-0 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <h3 className="text-base font-bold text-neutral-900">{b.name}</h3>
                            <p className="text-xs text-neutral-500 mt-0.5">
                              Tipi: <span className="font-semibold">{b.type}</span> | Sahibi: <span className="font-semibold">{b.owner?.email}</span>
                            </p>
                            {bizSlug ? (
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-neutral-500 font-semibold">WhatsApp Durumu:</span>
                                {matchingInstance ? (
                                  instanceStatus === 'open' ? (
                                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                      🟢 Bağlı (Aktif)
                                    </span>
                                  ) : instanceStatus === 'connecting' ? (
                                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 animate-pulse">
                                      🟡 Bağlanıyor
                                    </span>
                                  ) : (
                                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100">
                                      🔴 Bağlantı Kesildi ({instanceStatus || 'close'})
                                    </span>
                                  )
                                ) : (
                                  <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-600 border border-neutral-200">
                                    ⚪ Oturum Oluşturulmamış
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 mt-1">
                                <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-100 text-neutral-500 border border-dashed border-neutral-300">
                                  ⚠️ Slug Tanımlanmamış
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            <span className="text-xs font-semibold text-neutral-500">Asistan Durumu:</span>
                            <select
                              value={rowChanges.is_active ? 'active' : 'inactive'}
                              onChange={e => updateLocalField(b.id, 'is_active', e.target.value === 'active')}
                              className="text-xs font-bold px-2.5 py-1 rounded border border-neutral-300 bg-white shadow-sm cursor-pointer hover:border-neutral-400"
                            >
                              <option value="inactive">Pasif / Kurulumda</option>
                              <option value="active">Aktif (WhatsApp Çalışıyor)</option>
                            </select>
                            <span className="text-xs font-semibold text-neutral-500">Test Modu:</span>
                            <select
                              value={rowChanges.test_mode ? 'enabled' : 'disabled'}
                              onChange={e => updateLocalField(b.id, 'test_mode', e.target.value === 'enabled')}
                              className="text-xs font-bold px-2.5 py-1 rounded border border-neutral-300 bg-white shadow-sm cursor-pointer hover:border-neutral-400"
                            >
                              <option value="disabled">Kapalı</option>
                              <option value="enabled">Açık</option>
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

                        {/* Instagram Integration Fields */}
                        <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200/60 space-y-2">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold text-neutral-700">📸 Instagram Entegrasyonu</span>
                            {b.instagram_page_id && b.instagram_access_token ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Bağlı
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                Bağlı Değil
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex items-center gap-3">
                              <Label className="text-xs font-bold text-neutral-600 shrink-0 w-24">Account ID:</Label>
                              <Input
                                placeholder="17841461542767332"
                                value={rowChanges.instagram_page_id}
                                onChange={e => updateLocalField(b.id, 'instagram_page_id', e.target.value)}
                                className="h-8 text-xs bg-white flex-1 font-mono"
                              />
                            </div>
                            <div className="flex items-center gap-3">
                              <Label className="text-xs font-bold text-neutral-600 shrink-0 w-24">Access Token:</Label>
                              <div className="relative flex-1">
                                <Input
                                  type={showInstagramToken[b.id] ? 'text' : 'password'}
                                  placeholder="IGAAOh5..."
                                  value={rowChanges.instagram_access_token}
                                  onChange={e => updateLocalField(b.id, 'instagram_access_token', e.target.value)}
                                  className="h-8 text-xs bg-white pr-8 font-mono"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowInstagramToken(prev => ({ ...prev, [b.id]: !prev[b.id] }))}
                                  className="absolute inset-y-0 right-0 px-2 flex items-center text-neutral-400 hover:text-neutral-600"
                                >
                                  {showInstagramToken[b.id] ? (
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                  ) : (
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                  )}
                                </button>
                              </div>
                            </div>
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

          {/* TAB 5: WHATSAPP INTEGRATION & INSTANCE ONBOARDING */}
          {activeTab === 'whatsapp' && (
            <Card className="border-neutral-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-bold">
                  <span>🔌 WhatsApp Asistan Kurulumu</span>
                </CardTitle>
                <CardDescription>
                  İşletmeleriniz için Evolution API tabanlı WhatsApp entegrasyonu oluşturun ve QR kod eşleştirmesi yapın.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* 1. Select Business */}
                <div className="space-y-2">
                  <Label htmlFor="business-select" className="text-sm font-bold text-neutral-700">
                    1. Kurulum Yapılacak İşletmeyi Seçin
                  </Label>
                  <select
                    id="business-select"
                    value={selectedBusinessId}
                    onChange={e => handleSelectBusiness(e.target.value)}
                    className="w-full text-sm font-semibold p-3 rounded-xl border border-neutral-200 bg-white shadow-sm cursor-pointer focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">-- İşletme Seçin --</option>
                    {businesses.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.type}) {b.slug ? `[Mevcut Slug: ${b.slug}]` : '[Slug Tanımlanmamış]'}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedBusinessId && (
                  <div className="space-y-6">
                    
                    {/* 2. Configure Slug */}
                    <div className="space-y-2">
                      <Label htmlFor="slug-input" className="text-sm font-bold text-neutral-700">
                        2. WhatsApp Bağlantı Adresi (Slug)
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="slug-input"
                          value={slugInput}
                          onChange={e => setSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                          placeholder="ornegin-lumina-cafe"
                          className="font-mono text-sm"
                        />
                      </div>
                      <p className="text-xs text-neutral-500">
                        İşletme için benzersiz ve küçük harflerden oluşan bir takma ad belirleyin. Boşluk içermemeli, sadece harf, rakam, tire (-) veya alt çizgi (_) barındırmalıdır.
                      </p>
                    </div>

                    {/* 3. Action Buttons Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      
                      {/* Create Instance Button */}
                      <div className="flex flex-col gap-1.5">
                        <Button
                          onClick={handleCreateWhatsAppInstance}
                          disabled={actionLoading || !slugInput}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-indigo-600/10 cursor-pointer flex items-center justify-center gap-2"
                        >
                          {actionLoading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Oturum Oluşturuluyor...</span>
                            </>
                          ) : (
                            <>
                              <span>⚙️ Yeni WhatsApp Oturumu Oluştur</span>
                            </>
                          )}
                        </Button>
                        <span className="text-[10px] text-center text-neutral-500 font-medium">
                          Yeni bir Evolution oturumu, webhook ve geçmiş senkronizasyon yapılandırması hazırlar.
                        </span>
                      </div>

                      {/* Fetch QR Code Button */}
                      <div className="flex flex-col gap-1.5">
                        <Button
                          onClick={handleFetchQRCode}
                          disabled={qrCodeLoading || !slugInput}
                          variant="outline"
                          className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-bold py-3.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          {qrCodeLoading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                              <span>QR Kod Alınıyor...</span>
                            </>
                          ) : (
                            <>
                              <span>📷 QR Kodunu Getir</span>
                            </>
                          )}
                        </Button>
                        <span className="text-[10px] text-center text-neutral-500 font-medium">
                          WhatsApp Web QR kodunu getirerek hesabınızı sisteme bağlamanızı sağlar.
                        </span>
                      </div>

                    </div>

                    {/* QR Code Presentation & Pairing Instructions */}
                    {qrCodeBase64 && (
                      <div className="border border-emerald-200 bg-emerald-50/40 rounded-2xl p-6 mt-6 flex flex-col md:flex-row items-center gap-6">
                        
                        {/* QR Image Frame */}
                        <div className="shrink-0 flex flex-col items-center gap-2">
                          <div className="bg-white p-4 rounded-xl shadow-md border border-neutral-100">
                            <img
                              src={qrCodeBase64.startsWith('data:') ? qrCodeBase64 : `data:image/png;base64,${qrCodeBase64}`}
                              alt="WhatsApp QR Code"
                              className="w-48 h-48 mx-auto"
                            />
                          </div>
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full animate-pulse">
                            Bağlantı Bekleniyor
                          </span>
                        </div>

                        {/* Pairing Instructions */}
                        <div className="flex-1 space-y-3">
                          <h4 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                            <span>📲 Telefonunuzdan Nasıl Bağlayacaksınız?</span>
                          </h4>
                          <ol className="text-xs text-neutral-600 space-y-2 list-decimal list-inside pl-1">
                            <li>Telefonunuzda <strong>WhatsApp</strong> uygulamasını açın.</li>
                            <li>Sağ üst köşedeki menüden veya <strong>Ayarlar</strong> bölümünden <strong>Bağlı Cihazlar</strong> seçeneğine gidin.</li>
                            <li><strong>"Cihaz Bağla"</strong> butonuna dokunun.</li>
                            <li>Telefonunuzun kamerasını soldaki <strong>QR koduna</strong> doğrultarak taratın.</li>
                            <li>Bağlantı tamamlandığında bu panelden veya işletmeler listesinden asistanı <strong>"Aktif"</strong> duruma getirin.</li>
                          </ol>

                          <div className="pt-2">
                            <p className="text-[10px] text-neutral-500 italic">
                              * QR kodları güvenlik nedeniyle kısa süre geçerlidir. Eşleşme başarısız olursa tekrar "QR Kodunu Getir" butonuna tıklayarak yeni kod talep edebilirsiniz.
                            </p>
                          </div>
                        </div>

                      </div>
                    )}

                  </div>
                )}

                {!selectedBusinessId && (
                  <div className="border-2 border-dashed border-neutral-200 rounded-2xl p-12 text-center text-neutral-400">
                    <div className="text-3xl mb-2">🔌</div>
                    <div className="text-sm font-semibold">Başlamak için Lütfen Bir İşletme Seçin</div>
                    <div className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                      WhatsApp entegrasyonu yapmak istediğiniz kayıtlı işletmeyi yukarıdaki listeden seçerek kuruluma başlayabilirsiniz.
                    </div>
                  </div>
                )}

                {/* Evolution Instances List (Always visible at the bottom of WhatsApp tab) */}
                <div className="pt-8 border-t border-neutral-200 mt-8">
                  <h3 className="text-lg font-bold text-neutral-900 mb-2 flex items-center gap-2">
                    <span>🤖 Evolution API Aktif Oturumları</span>
                    {instancesLoading && (
                      <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    )}
                  </h3>
                  <p className="text-xs text-neutral-500 mb-4">
                    Sistemdeki Evolution API sunucusunda kurulu olan tüm WhatsApp oturumlarını ve bağlantı durumlarını buradan izleyebilirsiniz.
                  </p>

                  <div className="overflow-x-auto border border-neutral-200 rounded-xl bg-neutral-50/20">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-500 font-bold text-xs uppercase tracking-wider">
                          <th className="py-3 px-4">Oturum İsmi (Slug)</th>
                          <th className="py-3 px-4">Eşleşen İşletme</th>
                          <th className="py-3 px-4">Durum</th>
                          <th className="py-3 px-4 text-right">İşlemler</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 bg-white">
                        {instances.map((inst: any, idx: number) => {
                          const instName = inst.name || inst.instance?.instanceName || inst.instanceName || ''
                          const matchingBiz = businesses.find(b => b.slug === instName)
                          const instStatus = inst.connectionStatus || inst.status || inst.instance?.status || 'close'

                          return (
                            <tr key={idx} className="hover:bg-neutral-50/50 transition-colors">
                              <td className="py-3.5 px-4 font-mono font-bold text-neutral-800 text-xs">
                                {instName}
                              </td>
                              <td className="py-3.5 px-4">
                                {matchingBiz ? (
                                  <div>
                                    <span className="font-semibold text-neutral-950 text-xs">{matchingBiz.name}</span>
                                    <span className="block text-[10px] text-neutral-500">{matchingBiz.type}</span>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-neutral-400 italic">Eşleşen İşletme Bulunamadı</span>
                                )}
                              </td>
                              <td className="py-3.5 px-4">
                                {instStatus === 'open' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                    🟢 Bağlı (Aktif)
                                  </span>
                                ) : instStatus === 'connecting' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100 animate-pulse">
                                    🟡 Bağlanıyor
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100">
                                    🔴 Bağlantı Kesildi
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteInstance(instName)}
                                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm cursor-pointer inline-flex items-center gap-1"
                                >
                                  🗑️ Oturumu Sil
                                </Button>
                              </td>
                            </tr>
                          )
                        })}

                        {instances.length === 0 && (
                          <tr>
                            <td colSpan={4} className="text-center py-8 text-neutral-400 text-xs italic">
                              Sunucuda aktif WhatsApp oturumu bulunmamaktadır.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </CardContent>
            </Card>
          )}

        </main>

      </div>
    </div>
  )
}
