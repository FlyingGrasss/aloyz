import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'

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

// POST /api/admin — Allows admin to update calendarId, is_active, and slug for any business
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
    const { businessId, calendarId, is_active, slug } = await request.json()

    if (!businessId) {
      return NextResponse.json({ error: 'businessId is required' }, { status: 400 })
    }

    const updateData: Record<string, any> = {}
    if (calendarId !== undefined) {
      updateData.calendarId = calendarId
    }
    if (is_active !== undefined) {
      updateData.is_active = !!is_active
    }
    if (slug !== undefined) {
      updateData.slug = slug
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
