import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'

const PROFILE_FIELDS = [
  'name',
  'type',
  'phone',
  'email',
  'city',
  'district',
  'address',
  'website',
  'welcome_message',
  'hours',
  'menu_or_services',
  'faqs',
  'staff',
  'services',
  'customers',
  'checkouts',
  'promotions',
  'bookingSettings',
  'botSettings',
  'special_instructions',
] as const

function sanitizeProfilePayload(body: Record<string, unknown>) {
  const updateData: Record<string, unknown> = {}

  for (const field of PROFILE_FIELDS) {
    if (body[field] !== undefined) {
      updateData[field] = body[field]
    }
  }

  if (updateData.hours && typeof updateData.hours === 'string') {
    try {
      updateData.hours = JSON.parse(updateData.hours as string)
    } catch {
      updateData.hours = {}
    }
  }

  if (updateData.faqs && typeof updateData.faqs === 'string') {
    try {
      updateData.faqs = JSON.parse(updateData.faqs as string)
    } catch {
      updateData.faqs = []
    }
  }

  for (const field of ['staff', 'services', 'customers', 'checkouts'] as const) {
    if (updateData[field] && typeof updateData[field] === 'string') {
      try {
        updateData[field] = JSON.parse(updateData[field] as string)
      } catch {
        updateData[field] = []
      }
    }
  }

  for (const field of ['promotions', 'bookingSettings', 'botSettings'] as const) {
    if (updateData[field] && typeof updateData[field] === 'string') {
      try {
        updateData[field] = JSON.parse(updateData[field] as string)
      } catch {
        updateData[field] = {}
      }
    }
  }

  if (body.calendarId !== undefined) updateData.calendarId = body.calendarId
  if (body.is_active !== undefined) updateData.is_active = !!body.is_active
  if (body.test_mode !== undefined) updateData.test_mode = !!body.test_mode
  if (body.slug !== undefined) updateData.slug = body.slug
  if (body.instagram_page_id !== undefined) {
    updateData.instagram_page_id = body.instagram_page_id || null
  }
  if (body.instagram_access_token !== undefined) {
    updateData.instagram_access_token = body.instagram_access_token || null
  }

  return updateData
}

// GET /api/admin — Returns all users, businesses, conversations, and appointments
export async function GET() {
  const session = await auth()
  const userRole = (session?.user as any)?.role

  if (!session || userRole !== 'admin') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const businesses = await prisma.business.findMany({
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      conversations: {
        orderBy: {
          updatedAt: 'desc',
        },
      },
      appointments: {
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return NextResponse.json(businesses)
}

// POST /api/admin — Admin updates any business (admin fields + full profile)
export async function POST(request: NextRequest) {
  const session = await auth()
  const userRole = (session?.user as any)?.role

  if (!session || userRole !== 'admin') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await request.json()
    const { businessId } = body

    if (!businessId) {
      return NextResponse.json({ error: 'businessId is required' }, { status: 400 })
    }

    const updateData = sanitizeProfilePayload(body)

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const business = await prisma.business.update({
      where: { id: businessId },
      data: updateData,
    })

    return NextResponse.json(business)
  } catch (error: any) {
    console.error('Admin business update error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
