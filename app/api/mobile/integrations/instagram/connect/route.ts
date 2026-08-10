import { getApiUser } from "@/lib/apiAuth";
import { getAccessibleBusiness } from "@/lib/businessAccess";
import { createInstagramOAuthState } from "@/lib/instagramOAuthState";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

const INSTAGRAM_AUTHORIZE_URL = "https://www.instagram.com/oauth/authorize";
const SCOPES = ["instagram_business_basic", "instagram_business_manage_messages"].join(",");

function getBaseUrl(request: NextRequest) {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`).replace(/\/$/, "");
}

export async function GET(request: NextRequest) {
  const user = await getApiUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const business = await getAccessibleBusiness(user.id);
  if (!business) return Response.json({ error: "İşletme profili bulunamadı." }, { status: 404 });

  const returnUrl = request.nextUrl.searchParams.get("returnUrl") || "aloyz://instagram";
  const clientId = process.env.INSTAGRAM_APP_ID || process.env.INSTAGRAM_CLIENT_ID || process.env.META_APP_ID;
  if (!clientId) return Response.json({ error: "Instagram istemci kimliği yapılandırılmamış." }, { status: 503 });

  const state = createInstagramOAuthState({ userId: user.id, businessId: business.id, issuedAt: Date.now(), returnUrl });
  const redirectUri = `${getBaseUrl(request)}/api/integrations/instagram/callback`;
  const url = new URL(INSTAGRAM_AUTHORIZE_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", SCOPES);
  url.searchParams.set("state", state);
  return Response.json({ url: url.toString(), returnUrl });
}
