const VM_INSTAGRAM_WEBHOOK_URL = 'http://34.138.241.250:3000/webhook/instagram'

async function forwardInstagramWebhook(request: Request) {
  const incomingUrl = new URL(request.url)
  const targetUrl = new URL(VM_INSTAGRAM_WEBHOOK_URL)
  targetUrl.search = incomingUrl.search

  const headers = new Headers(request.headers)
  headers.delete('host')
  headers.delete('connection')
  headers.delete('content-length')

  const method = request.method
  const hasBody = !['GET', 'HEAD'].includes(method)

  try {
    const upstream = await fetch(targetUrl, {
      method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      redirect: 'manual',
    })

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: upstream.headers,
    })
  } catch (error) {
    console.error('Instagram webhook forward error:', error)
    return Response.json({ error: 'Instagram webhook forwarding failed.' }, { status: 502 })
  }
}

export const GET = forwardInstagramWebhook
export const POST = forwardInstagramWebhook
export const PUT = forwardInstagramWebhook
export const PATCH = forwardInstagramWebhook
export const DELETE = forwardInstagramWebhook
export const HEAD = forwardInstagramWebhook
