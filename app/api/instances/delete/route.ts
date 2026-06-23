import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(request: NextRequest) {
  const session = await auth()
  const userRole = (session?.user as any)?.role
  const userId = session?.user?.id

  if (!session) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    let slug = ''

    // 1. Try to get slug from query parameters
    const { searchParams } = new URL(request.url)
    slug = searchParams.get('slug') || ''

    // 2. Try to get slug from request body if not found in query params
    if (!slug) {
      const body = await request.json().catch(() => ({}))
      console.log('DELETE request received body:', JSON.stringify(body))
      slug = body.slug || ''
    }

    console.log('DELETE instance request for slug:', slug)

    if (!slug) {
      return NextResponse.json({ error: 'slug is required' }, { status: 400 })
    }

    if (userRole !== 'admin') {
      const ownedBusiness = await prisma.business.findFirst({
        where: { slug, ownerId: userId },
        select: { id: true },
      })

      if (!ownedBusiness) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const evolutionUrl = process.env.EVOLUTION_URL || 'http://localhost:8080'
    const evolutionApiKey = process.env.EVOLUTION_API_KEY || 'mysecretkey123'

    // Delete the instance from the Evolution API
    const deleteRes = await fetch(`${evolutionUrl}/instance/delete/${slug}`, {
      method: 'DELETE',
      headers: {
        'apikey': evolutionApiKey,
      },
    })

    if (!deleteRes.ok) {
      const errText = await deleteRes.text()
      console.error('Evolution API delete instance error response:', errText)
      // Note: If the instance is already deleted/not found on Evolution, we might still want to clean up DB, but let's report the error unless it's a 404
      if (deleteRes.status !== 404) {
        return NextResponse.json({ error: `Evolution delete instance failed: ${errText}` }, { status: deleteRes.status })
      }
    }

    // Set is_active to false and reset slug if needed (or keep slug so it's ready to recreate, but set is_active=false since connection is gone)
    try {
      await prisma.business.updateMany({
        where: { slug: slug },
        data: { is_active: false }
      })
    } catch (dbErr) {
      console.error('Failed to deactivate business in DB after instance deletion:', dbErr)
    }

    return NextResponse.json({
      success: true,
      message: `Instance "${slug}" has been successfully deleted.`
    })

  } catch (error: any) {
    console.error('Error deleting WhatsApp instance:', error)
    return NextResponse.json({ error: error.message || 'An error occurred during instance deletion.' }, { status: 500 })
  }
}
