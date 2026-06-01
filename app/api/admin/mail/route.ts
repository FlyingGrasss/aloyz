import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

const RESEND_API_URL = 'https://api.resend.com/emails'
const ALOYZ_DOMAIN = 'aloyz.co'

function normalizeSender(input: string) {
  const trimmed = input.trim().toLowerCase()
  const localPart = trimmed.includes('@') ? trimmed.split('@')[0] : trimmed
  return localPart.replace(/[^a-z0-9._+-]/g, '')
}

function normalizeSenderName(input: string) {
  return input.trim().replace(/[<>]/g, '').slice(0, 80) || 'Aloyz'
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function markdownTextToEmailHtml(input: string) {
  const links: string[] = []
  const linkStyle = 'color:#4f46e5;text-decoration:underline'
  const linkPlaceholder = (html: string) => {
    links.push(html)
    return `@@ALOYZ_LINK_${links.length - 1}@@`
  }

  const escaped = escapeHtml(input)
    .replace(/\[([^\]\n]+)\]\((https?:\/\/[^)\s]+)\)/g, (_match, label: string, href: string) =>
      linkPlaceholder(`<a href="${href}" style="${linkStyle}">${label}</a>`)
    )
    .replace(/https?:\/\/[^\s<]+/g, (url) => {
      const cleanUrl = url.replace(/[.,;:!?]+$/, '')
      const trailing = url.slice(cleanUrl.length)
      return `${linkPlaceholder(`<a href="${cleanUrl}" style="${linkStyle}">${cleanUrl}</a>`)}${trailing}`
    })
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/_([^_\n]+)_/g, '<em>$1</em>')

  const paragraphs = escaped
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p style="margin:0 0 16px">${paragraph.replace(/\n/g, '<br />')}</p>`)
    .join('')

  const html = links.reduce(
    (body, link, index) => body.replaceAll(`@@ALOYZ_LINK_${index}@@`, link),
    paragraphs
  )

  return `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#111827">${html}</div>`
}

type AuthSession = {
  user?: {
    id?: string | null
    email?: string | null
  }
} | null

async function getExistingSessionUserId(session: AuthSession) {
  const userId = session?.user?.id
  const email = session?.user?.email

  if (!userId && !email) return undefined

  const user = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      })
    : null

  if (user) return user.id

  const userByEmail = email
    ? await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      })
    : null

  return userByEmail?.id
}

export async function POST(request: NextRequest) {
  const session = await auth()
  const userRole = (session?.user as any)?.role

  if (!session || userRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY is not configured.' }, { status: 500 })
  }

  try {
    const { from, senderName, to, subject, message, html, mode } = await request.json()
    const senderLocalPart = normalizeSender(from || 'hello')
    const displayName = normalizeSenderName(senderName || 'Aloyz')
    const recipient = String(to || '').trim()
    const text = String(message || '').trim()
    const htmlContent = String(html || '').trim()
    const contentMode = mode === 'html' ? 'html' : 'text'
    const emailSubject = String(subject || 'Aloyz').trim() || 'Aloyz'
    const renderedHtml = contentMode === 'html' ? htmlContent : markdownTextToEmailHtml(text)

    if (!senderLocalPart) {
      return NextResponse.json({ error: 'Gönderen adresi geçersiz.' }, { status: 400 })
    }
    if (!recipient || !recipient.includes('@')) {
      return NextResponse.json({ error: 'Geçerli bir alıcı e-postası girin.' }, { status: 400 })
    }
    if (contentMode === 'text' && !text) {
      return NextResponse.json({ error: 'Mesaj içeriği boş olamaz.' }, { status: 400 })
    }
    if (contentMode === 'html' && !htmlContent) {
      return NextResponse.json({ error: 'HTML içeriği boş olamaz.' }, { status: 400 })
    }

    const fromAddress = `${senderLocalPart}@${ALOYZ_DOMAIN}`
    const userId = await getExistingSessionUserId(session)
    const sentEmail = await prisma.sentEmail.create({
      data: {
        senderName: displayName,
        sentFrom: fromAddress,
        sentTo: recipient,
        subject: emailSubject,
        body: contentMode === 'text' ? text : null,
        bodyHtml: renderedHtml,
        contentMode,
        successful: false,
        type: 'CUSTOM',
        userId,
      },
    })

    const resendRes = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${displayName} <${fromAddress}>`,
        to: [recipient],
        subject: emailSubject,
        html: renderedHtml,
        ...(contentMode === 'text' ? { text } : {}),
      }),
    })

    const data = await resendRes.json().catch(() => ({}))

    if (!resendRes.ok) {
      console.error('Resend send error:', data)
      await prisma.sentEmail.update({
        where: { id: sentEmail.id },
        data: {
          successful: false,
          errorMessage: data.message || 'E-posta gönderilemedi.',
        },
      })
      return NextResponse.json({ error: data.message || 'E-posta gönderilemedi.' }, { status: resendRes.status })
    }

    await prisma.sentEmail.update({
      where: { id: sentEmail.id },
      data: {
        successful: true,
        resendId: data.id || null,
        errorMessage: null,
      },
    })

    return NextResponse.json({ success: true, id: data.id })
  } catch (error: any) {
    console.error('Admin mail send error:', error)
    return NextResponse.json({ error: error.message || 'E-posta gönderilirken hata oluştu.' }, { status: 500 })
  }
}

async function fetchReceivedEmailBody(emailId: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return null

  const res = await fetch(`https://api.resend.com/emails/receiving/${encodeURIComponent(emailId)}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  })

  if (!res.ok) {
    console.error('Resend received email fetch error:', await res.text())
    return null
  }

  return res.json()
}

export async function GET(request: NextRequest) {
  const session = await auth()
  const userRole = (session?.user as any)?.role

  if (!session || userRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const box = searchParams.get('box') || 'sent'
  const search = searchParams.get('search') || ''

  if (box === 'received') {
    const where = search
      ? {
          OR: [
            { from: { contains: search, mode: 'insensitive' as const } },
            { subject: { contains: search, mode: 'insensitive' as const } },
            { to: { has: search } },
          ],
        }
      : undefined

    const emails = await prisma.receivedEmail.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    const enrichedEmails = await Promise.all(
      emails.map(async (email) => {
        if (email.body || email.bodyHtml) return email

        try {
          const data = await fetchReceivedEmailBody(email.emailId)
          if (!data) return email

          const updated = await prisma.receivedEmail.update({
            where: { id: email.id },
            data: {
              body: data.text || null,
              bodyHtml: data.html || null,
              attachments: data.attachments || email.attachments,
            },
          })

          return updated
        } catch (error) {
          console.error(`Failed to enrich received email ${email.emailId}:`, error)
          return email
        }
      })
    )

    return NextResponse.json({ emails: enrichedEmails })
  }

  const where = search
    ? {
        OR: [
          { sentFrom: { contains: search, mode: 'insensitive' as const } },
          { sentTo: { contains: search, mode: 'insensitive' as const } },
          { subject: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : undefined

  const emails = await prisma.sentEmail.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return NextResponse.json({ emails })
}
