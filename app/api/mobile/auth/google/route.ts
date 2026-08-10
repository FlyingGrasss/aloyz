import { issueMobileSession } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type GoogleTokenInfo = {
  sub?: string;
  email?: string;
  email_verified?: string;
  name?: string;
  picture?: string;
  aud?: string;
  iss?: string;
};

async function verifyGoogleIdToken(idToken: string) {
  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
    { headers: { Accept: "application/json" }, cache: "no-store" },
  );
  if (!response.ok) return null;

  const token = (await response.json().catch(() => null)) as GoogleTokenInfo | null;
  const expectedAudience = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_WEB_CLIENT_ID;
  if (
    !token?.sub ||
    !token.email ||
    token.email_verified !== "true" ||
    !expectedAudience ||
    token.aud !== expectedAudience ||
    (token.iss !== "accounts.google.com" && token.iss !== "https://accounts.google.com")
  ) {
    return null;
  }
  return token;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const idToken = String(body.idToken || "").trim();
  if (!idToken) return Response.json({ error: "Google kimlik belirteci gerekli." }, { status: 400 });

  const token = await verifyGoogleIdToken(idToken);
  if (!token) return Response.json({ error: "Google oturumu doğrulanamadı." }, { status: 401 });

  const user = await prisma.$transaction(async (tx) => {
    const linkedAccount = await tx.account.findUnique({
      where: { provider_providerAccountId: { provider: "google", providerAccountId: token.sub! } },
      select: { user: { select: { id: true, email: true, name: true, image: true, role: true, approvalStatus: true } } },
    });
    if (linkedAccount) return linkedAccount.user;

    const existingUser = await tx.user.findUnique({ where: { email: token.email! } });
    const accountUser = existingUser || await tx.user.create({
      data: {
        email: token.email!,
        name: token.name || null,
        image: token.picture || null,
        role: "business",
        approvalStatus: "PENDING",
      },
    });

    await tx.account.create({
      data: {
        userId: accountUser.id,
        type: "oidc",
        provider: "google",
        providerAccountId: token.sub!,
        id_token: idToken,
      },
    });

    return {
      id: accountUser.id,
      email: accountUser.email,
      name: accountUser.name,
      image: accountUser.image,
      role: accountUser.role,
      approvalStatus: accountUser.approvalStatus,
    };
  });

  const { sessionToken, expires } = await issueMobileSession(user.id);
  return Response.json(
    { accessToken: sessionToken, expiresAt: expires.toISOString(), user },
    { headers: { "Cache-Control": "no-store" } },
  );
}
