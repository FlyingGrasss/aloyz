import type { Metadata } from 'next'
import './globals.css'
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'CustomerAI | Kurumsal İşletme Yönetim Paneli',
  description: 'İşletmeniz için WhatsApp otomasyonu ve müşteri veri yönetim portalı',
}

import { Providers } from "@/components/Providers"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" className={cn("h-full", "font-sans", geist.variable)}>
      <body className="h-full bg-slate-50/50">
        <Providers>
          <div className="min-h-screen flex flex-col justify-between">
            <Navbar />
            <div className="flex-1 flex flex-col">
              {children}
            </div>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  )
}
