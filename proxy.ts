import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasDashboardAccess } from "@/lib/access";

const ALLOWED_EXPIRED_VIEWS = new Set(["subscription", "invoice/list"]);

export async function proxy(request: NextRequest) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;

  if (!user?.id || user.role === "admin") {
    return NextResponse.next();
  }

  const view = request.nextUrl.searchParams.get("view");
  if (view && ALLOWED_EXPIRED_VIEWS.has(view)) {
    return NextResponse.next();
  }

  const business = await prisma.business.findFirst({
    where: { ownerId: user.id },
    select: { createdAt: true, botSettings: true },
  });

  if (!business) {
    return NextResponse.next();
  }

  const botSettings = business.botSettings as
    | { hasAccessTill?: string }
    | null;

  if (!hasDashboardAccess(botSettings, business.createdAt)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.searchParams.set("view", "subscription");
    url.searchParams.set("billing", "expired");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*"],
};
