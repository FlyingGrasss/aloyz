import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { runSalonappySync } from "@/lib/salonappy-sync";

export const maxDuration = 60;

function unauthorized() {
  return NextResponse.json(
    { code: "UNAUTHORIZED", message: "Bu işlem için yönetici yetkisi gerekli." },
    { status: 403 },
  );
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || (session.user as { role?: string } | undefined)?.role !== "admin") {
    return unauthorized();
  }

  const origin = request.headers.get("origin");
  const expectedOrigin = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (origin && expectedOrigin) {
    try {
      if (new URL(origin).host !== new URL(expectedOrigin).host) {
        return NextResponse.json(
          { code: "BAD_ORIGIN", message: "Geçersiz istek kaynağı." },
          { status: 403 },
        );
      }
    } catch {
      return NextResponse.json(
        { code: "BAD_ORIGIN", message: "Geçersiz istek kaynağı." },
        { status: 403 },
      );
    }
  }

  try {
    const summary = await runSalonappySync();
    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Senkron tamamlanamadı.";
    console.error("salonappy-sync failed:", message);
    const rateLimited = message.includes("istek limiti");
    return NextResponse.json(
      {
        code: rateLimited ? "RATE_LIMITED" : "SYNC_FAILED",
        message: rateLimited
          ? "Salonappy geçici olarak istekleri sınırlıyor. Lütfen biraz sonra tekrar deneyin."
          : "Senkron tamamlanamadı. Lütfen tekrar deneyin.",
      },
      { status: rateLimited ? 429 : 500 },
    );
  }
}
