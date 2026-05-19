'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

export function Footer() {
  const pathname = usePathname()
  const isPortal = pathname === '/dashboard' || pathname === '/admin'

  if (isPortal) return null

  return (
    <footer className="w-full bg-white border-t border-neutral-200/60 py-8">
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
        <p>© 2026 CustomerAI Enterprise. Tüm hakları saklıdır.</p>
        <div className="flex gap-6">
          <Link href="/login" className="hover:text-neutral-600 transition-colors">İşletme Girişi</Link>
        </div>
      </div>
    </footer>
  )
}
