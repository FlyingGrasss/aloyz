import { appendInstagramResult, parseInstagramOAuthState } from "@/lib/instagramOAuthState";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

const TOKEN_URL = "https://api.instagram.com/oauth/access_token";
const PROFILE_URL = "https://graph.instagram.com/v22.0/me";
const LONG_LIVED_TOKEN_URL = "https://graph.instagram.com/access_token";

function getBaseUrl(request: NextRequest) {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    `${request.nextUrl.protocol}//${request.nextUrl.host}`
  ).replace(/\/$/, "");
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const parsedState = parseInstagramOAuthState(request.nextUrl.searchParams.get("state"));
  const dashboardUrl = new URL("/dashboard", request.url);
  dashboardUrl.searchParams.set("view", "messaging/instagram/setup");

  if (!code || !parsedState) {
    dashboardUrl.searchParams.set("instagram", "invalid-callback");
    return Response.redirect(dashboardUrl);
  }

  const resultUrl = (result: string) => parsedState.returnUrl
    ? appendInstagramResult(parsedState.returnUrl, result)
    : (() => { dashboardUrl.searchParams.set("instagram", result); return dashboardUrl; })();

  const clientId =
    process.env.INSTAGRAM_APP_ID ||
    process.env.INSTAGRAM_CLIENT_ID ||
    process.env.META_APP_ID;
  const clientSecret =
    process.env.INSTAGRAM_APP_SECRET ||
    process.env.INSTAGRAM_CLIENT_SECRET ||
    process.env.META_APP_SECRET;
  if (!clientId || !clientSecret) {
    dashboardUrl.searchParams.set("instagram", "missing-config");
    return Response.redirect(dashboardUrl);
  }

  try {
    const redirectUri = `${getBaseUrl(request)}/api/integrations/instagram/callback`;
    const tokenRes = await fetch(TOKEN_URL, {
      method: "POST",
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      throw new Error(tokenData.error_message || tokenData.error || "Token exchange failed");
    }

    let accessToken = tokenData.access_token as string;
    const longTokenRes = await fetch(
      `${LONG_LIVED_TOKEN_URL}?${new URLSearchParams({
        grant_type: "ig_exchange_token",
        client_secret: clientSecret,
        access_token: accessToken,
      }).toString()}`,
    );
    if (longTokenRes.ok) {
      const longTokenData = await longTokenRes.json();
      accessToken = longTokenData.access_token || accessToken;
    }
    const profileRes = await fetch(
      `${PROFILE_URL}?${new URLSearchParams({
        fields: "user_id,username,account_type,profile_picture_url",
        access_token: accessToken,
      }).toString()}`,
    );
    const profile = await profileRes.json();
    if (!profileRes.ok) {
      throw new Error(profile.error?.message || "Instagram profile lookup failed");
    }

    const existing = await prisma.business.findUnique({
      where: { id: parsedState.businessId },
      select: { botSettings: true },
    });

    await prisma.business.update({
      where: { id: parsedState.businessId },
      data: {
        instagram_page_id: String(profile.user_id || profile.id),
        instagram_access_token: accessToken,
        botSettings: {
          ...((existing?.botSettings as Record<string, unknown>) || {}),
          instagram: true,
          instagramConnected: true,
          instagramUsername: profile.username || "",
          instagramProfilePicture: profile.profile_picture_url || "",
        },
      },
    });

    return Response.redirect(resultUrl("connected"));
  } catch (error: any) {
    console.error("Instagram callback error:", error);
    return Response.redirect(resultUrl("failed"));
  }
}
