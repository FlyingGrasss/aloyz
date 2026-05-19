import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

export default function HomePage() {
  return (
    <main className="relative z-10 flex-1 max-w-6xl mx-auto w-full px-6 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-16 py-12">
      
      {/* Left Side: Dynamic Pitch & Value Indicators */}
      <div className="flex-1 space-y-8 text-center lg:text-left max-w-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-100 bg-indigo-50 text-xs font-semibold text-indigo-600 tracking-wide uppercase">
          <span>Kurumsal Yönetim Altyapısı</span>
        </div>
        
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-neutral-900">
          Müşteri İletişimini <br />
          <span className="text-indigo-600">
            Otomasyonla Güçlendirin
          </span>
        </h1>
        
        <p className="text-base sm:text-lg text-neutral-600 leading-relaxed max-w-md mx-auto lg:mx-0">
          Müşteri verilerinizi, çalışma saatlerinizi ve özel talimatlarınızı tek bir panelden yönetin. Yapay zeka asistan altyapımız için kusursuz bilgi akışı sağlayın.
        </p>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-left">
          <div className="flex items-start gap-3 p-4 rounded-xl border border-neutral-200 bg-white shadow-sm">
            <div className="mt-1 w-5 h-5 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 font-bold text-xs">
              ✓
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Google Calendar</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Mükemmel senkronize randevu takibi</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-4 rounded-xl border border-neutral-200 bg-white shadow-sm">
            <div className="mt-1 w-5 h-5 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100 font-bold text-xs">
              ✓
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Dinamik Prompt</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Gelişmiş Türkçe Prompt Yapılandırması</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Elegant White Form Glassmorphic Card */}
      <div className="w-full max-w-md shrink-0 lg:my-0 my-8">
        <div className="relative group">
          {/* Outer soft shadow aura */}
          <div className="absolute -inset-1 rounded-3xl bg-indigo-600/5 opacity-40 blur-xl transition duration-1000 group-hover:opacity-60" />
          
          <div className="relative rounded-2xl border border-neutral-200/80 bg-white p-8 shadow-xl space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
                Yönetim Paneline Erişin
              </h2>
              <p className="text-sm text-neutral-500 leading-relaxed">
                Hesabınıza giriş yaparak işletme ayarlarınızı, menü ve özel talimatlarınızı güncelleyin.
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <Link 
                href="/login" 
                className={buttonVariants({ size: 'lg', className: 'w-full rounded-xl font-bold text-white shadow-lg bg-indigo-600 hover:bg-indigo-700 transition-all flex items-center justify-center cursor-pointer border-none' })}
              >
                Giriş Yap
              </Link>
            </div>

            <div className="pt-4 border-t border-neutral-100 flex justify-between items-center text-xs text-neutral-400 font-medium">
              <span>🛡️ 256-bit Veri Güvenliği</span>
              <span>⚡ WhatsApp Entegrasyonu</span>
            </div>
          </div>
        </div>
      </div>

    </main>
  )
}
