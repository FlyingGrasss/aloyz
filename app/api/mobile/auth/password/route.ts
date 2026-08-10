import { issueMobileSession } from "@/lib/apiAuth";
import { authenticatePassword } from "@/lib/passwordAuth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const user = await authenticatePassword(
    String(body.email || ""),
    String(body.password || ""),
  );

  if (!user) {
    return Response.json(
      { error: "E-posta veya şifre hatalı." },
      { status: 401 },
    );
  }

  const { sessionToken, expires } = await issueMobileSession(user.id);
  return Response.json(
    { accessToken: sessionToken, expiresAt: expires.toISOString(), user },
    { headers: { "Cache-Control": "no-store" } },
  );
}
