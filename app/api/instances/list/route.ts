import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

function getInstanceName(instance: any) {
  return instance?.name || instance?.instance?.instanceName || instance?.instanceName || ''
}

export async function GET(request: NextRequest) {
  const session = await auth()
  const userRole = (session?.user as any)?.role

  if (!session) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    let allowedSlug: string | null = null

    if (userRole !== 'admin') {
      const userId = session.user?.id
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const business = await prisma.business.findFirst({
        where: { ownerId: userId },
        select: { slug: true },
      })

      allowedSlug = business?.slug || null
    }

    const evolutionUrl = process.env.EVOLUTION_URL || 'http://localhost:8080'
    const evolutionApiKey = process.env.EVOLUTION_API_KEY || 'mysecretkey123'

    const listRes = await fetch(`${evolutionUrl}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'apikey': evolutionApiKey,
      },
    })

    if (!listRes.ok) {
      const errText = await listRes.text()
      console.error('Evolution API fetch instances error response:', errText)
      return NextResponse.json({ error: `Evolution fetch instances failed: ${errText}` }, { status: listRes.status })
    }

    const data = await listRes.json()
    console.log('Evolution API fetchInstances response:', JSON.stringify(data))
    const instances = Array.isArray(data) ? data : []

    return NextResponse.json({
      success: true,
      instances: allowedSlug
        ? instances.filter((instance: any) => getInstanceName(instance) === allowedSlug)
        : instances
    })

  } catch (error: any) {
    console.error('Error fetching WhatsApp instances:', error)
    return NextResponse.json({ error: error.message || 'An error occurred during instances retrieval.' }, { status: 500 })
  }
}
