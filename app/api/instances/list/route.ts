import { getApiUser } from '@/lib/apiAuth'
import { getAccessibleBusiness } from '@/lib/businessAccess'
import { NextRequest, NextResponse } from 'next/server'

function getInstanceName(instance: any) {
  return instance?.name || instance?.instance?.instanceName || instance?.instanceName || ''
}

export async function GET(request: NextRequest) {
  const user = await getApiUser(request)
  const userRole = user?.role
  const requestedName = request.nextUrl.searchParams.get('name')?.trim() || null

  if (!user) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    let allowedSlug: string | null = null

    if (userRole !== 'admin') {
      const userId = user.id
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const business = await getAccessibleBusiness(userId)

      allowedSlug = business?.slug || null
      if (requestedName && requestedName !== allowedSlug) {
        return NextResponse.json({ success: true, instances: [] })
      }
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
    const instances = Array.isArray(data) ? data : []
    const nameFilter = requestedName || allowedSlug
    const filteredInstances = nameFilter
      ? instances.filter((instance: any) => getInstanceName(instance) === nameFilter)
      : instances
    console.log(`Evolution API fetchInstances returned ${instances.length} instance(s), responding with ${filteredInstances.length}.`)

    return NextResponse.json({
      success: true,
      instances: filteredInstances
    })

  } catch (error: any) {
    console.error('Error fetching WhatsApp instances:', error)
    return NextResponse.json({ error: error.message || 'An error occurred during instances retrieval.' }, { status: 500 })
  }
}
