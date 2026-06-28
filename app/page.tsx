import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { buttonVariants } from '@/components/ui/button'

export default async function HomePage() {
  const session = await auth()
  if (session?.user) redirect('/dashboard')

  return (
    <main className="relative z-10 flex-1 max-w-6xl mx-auto w-full px-6 py-12">
      <div className="grid min-h-[calc(100vh-180px)] grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] items-center gap-12">
        <section className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-600 shadow-sm">
            WhatsApp ve Instagram otomasyon altyapısı
          </div>

          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <Image src="/logo.jpg" alt="Aloyz" width={68} height={68} className="rounded-2xl shadow-sm" priority />
              <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-neutral-950">
                Aloyz
              </h1>
            </div>
            <p className="max-w-xl text-lg leading-relaxed text-neutral-600">
              İşletmeler için WhatsApp ve Instagram üzerinden müşteri yanıtları, randevu akışı, takvim eşleşmesi ve görüşme takibini tek bir profesyonel panelde toplar.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/login"
              className={buttonVariants({ size: 'lg', className: 'rounded-lg bg-neutral-950 px-5 font-bold text-white hover:bg-neutral-800' })}
            >
              Panele Giriş Yap
            </Link>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            <div className="border-l border-neutral-300 pl-4">
              <dt className="text-sm font-bold text-neutral-950">Randevu</dt>
              <dd className="mt-1 text-xs leading-relaxed text-neutral-500">Google Takvim ile uyumlu kayıt ve takip akışı.</dd>
            </div>
            <div className="border-l border-neutral-300 pl-4">
              <dt className="text-sm font-bold text-neutral-950">WhatsApp</dt>
              <dd className="mt-1 text-xs leading-relaxed text-neutral-500">QR eşleşmesi ve işletme bazlı bağlantı yönetimi.</dd>
            </div>
            <div className="border-l border-neutral-300 pl-4">
              <dt className="text-sm font-bold text-neutral-950">Instagram</dt>
              <dd className="mt-1 text-xs leading-relaxed text-neutral-500">Instagram DM akışı ve işletme bazlı mesaj yönetimi.</dd>
            </div>
            <div className="border-l border-neutral-300 pl-4">
              <dt className="text-sm font-bold text-neutral-950">Kontrol</dt>
              <dd className="mt-1 text-xs leading-relaxed text-neutral-500">Test modu, içerik, SSS ve konuşma günlükleri.</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl shadow-neutral-900/5">
          <div className="border-b border-neutral-200 pb-5">
            <p className="text-xs font-bold uppercase tracking-wide text-neutral-400">Operasyon Özeti</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-neutral-950">Müşteri iletişimi için sakin, izlenebilir bir merkez.</h2>
          </div>
          <div className="divide-y divide-neutral-100">
            {[
              ['01', 'İşletme bilgilerini ve çalışma saatlerini güncel tutun.'],
              ['02', 'Aloyz asistanının kullanacağı menü, hizmet ve SSS bilgisini yönetin.'],
              ['03', 'WhatsApp, Instagram ve test modunu kontrollü şekilde yönetin.'],
            ].map(([num, text]) => (
              <div key={num} className="flex gap-4 py-5">
                <span className="font-mono text-sm font-bold text-neutral-400">{num}</span>
                <p className="text-sm leading-relaxed text-neutral-700">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
