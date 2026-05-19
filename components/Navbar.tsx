'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

export function Navbar() {
  const pathname = usePathname()
  const isPortal = pathname === '/dashboard' || pathname === '/admin'

  if (isPortal) return null

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-neutral-200/80 shadow-sm py-4">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
          <div className="w-9 h-9 bg-indigo-600 text-white rounded-lg flex items-center justify-center shadow-md shadow-indigo-600/10">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <path d="M13 8H7" />
              <path d="M17 12H7" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-neutral-900">
            CustomerAI
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link 
            href="/login" 
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
          >
            Giriş Yap
          </Link>
        </div>
      </div>
    </header>
  )
}
