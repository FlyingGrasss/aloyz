import { createHash } from "crypto";
import { issueMobileSession } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const MOBILE_AUTH_IDENTIFIER_PREFIX = "mobile-auth:";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const code = String(body.code || "").trim();
  if (!code) {
    return Response.json({ error: "Authorization code is required." }, { status: 400 });
  }

  const codeHash = createHash("sha256").update(code).digest("hex");
  const verification = await prisma.verificationToken.findUnique({
    where: { token: codeHash },
  });

  if (
    !verification ||
    !verification.identifier.startsWith(MOBILE_AUTH_IDENTIFIER_PREFIX) ||
    verification.expires <= new Date()
  ) {
    if (verification) {
      await prisma.verificationToken.deleteMany({ where: { token: codeHash } });
    }
    return Response.json({ error: "Authorization code is invalid or expired." }, { status: 401 });
  }

  const userId = verification.identifier.slice(MOBILE_AUTH_IDENTIFIER_PREFIX.length);
  const user = await prisma.$transaction(async (tx) => {
    const deleted = await tx.verificationToken.deleteMany({
      where: { token: codeHash, expires: { gt: new Date() } },
    });
    if (deleted.count !== 1) return null;

    const existingUser = await tx.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        approvalStatus: true,
      },
    });
    if (!existingUser) return null;

    return existingUser;
  });

  if (!user) {
    return Response.json({ error: "Authorization code has already been used." }, { status: 401 });
  }

  const { sessionToken, expires } = await issueMobileSession(user.id);
  return Response.json(
    { accessToken: sessionToken, expiresAt: expires.toISOString(), user },
    { headers: { "Cache-Control": "no-store" } },
  );
}
