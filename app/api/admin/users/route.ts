import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
  const session = await auth();
  const userRole = (session?.user as any)?.role;

  if (!session || userRole !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, approvalStatus } = await request.json();
  const nextStatus = String(approvalStatus || "").toUpperCase();
  if (!userId || !["PENDING", "APPROVED", "REJECTED"].includes(nextStatus)) {
    return NextResponse.json({ error: "Invalid approval status." }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: String(userId) },
    data: { approvalStatus: nextStatus },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      approvalStatus: true,
    },
  });

  return NextResponse.json({ user });
}
