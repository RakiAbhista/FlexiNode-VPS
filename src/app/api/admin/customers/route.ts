import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied: Admin only." }, { status: 403 });
    }

    const customers = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { orders: true, transactions: true } },
      },
    });

    return NextResponse.json({
      success: true,
      customers: customers.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        role: c.role,
        balance: c.balance,
        suspended: c.suspended,
        githubHandle: c.githubHandle || undefined,
        totalOrders: c._count.orders,
        totalTransactions: c._count.transactions,
        createdAt: c.createdAt.toISOString(),
      })),
    });
  } catch (error: any) {
    console.error("[API]", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal server." }, { status: 500 });
  }
}
