import { prisma } from "@/lib/prisma";

const RESEND_API_URL = "https://api.resend.com/emails";
const ALOYZ_DOMAIN = "aloyz.co";

export function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function normalizeSender(input: string) {
  const trimmed = input.trim().toLowerCase();
  const localPart = trimmed.includes("@") ? trimmed.split("@")[0] : trimmed;
  return localPart.replace(/[^a-z0-9._+-]/g, "");
}

export function normalizeSenderName(input: string) {
  return input.trim().replace(/[<>]/g, "").slice(0, 80) || "Aloyz";
}

export function markdownTextToEmailHtml(input: string) {
  const links: string[] = [];
  const linkStyle = "color:#4f46e5;text-decoration:underline";
  const linkPlaceholder = (html: string) => {
    links.push(html);
    return `@@ALOYZ_LINK_${links.length - 1}@@`;
  };

  const escaped = escapeHtml(input)
    .replace(/\[([^\]\n]+)\]\((https?:\/\/[^)\s]+)\)/g, (_match, label: string, href: string) =>
      linkPlaceholder(`<a href="${href}" style="${linkStyle}">${label}</a>`)
    )
    .replace(/https?:\/\/[^\s<]+/g, (url) => {
      const cleanUrl = url.replace(/[.,;:!?]+$/, "");
      const trailing = url.slice(cleanUrl.length);
      return `${linkPlaceholder(`<a href="${cleanUrl}" style="${linkStyle}">${cleanUrl}</a>`)}${trailing}`;
    })
    .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
    .replace(/_([^_\n]+)_/g, "<em>$1</em>");

  const paragraphs = escaped
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p style="margin:0 0 16px">${paragraph.replace(/\n/g, "<br />")}</p>`)
    .join("");

  const html = links.reduce(
    (body, link, index) => body.replaceAll(`@@ALOYZ_LINK_${index}@@`, link),
    paragraphs,
  );

  return `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#111827">${html}</div>`;
}

export async function sendAloyzEmail({
  from = "hello",
  senderName = "Aloyz",
  to,
  subject,
  html,
  text,
  userId,
}: {
  from?: string;
  senderName?: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  userId?: string | null;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  const senderLocalPart = normalizeSender(from || "hello");
  const displayName = normalizeSenderName(senderName || "Aloyz");
  const fromAddress = `${senderLocalPart || "hello"}@${ALOYZ_DOMAIN}`;

  const sentEmail = await prisma.sentEmail.create({
    data: {
      senderName: displayName,
      sentFrom: fromAddress,
      sentTo: to,
      subject,
      body: text || null,
      bodyHtml: html,
      contentMode: "html",
      successful: false,
      type: "CUSTOM",
      userId,
    },
  });

  const resendRes = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${displayName} <${fromAddress}>`,
      to: [to],
      subject,
      html,
      ...(text ? { text } : {}),
    }),
  });

  const data = await resendRes.json().catch(() => ({}));
  if (!resendRes.ok) {
    await prisma.sentEmail.update({
      where: { id: sentEmail.id },
      data: {
        successful: false,
        errorMessage: data.message || "E-posta gönderilemedi.",
      },
    });
    throw new Error(data.message || "E-posta gönderilemedi.");
  }

  await prisma.sentEmail.update({
    where: { id: sentEmail.id },
    data: {
      successful: true,
      resendId: data.id || null,
      errorMessage: null,
    },
  });

  return data;
}
