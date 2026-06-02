import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { NextRequest } from 'next/server'
import { compileSystemPrompt } from '@/lib/promptCompiler'

// GET /api/business — get business by owner session or public slug/id
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  const id = searchParams.get('id')

  let business = null

  if (slug || id) {
    business = await prisma.business.findFirst({
      where: slug ? { slug } : { id: id! },
      include: {
        appointments: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })
  } else {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    business = await prisma.business.findFirst({
      where: { ownerId: userId },
      include: {
        conversations: true,
        appointments: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })
  }

  if (!business) {
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Compile system prompt using dynamic compiler
  const compiledPrompt = compileSystemPrompt(
    business as any,
    { timeStr: new Date().toLocaleTimeString('tr-TR') + ' ' + new Date().toLocaleDateString('tr-TR'), roadmap: 'Müşterinin takvim müsaitliği doğrulanıyor...' },
    '+905321234567'
  )

  return Response.json({
    ...business,
    compiledPrompt
  })
}

// POST /api/business — create or update business
export async function POST(request: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  const userRole = (session?.user as any)?.role

  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const body = await request.json()

  // Sanitize the payload
  const {
    id: _id,
    ownerId: _ownerId,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    owner: _owner,
    conversations: _conversations,
    appointments: _appointments,
    compiledPrompt: _compiledPrompt,
    // instagram fields are admin-only, always strip from business-owner POSTs
    instagram_page_id: _igId,
    instagram_access_token: _igToken,
    ...rest
  } = body

  const payload: Record<string, unknown> = {
    ...rest,
    ownerId: userId,
  }

  // Ensure hours is a proper JSON object
  if (payload.hours && typeof payload.hours === 'string') {
    try {
      payload.hours = JSON.parse(payload.hours as string)
    } catch {
      payload.hours = {}
    }
  }

  // Ensure faqs is a proper JSON array
  if (payload.faqs && typeof payload.faqs === 'string') {
    try {
      payload.faqs = JSON.parse(payload.faqs as string)
    } catch {
      payload.faqs = []
    }
  }

  if (!payload.faqs) {
    payload.faqs = []
  }

  // Check if user already has a business
  const existing = await prisma.business.findFirst({
    where: { ownerId: userId },
    select: { id: true },
  })

  if (existing) {
    try {
      const business = await prisma.business.update({
        where: { id: existing.id },
        data: payload,
      })
      return Response.json(business)
    } catch (error: any) {
      console.error('Business update error:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  } else {
    try {
      const business = await prisma.business.create({
        data: payload as any,
      })
      return Response.json(business, { status: 201 })
    } catch (error: any) {
      console.error('Business create error:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }
}

// PATCH /api/business — quick-save calendarId, is_active, and test_mode for business owner
export async function PATCH(request: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await request.json()

    const existing = await prisma.business.findFirst({
      where: { ownerId: userId },
      select: { id: true },
    })

    if (!existing) {
      return new Response(JSON.stringify({ error: 'Business profile not found.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const updateData: Record<string, unknown> = {}
    if (body.calendarId !== undefined) {
      updateData.calendarId = body.calendarId
    }
    if (body.is_active !== undefined) {
      updateData.is_active = !!body.is_active
    }
    if (body.test_mode !== undefined) {
      updateData.test_mode = !!body.test_mode
    }

    const updated = await prisma.business.update({
      where: { id: existing.id },
      data: updateData,
    })

    return Response.json(updated)
  } catch (error: any) {
    console.error('Business PATCH error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
