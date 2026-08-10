import { auth } from "@/auth";
import { getAccessibleBusiness } from "@/lib/businessAccess";
import { createInstagramOAuthState } from "@/lib/instagramOAuthState";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

const INSTAGRAM_AUTHORIZE_URL = "https://www.instagram.com/oauth/authorize";
const SCOPES = [
  "instagram_business_basic",
  "instagram_business_manage_messages",
].join(",");

function getBaseUrl(request: NextRequest) {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    `${request.nextUrl.protocol}//${request.nextUrl.host}`
  ).replace(/\/$/, "");
}

export async function GET(request: NextRequest) {
  const dashboardUrl = new URL("/dashboard", request.url);
  dashboardUrl.searchParams.set("view", "messaging/instagram/setup");

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return Response.redirect(new URL("/login", request.url));
  }

  const business = await getAccessibleBusiness(userId);
  if (!business) {
    dashboardUrl.searchParams.set("instagram", "missing-business");
    return Response.redirect(dashboardUrl);
  }

  const clientId =
    process.env.INSTAGRAM_APP_ID ||
    process.env.INSTAGRAM_CLIENT_ID ||
    process.env.META_APP_ID;
  if (!clientId) {
    dashboardUrl.searchParams.set("instagram", "missing-client-id");
    return Response.redirect(dashboardUrl);
  }

  const state = createInstagramOAuthState({ userId, businessId: business.id, issuedAt: Date.now() });
  const redirectUri = `${getBaseUrl(request)}/api/integrations/instagram/callback`;

  const url = new URL(INSTAGRAM_AUTHORIZE_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", SCOPES);
  url.searchParams.set("state", state);

  return Response.redirect(url);
}
