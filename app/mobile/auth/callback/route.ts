import { createHash, randomBytes } from "crypto";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const CODE_LIFETIME_MS = 5 * 60 * 1000;
const MOBILE_AUTH_IDENTIFIER_PREFIX = "mobile-auth:";

function isAllowedRedirect(value: string) {
  try {
    const url = new URL(value);
    const scheme = url.protocol.replace(":", "").toLowerCase();
    // Expo Go uses an `exp://` redirect while development builds use `aloyz://`.
    // Keep the scheme allow-list explicit, but do not gate Expo Go on NODE_ENV:
    // Vercel correctly runs this route in production even when the client is Expo Go.
    const configured = (process.env.MOBILE_AUTH_REDIRECT_SCHEMES || "aloyz,exp")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);

    return configured.includes(scheme);
  } catch {
    return false;
  }
}

function redirectWithError(redirectUri: string, error: string) {
  const destination = new URL(redirectUri);
  destination.searchParams.set("error", error);
  return NextResponse.redirect(destination);
}

export async function GET(request: NextRequest) {
  const redirectUri = request.nextUrl.searchParams.get("redirectUri") || "";
  if (!isAllowedRedirect(redirectUri)) {
    return NextResponse.json({ error: "Invalid mobile redirect URI." }, { status: 400 });
  }

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return redirectWithError(redirectUri, "authentication_required");

  const rawCode = randomBytes(32).toString("base64url");
  const codeHash = createHash("sha256").update(rawCode).digest("hex");
  const identifier = `${MOBILE_AUTH_IDENTIFIER_PREFIX}${userId}`;
  const expires = new Date(Date.now() + CODE_LIFETIME_MS);

  await prisma.$transaction([
    prisma.verificationToken.deleteMany({
      where: { identifier, expires: { lt: new Date() } },
    }),
    prisma.verificationToken.create({
      data: { identifier, token: codeHash, expires },
    }),
  ]);

  const destination = new URL(redirectUri);
  destination.searchParams.set("code", rawCode);
  return NextResponse.redirect(destination);
}
