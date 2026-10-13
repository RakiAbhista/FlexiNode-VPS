import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied: Admin only." }, { status: 403 });
    }

    const orders = await prisma.order.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        plan: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      orders: orders.map((o) => ({
        id: o.id,
        userId: o.userId,
        userName: o.user.name,
        userEmail: o.user.email,
        planId: o.planId,
        planName: o.plan?.name,
        status: o.status,
        containerId: o.containerId || undefined,
        ipAddress: o.ipAddress || undefined,
        subdomain: o.subdomain || undefined,
        startedAt: o.startedAt?.toISOString(),
        expiresAt: o.expiresAt?.toISOString(),
        createdAt: o.createdAt.toISOString(),
      })),
    });
  } catch (error: any) {
    console.error("[API]", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal server." }, { status: 500 });
  }
}
