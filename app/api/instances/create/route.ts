import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { canManageBusiness } from '@/lib/businessAccess'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
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
    const { slug, businessId } = await request.json()

    if (!slug || !businessId) {
      return NextResponse.json({ error: 'slug and businessId are required' }, { status: 400 })
    }

    if (userRole !== 'admin') {
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const ownedBusiness = await canManageBusiness(userId, businessId)

      if (!ownedBusiness) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Generate a secure random token (uuid)
    const generatedToken = crypto.randomUUID()

    // 1. Update the Business row in PostgreSQL to assign this 'slug' using prisma client
    await prisma.business.update({
      where: { id: businessId },
      data: { slug },
    })

    const evolutionUrl = process.env.EVOLUTION_URL || 'http://localhost:8080'
    const evolutionApiKey = process.env.EVOLUTION_API_KEY || 'mysecretkey123'
    const whatsappBackendUrl = process.env.WHATSAPP_BACKEND_URL || 'http://localhost:3000/webhook'

    // 2. Make POST request to `${process.env.EVOLUTION_URL}/instance/create`
    const createRes = await fetch(`${evolutionUrl}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey,
      },
      body: JSON.stringify({
        instanceName: slug,
        token: generatedToken,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
      }),
    })

    if (!createRes.ok) {
      const errText = await createRes.text()
      console.error('Evolution API create instance error response:', errText)
      if (errText.includes('already in use')) {
        return NextResponse.json({
          success: true,
          alreadyExists: true,
          instance: { instanceName: slug },
          token: null,
        })
      }
      return NextResponse.json({ error: `Evolution instance creation failed: ${errText}` }, { status: createRes.status })
    }

    const createData = await createRes.json()

    // 3. Turn off history sync settings immediately
    try {
      const settingsRes = await fetch(`${evolutionUrl}/settings/set/${slug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionApiKey,
        },
        body: JSON.stringify({
          groupsIgnore: true,
          alwaysOnline: true,
          readMessages: true,
          readStatus: false,
          rejectCall: false,
          syncFullHistory: false
        }),
      })

      if (!settingsRes.ok) {
        const errText = await settingsRes.text()
        console.error('Evolution API settings update error response:', errText)
      }
    } catch (settingErr) {
      console.error('Failed to update Evolution API settings:', settingErr)
    }

    // 4. Set up the multi-tenant webhook route immediately
    try {
      const webhookRes = await fetch(`${evolutionUrl}/webhook/set/${slug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionApiKey,
        },
        body: JSON.stringify({
          webhook: {
            enabled: true,
            url: whatsappBackendUrl,
            byEvents: false,
            events: ["MESSAGES_UPSERT"],
          },
        }),
      })

      if (!webhookRes.ok) {
        const errText = await webhookRes.text()
        console.error('Evolution API webhook set error response:', errText)
      }
    } catch (webhookErr) {
      console.error('Failed to set Evolution API webhook:', webhookErr)
    }

    return NextResponse.json({
      success: true,
      instance: createData,
      token: generatedToken
    })

  } catch (error: any) {
    console.error('Error creating WhatsApp instance:', error)
    return NextResponse.json({ error: error.message || 'An error occurred during instance creation.' }, { status: 500 })
  }
}
