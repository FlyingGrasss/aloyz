import { getApiPrincipal } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const principal = await getApiPrincipal(request);
  if (!principal?.mobileSessionToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return Response.json(
    { user: principal.user },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function DELETE(request: Request) {
  const principal = await getApiPrincipal(request);
  if (principal?.mobileSessionToken) {
    await prisma.session.deleteMany({
      where: { sessionToken: principal.mobileSessionToken },
    });
  }
  return new Response(null, { status: 204 });
}
