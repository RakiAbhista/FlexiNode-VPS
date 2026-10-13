import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied: Admin only." }, { status: 403 });
    }

    const txs = await prisma.transaction.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        order: { select: { id: true, subdomain: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      transactions: txs.map((t) => ({
        id: t.id,
        userId: t.userId,
        userName: t.user.name,
        userEmail: t.user.email,
        type: t.type,
        amount: t.amount,
        method: t.method,
        status: t.status,
        orderId: t.orderId || undefined,
        subdomain: t.order?.subdomain || undefined,
        gatewayRef: t.gatewayRef || undefined,
        createdAt: t.createdAt.toISOString(),
      })),
    });
  } catch (error: any) {
    console.error("[API]", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal server." }, { status: 500 });
  }
}
