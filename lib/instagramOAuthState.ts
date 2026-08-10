import crypto from "crypto";

export type InstagramOAuthState = {
  userId: string;
  businessId: string;
  issuedAt: number;
  returnUrl?: string;
};

function sign(value: string) {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "aloyz";
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

export function createInstagramOAuthState(input: InstagramOAuthState) {
  const payload = Buffer.from(JSON.stringify(input), "utf8").toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function parseInstagramOAuthState(state: string | null): InstagramOAuthState | null {
  if (!state) return null;
  const [payload, signature, ...rest] = state.split(".");
  if (!payload || !signature || rest.length) return parseLegacyState(state);
  const expected = sign(payload);
  if (signature.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<InstagramOAuthState>;
    if (!parsed.userId || !parsed.businessId || !parsed.issuedAt) return null;
    if (Math.abs(Date.now() - parsed.issuedAt) > 30 * 60 * 1000) return null;
    if (parsed.returnUrl && !isAllowedMobileReturnUrl(parsed.returnUrl)) return null;
    return {
      userId: parsed.userId,
      businessId: parsed.businessId,
      issuedAt: parsed.issuedAt,
      ...(parsed.returnUrl ? { returnUrl: parsed.returnUrl } : {}),
    };
  } catch {
    return null;
  }
}

function parseLegacyState(state: string): InstagramOAuthState | null {
  const parts = state.split(".");
  if (parts.length !== 4) return null;
  const payload = parts.slice(0, 3).join(".");
  const signature = parts[3];
  if (!signature) return null;
  const expected = sign(payload);
  if (signature.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  const [userId, businessId, timestamp] = parts;
  if (!userId || !businessId || !timestamp) return null;
  const issuedAt = Number(timestamp);
  if (!Number.isFinite(issuedAt)) return null;
  return { userId, businessId, issuedAt };
}

function isAllowedMobileReturnUrl(value: string) {
  try {
    const url = new URL(value);
    return ["aloyz:", "exp:", "exps:"].includes(url.protocol);
  } catch {
    return false;
  }
}

export function appendInstagramResult(returnUrl: string, result: string) {
  const url = new URL(returnUrl);
  url.searchParams.set("instagram", result);
  return url;
}
