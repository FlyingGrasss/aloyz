export function getContactDisplayName(conv: {
  channel?: string
  customerName?: string | null
  customerPhone?: string | null
  instagramUsername?: string | null
  customerJid?: string
}): string {
  if (conv.customerName?.trim()) return conv.customerName.trim()

  if (conv.channel === 'instagram') {
    if (conv.instagramUsername?.trim()) {
      const username = conv.instagramUsername.trim()
      return username.startsWith('@') ? username : `@${username}`
    }
  } else {
    if (conv.customerPhone?.trim()) return conv.customerPhone.trim()
  }

  if (conv.customerJid) return conv.customerJid.split('@')[0]
  return 'Bilinmeyen'
}

export function getContactSubtitle(conv: {
  channel?: string
  customerPhone?: string | null
  instagramUsername?: string | null
  customerJid?: string
}): string | null {
  if (conv.channel === 'instagram') {
    if (conv.instagramUsername?.trim()) {
      const username = conv.instagramUsername.trim()
      return username.startsWith('@') ? username : `@${username}`
    }
  } else if (conv.customerPhone?.trim()) {
    return conv.customerPhone.trim()
  }

  if (conv.customerJid) return conv.customerJid
  return null
}
