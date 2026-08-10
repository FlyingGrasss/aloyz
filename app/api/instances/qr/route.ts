import { getApiUser } from '@/lib/apiAuth'
import { getAccessibleBusiness } from '@/lib/businessAccess'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const user = await getApiUser(request)
  const userRole = user?.role

  if (!user) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    if (!slug) {
      return NextResponse.json({ error: 'slug query parameter is required' }, { status: 400 })
    }

    if (userRole !== 'admin') {
      const userId = user.id
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const business = await getAccessibleBusiness(userId)

      if (!business || business.slug !== slug) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const evolutionUrl = process.env.EVOLUTION_URL || 'http://localhost:8080'
    const evolutionApiKey = process.env.EVOLUTION_API_KEY || 'mysecretkey123'

    const qrRes = await fetch(`${evolutionUrl}/instance/connect/${slug}`, {
      method: 'GET',
      headers: {
        'apikey': evolutionApiKey,
      },
    })

    if (!qrRes.ok) {
      const errText = await qrRes.text()
      console.error('Evolution API connect QR code error response:', errText)
      return NextResponse.json({ error: `Evolution connect QR code failed: ${errText}` }, { status: qrRes.status })
    }

    const data = await qrRes.json()

    // Safely extract the base64 string from the Evolution API response
    let qrBase64 = ''
    if (data.qrcode?.base64) {
      qrBase64 = data.qrcode.base64
    } else if (data.base64) {
      qrBase64 = data.base64
    } else if (typeof data === 'string' && data.startsWith('data:image')) {
      qrBase64 = data
    } else if (data.code) {
      qrBase64 = data.code
    } else {
      console.warn('Unknown QR code response structure from Evolution API:', data)
    }

    return NextResponse.json({
      success: true,
      qrBase64: qrBase64 || null,
      fullResponse: data
    })

  } catch (error: any) {
    console.error('Error fetching WhatsApp QR code:', error)
    return NextResponse.json({ error: error.message || 'An error occurred during QR retrieval.' }, { status: 500 })
  }
}
