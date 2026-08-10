import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { getApiUser } from '@/lib/apiAuth'

export async function POST(request: Request): Promise<NextResponse> {
  const user = await getApiUser(request)
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const filename = searchParams.get('filename')

  if (!filename) {
    return NextResponse.json({ error: 'Filename is required' }, { status: 400 })
  }

  try {
    const blob = await put(filename, request.body!, {
      access: 'public',
    })

    return NextResponse.json(blob)
  } catch (error) {
    console.error('Upload Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
