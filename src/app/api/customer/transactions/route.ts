import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      include: { order: { include: { plan: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      transactions: transactions.map((t) => ({
        id: t.id,
        userId: t.userId,
        type: t.type,
        amount: t.amount,
        method: t.method,
        status: t.status,
        orderId: t.orderId || undefined,
        gatewayRef: t.gatewayRef || undefined,
        createdAt: t.createdAt.toISOString(),
        order: t.order
          ? {
              id: t.order.id,
              subdomain: t.order.subdomain,
              planName: t.order.plan?.name,
            }
          : undefined,
      })),
    });
  } catch (error: any) {
    console.error("[API]", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal server." }, { status: 500 });
  }
}
