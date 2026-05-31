import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function POST(request: Request) {
  try {
    // Only logged-in admin users can create new businesses / users
    const session = await auth()
    const userRole = (session?.user as any)?.role

    if (!session || userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Bu işlem sadece sistem yöneticileri tarafından gerçekleştirilebilir.' },
        { status: 403 }
      )
    }

    const { email, password, name, type, phone, address, website } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'E-posta, şifre ve isim/işletme adı zorunludur' }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Bu e-posta adresi zaten kullanımda' }, { status: 400 })
    }

    const passwordHash = await hash(password, 12)

    // Create the user and their associated business in a transaction!
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          name,
          password_hash: passwordHash,
          role: 'business'
        }
      })

      // Generate a unique admin-managed slug automatically
      const slugBase = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'business'
      const uniqueSlug = `${slugBase}-${user.id.slice(-6)}`

      const business = await tx.business.create({
        data: {
          ownerId: user.id,
          name: name,
          slug: uniqueSlug, // Set generated unique slug
          type: type || 'İşletme',
          phone: phone || '',
          address: address || '',
          website: website || '',
          welcome_message: '', // Optional welcome message
          hours: {}, // Empty hours object (no default hours)
          menu_or_services: '',
          faqs: [],
          is_active: false, // Default to false (WhatsApp inactive)
          test_mode: false
        }
      })

      return { user, business }
    })

    return NextResponse.json({ 
      user: { 
        id: result.user.id, 
        email: result.user.email, 
        name: result.user.name 
      },
      business: {
        id: result.business.id,
        slug: result.business.slug
      }
    }, { status: 201 })

  } catch (error: any) {
    console.error('Signup Error:', error)
    return NextResponse.json({ error: 'Sunucu hatası oluştu' }, { status: 500 })
  }
}
