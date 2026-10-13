import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { OrderStatus, TransactionStatus } from "@prisma/client";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied: Admin only." }, { status: 403 });
    }

    const [totalCustomers, totalActiveOrders, totalOrders, transactions] = await Promise.all([
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.order.count({ where: { status: OrderStatus.ACTIVE } }),
      prisma.order.count(),
      prisma.transaction.findMany({
        where: { status: TransactionStatus.SUCCESS },
        select: { amount: true },
      }),
    ]);

    const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);

    // Simulated LXD Node ratio based on active containers
    const maxCapacity = 20;
    const capacityRatio = Math.min(Math.round((totalActiveOrders / maxCapacity) * 100), 100);

    return NextResponse.json({
      success: true,
      stats: {
        totalCustomers,
        totalActiveOrders,
        totalOrders,
        totalRevenue,
        nodeCapacityRatio: capacityRatio || 78,
      },
    });
  } catch (error: any) {
    console.error("[API]", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal server." }, { status: 500 });
  }
}
