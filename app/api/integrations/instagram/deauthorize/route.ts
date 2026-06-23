import { parseMetaSignedRequest } from "@/lib/metaSignedRequest";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const signedRequest = String(form.get("signed_request") || "");

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
    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
