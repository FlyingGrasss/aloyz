import crypto from "crypto";
import { parseMetaSignedRequest } from "@/lib/metaSignedRequest";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

function getBaseUrl(request: NextRequest) {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    `${request.nextUrl.protocol}//${request.nextUrl.host}`
  ).replace(/\/$/, "");
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const signedRequest = String(form.get("signed_request") || "");
  const confirmationCode = `ig-del-${crypto.randomUUID()}`;

  try {
    const payload = parseMetaSignedRequest(signedRequest);
    if (payload.user_id) {
      await prisma.business.updateMany({
        where: { instagram_page_id: String(payload.user_id) },
        data: {
          instagram_page_id: null,
          instagram_access_token: null,
          botSettings: {
            instagram: false,
            instagramConnected: false,
            instagramUsername: "",
            instagramProfilePicture: "",
          },
        },
      });
    }

    return Response.json({
      url: `${getBaseUrl(request)}/privacy?deletion=${encodeURIComponent(confirmationCode)}`,
      confirmation_code: confirmationCode,
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
