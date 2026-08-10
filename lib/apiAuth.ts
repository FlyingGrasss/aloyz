import { auth } from "@/auth";
import { randomBytes } from "crypto";
import { getSessionUser } from "@/lib/businessAccess";
import { prisma } from "@/lib/prisma";

const MOBILE_SESSION_PREFIX = "mobile_";

export type ApiUser = NonNullable<Awaited<ReturnType<typeof getSessionUser>>>;

export type ApiPrincipal = {
  user: ApiUser;
  mobileSessionToken: string | null;
};

function getBearerToken(request?: Request) {
  const authorization = request?.headers.get("authorization")?.trim() || "";
  if (!authorization.toLowerCase().startsWith("bearer ")) return null;
  const token = authorization.slice(7).trim();
  return token.startsWith(MOBILE_SESSION_PREFIX) ? token : null;
}

export async function getApiPrincipal(request?: Request): Promise<ApiPrincipal | null> {
  const mobileSessionToken = getBearerToken(request);

  if (mobileSessionToken) {
    const session = await prisma.session.findUnique({
      where: { sessionToken: mobileSessionToken },
      select: {
        expires: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            role: true,
            approvalStatus: true,
          },
        },
      },
    });

    if (!session) return null;
    if (session.expires <= new Date()) {
      await prisma.session.deleteMany({ where: { sessionToken: mobileSessionToken } });
      return null;
    }

    return { user: session.user, mobileSessionToken };
  }

  const session = await auth();
  const sessionUser = session?.user as
    | { id?: string; email?: string | null }
    | undefined;
  const user = await getSessionUser(sessionUser?.id, sessionUser?.email);
  return user ? { user, mobileSessionToken: null } : null;
}

export async function getApiUser(request?: Request) {
  return (await getApiPrincipal(request))?.user ?? null;
}

export function isMobileSessionToken(value: string) {
  return value.startsWith(MOBILE_SESSION_PREFIX);
}

export function createMobileSessionToken(randomValue: string) {
  return `${MOBILE_SESSION_PREFIX}${randomValue}`;
}

export async function issueMobileSession(userId: string) {
  const sessionToken = createMobileSessionToken(randomBytes(48).toString("base64url"));
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await prisma.$transaction([
    prisma.session.deleteMany({ where: { userId, expires: { lt: new Date() } } }),
    prisma.session.create({ data: { sessionToken, userId, expires } }),
  ]);
  return { sessionToken, expires };
}
