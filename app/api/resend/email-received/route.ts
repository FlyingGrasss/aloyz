import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'

type ResendAttachment = {
  id?: string
  filename?: string
  content_type?: string
  content_disposition?: string | null
  content_id?: string | null
}

function getSvixHeader(request: NextRequest, name: string) {
  return request.headers.get(name) || request.headers.get(name.replace('svix-', 'webhook-'))
}

function verifyResendWebhook(payload: string, request: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret) {
    throw new Error('RESEND_WEBHOOK_SECRET is not configured.')
  }

  const id = getSvixHeader(request, 'svix-id')
  const timestamp = getSvixHeader(request, 'svix-timestamp')
  const signatureHeader = getSvixHeader(request, 'svix-signature')

  if (!id || !timestamp || !signatureHeader) {
    throw new Error('Missing Resend webhook signature headers.')
  }

  const timestampMs = Number(timestamp) * 1000
  if (!Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > 5 * 60 * 1000) {
    throw new Error('Resend webhook timestamp is outside tolerance.')
  }

  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ''), 'base64')
  const signedContent = `${id}.${timestamp}.${payload}`
  const expected = createHmac('sha256', secretBytes).update(signedContent).digest()
  const signatures = signatureHeader.split(' ')

  const isValid = signatures.some((signature) => {
    const [, value] = signature.split(',')
    if (!value) return false
    const received = Buffer.from(value, 'base64')
    return received.length === expected.length && timingSafeEqual(received, expected)
  })

  if (!isValid) {
    throw new Error('Invalid Resend webhook signature.')
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text()
    verifyResendWebhook(payload, request)
    const event = JSON.parse(payload)

    if (event.type !== 'email.received') {
      return NextResponse.json({ ok: true })
    }

    const data = event.data || {}
    const emailId = String(data.email_id || '')

    if (!emailId) {
      return NextResponse.json({ error: 'Missing email_id.' }, { status: 400 })
    }

    const attachments = Array.isArray(data.attachments)
      ? data.attachments.map((attachment: ResendAttachment) => ({
          id: attachment.id || '',
          filename: attachment.filename || '',
          contentType: attachment.content_type || '',
          contentDisposition: attachment.content_disposition || null,
          contentId: attachment.content_id || null,
        }))
      : []

    const email = await prisma.receivedEmail.upsert({
      where: { emailId },
      create: {
        emailId,
        from: String(data.from || ''),
        to: Array.isArray(data.to) ? data.to : [],
        subject: String(data.subject || ''),
        body: null,
        bodyHtml: null,
        messageId: data.message_id || null,
        attachments: attachments.length > 0 ? attachments : Prisma.DbNull,
        rawEvent: event,
      },
      update: {
        from: String(data.from || ''),
        to: Array.isArray(data.to) ? data.to : [],
        subject: String(data.subject || ''),
        messageId: data.message_id || null,
        attachments: attachments.length > 0 ? attachments : Prisma.DbNull,
        rawEvent: event,
      },
    })

    return NextResponse.json({ success: true, emailId: email.id })
  } catch (error) {
    console.error('Resend received email webhook error:', error)
    return NextResponse.json({ error: 'Dahili Sunucu Hatası' }, { status: 500 })
  }
}
