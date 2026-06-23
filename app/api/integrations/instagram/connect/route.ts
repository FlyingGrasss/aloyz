import crypto from "crypto";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
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

function signState(value: string) {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "aloyz";
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

export async function GET(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return Response.redirect(new URL("/login", request.url));
  }

  const business = await prisma.business.findFirst({
    where: { ownerId: userId },
    select: { id: true },
  });
  if (!business) {
    return Response.redirect(new URL("/dashboard?instagram=missing-business", request.url));
  }

  const clientId =
    process.env.INSTAGRAM_APP_ID ||
    process.env.INSTAGRAM_CLIENT_ID ||
    process.env.META_APP_ID;
  if (!clientId) {
    return Response.redirect(new URL("/dashboard?instagram=missing-client-id", request.url));
  }

  const payload = `${userId}.${business.id}.${Date.now()}`;
  const state = `${payload}.${signState(payload)}`;
  const redirectUri = `${getBaseUrl(request)}/api/integrations/instagram/callback`;

  const url = new URL(INSTAGRAM_AUTHORIZE_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", SCOPES);
  url.searchParams.set("state", state);

  return Response.redirect(url);
}
