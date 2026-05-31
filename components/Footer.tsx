import Link from 'next/link'

export function Footer() {
  return (
    <footer className="w-full bg-white border-t border-neutral-200/60 py-8">
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
        <p>© 2026 Aloyz. Tüm hakları saklıdır.</p>
        <div className="flex gap-6">
          <Link href="https://aloyz.co" className="hover:text-neutral-700 transition-colors">aloyz.co</Link>
          <Link href="https://www.instagram.com/aloyz.co/" target="_blank" rel="noreferrer" className="hover:text-neutral-700 transition-colors">Instagram</Link>
          <Link href="/login" className="hover:text-neutral-700 transition-colors">İşletme Girişi</Link>
        </div>
      </div>
    </footer>
  )
}
