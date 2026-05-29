import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const session = await auth()
  const userRole = (session?.user as any)?.role

  if (!session || userRole !== 'admin') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
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

    return NextResponse.json({
      success: true,
      instances: data
    })

  } catch (error: any) {
    console.error('Error fetching WhatsApp instances:', error)
    return NextResponse.json({ error: error.message || 'An error occurred during instances retrieval.' }, { status: 500 })
  }
}
