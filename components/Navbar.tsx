'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export function Navbar() {
  const pathname = usePathname()
  const isPortal = pathname === '/dashboard' || pathname === '/admin'

  if (isPortal) return null

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-neutral-200/80 shadow-sm py-4">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
          <Image src="/logo.jpg" alt="Aloyz" width={36} height={36} className="rounded-lg shadow-sm" />
          <span className="text-xl font-bold tracking-tight text-neutral-900">
            Aloyz
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
