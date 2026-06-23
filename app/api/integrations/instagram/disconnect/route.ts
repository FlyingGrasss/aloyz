import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const business = await prisma.business.findFirst({
    where: { ownerId: userId },
    select: { id: true, botSettings: true },
  });
  if (!business) {
    return Response.json({ error: "Business not found" }, { status: 404 });
  }

  await prisma.business.update({
    where: { id: business.id },
    data: {
      instagram_page_id: null,
      instagram_access_token: null,
      botSettings: {
        ...((business.botSettings as Record<string, unknown>) || {}),
        instagram: false,
        instagramConnected: false,
        instagramUsername: "",
        instagramProfilePicture: "",
      },
    },
  });

  return Response.json({ ok: true });
}
