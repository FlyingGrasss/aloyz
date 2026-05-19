import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const hash = await bcrypt.hash('password123', 10)
  const adminHash = await bcrypt.hash('admin123', 10)

  // 1. Create Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Sistem Yöneticisi',
      password_hash: adminHash,
      role: 'admin',
    },
  })

  // 2. Create Business User
  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      name: 'Lumina Coffee House',
      password_hash: hash,
      role: 'business',
    },
  })

  // 3. Create Business Profile for User if not exists
  const existingBusiness = await prisma.business.findFirst({
    where: { ownerId: user.id },
  })

  if (!existingBusiness) {
    await prisma.business.create({
      data: {
        ownerId: user.id,
        name: 'Lumina Coffee House',
        slug: 'lumina-coffee', // Admin-managed unique slug
        type: 'Nesil Kahveci / Cafe',
        address: 'Atatürk Caddesi No:123, Kadıköy, İstanbul',
        phone: '0216 123 45 67',
        calendarId: 'lumina_calendar_id',
        website: 'www.luminacoffee.com',
        welcome_message:
          "Merhaba! Lumina Coffee House'a hoş geldiniz ☕. Size nasıl yardımcı olabilirim? Menümüzü veya çalışma saatlerimizi incelemek ister misiniz?",
        hours: {
          pazartesi: '08:00 - 22:00',
          sali: '08:00 - 22:00',
          carsamba: '08:00 - 22:00',
          persembe: '08:00 - 22:00',
          cuma: '08:00 - 23:30',
          cumartesi: '09:00 - 23:30',
          pazar: '09:00 - 21:00',
        },
        menu_or_services: `### ☕ KAHVELER
*   **Espresso:** 65₺
*   **Americano:** 75₺
*   **Latte:** 90₺
*   **Cappuccino:** 90₺
*   **Flat White:** 95₺
*   **Cortado:** 80₺
*   **Türk Kahvesi:** 60₺

### 🍵 ÇAYLAR & SOĞUKLAR
*   **Bitki Çayları:** 70₺
*   **Cold Brew:** 110₺
*   **Iced Latte:** 95₺
*   **Ev Yapımı Limonata:** 85₺

### 🍰 TATLILAR & ATIŞTIRMALIKLAR
*   **San Sebastian Cheesecake:** 140₺
*   **Çikolatalı Brownie:** 110₺
*   **Kruvasan (Sade):** 80₺
*   **Avokadolu Tost:** 180₺`,
        faqs: [
          {
            question: 'Vegan veya glütensiz seçenekleriniz var mı?',
            answer:
              'Evet! Vegan tatlılarımız ve glütensiz ekmek seçeneklerimiz mevcut. Ayrıca sütlü içecekleriniz için yulaf, badem ve soya sütü seçeneklerimiz bulunmaktadır.',
          },
          {
            question: 'Wi-Fi şifresi nedir?',
            answer:
              'Misafirlerimiz için yüksek hızlı Wi-Fi ücretsizdir. Şifre fişinizin üzerinde yazmaktadır veya barista arkadaşımızdan öğrenebilirsiniz.',
          },
          {
            question: 'Rezervasyon alıyor musunuz?',
            answer:
              'Genel olarak sıra usulü çalışıyoruz ancak gruplar için 0216 123 45 67 numaralı hattımızdan önceden arayıp masa durumunu teyit edebilirsiniz.',
          },
        ],
        special_instructions:
          'Müşteri paket kahve çekirdeği almak isterse, elimizde Ethiopia Sidamo olduğunu belirt.',
        is_active: false, // Default to false
      },
    })
  }

  console.log('✅ Demo users created!')
  console.log('--- ADMIN ---')
  console.log('Email: admin@example.com')
  console.log('Password: admin123')
  console.log('--- BUSINESS ---')
  console.log('Email: demo@example.com')
  console.log('Password: password123')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
