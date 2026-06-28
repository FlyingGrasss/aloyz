import type { Metadata } from 'next'
import './globals.css'
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/Providers"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  metadataBase: new URL('https://aloyz.co'),
  title: {
    default: 'Aloyz | WhatsApp ve Instagram Otomasyon Paneli',
    template: '%s | Aloyz',
  },
  description: 'Aloyz, işletmeler için WhatsApp ve Instagram mesajlaşma otomasyonu, randevu takibi ve müşteri iletişimi yönetim panelidir.',
  applicationName: 'Aloyz',
  keywords: ['Aloyz', 'WhatsApp otomasyonu', 'Instagram otomasyonu', 'işletme paneli', 'randevu yönetimi', 'müşteri iletişimi'],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Aloyz',
    description: 'WhatsApp ve Instagram otomasyonu ile müşteri iletişimi yönetimi.',
    url: 'https://aloyz.co',
    siteName: 'Aloyz',
    images: [{ url: '/logo.jpg', width: 800, height: 800, alt: 'Aloyz logo' }],
    locale: 'tr_TR',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Aloyz',
    description: 'WhatsApp ve Instagram otomasyonu ile müşteri iletişimi yönetimi.',
    images: ['/logo.jpg'],
  },
  icons: {
    icon: '/logo.jpg',
    apple: '/logo.jpg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" suppressHydrationWarning className={cn("h-full", "font-sans", geist.variable)}>
      <body className="h-full bg-slate-50/50">
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('aloyz-theme');var l=localStorage.getItem('aloyz-language')||'tr';document.documentElement.classList.toggle('dark',t==='dark');document.documentElement.lang=l;document.documentElement.dataset.language=l;}catch(e){}",
          }}
        />
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
