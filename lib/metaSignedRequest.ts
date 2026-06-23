import crypto from "crypto";

function base64UrlDecode(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );
  return Buffer.from(padded, "base64");
}

export function parseMetaSignedRequest(signedRequest: string) {
  const [encodedSignature, encodedPayload] = signedRequest.split(".");
  if (!encodedSignature || !encodedPayload) {
    throw new Error("Invalid signed request");
  }

  const secret =
    process.env.INSTAGRAM_APP_SECRET ||
    process.env.INSTAGRAM_CLIENT_SECRET ||
    process.env.META_APP_SECRET;
  if (!secret) {
    throw new Error("Meta app secret is not configured");
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(encodedPayload)
    .digest();
  const actual = base64UrlDecode(encodedSignature);

  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
    throw new Error("Invalid signed request signature");
  }

  return JSON.parse(base64UrlDecode(encodedPayload).toString("utf8")) as {
    user_id?: string;
    issued_at?: number;
    algorithm?: string;
  };
}
