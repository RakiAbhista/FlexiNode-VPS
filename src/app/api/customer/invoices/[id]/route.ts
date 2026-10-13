import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Search by transaction ID or order ID
    const tx = await prisma.transaction.findFirst({
      where: { OR: [{ id }, { orderId: id }] },
      include: {
        user: true,
        order: { include: { plan: true } },
      },
    });

    if (!tx) {
      return NextResponse.json({ error: "Invoice tidak ditemukan." }, { status: 404 });
    }

    if (tx.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      invoice: {
        id: tx.id,
        invoiceNumber: `INV-${tx.id.replace(/[^a-zA-Z0-9]/g, "").substring(0, 8).toUpperCase()}`,
        type: tx.type,
        amount: tx.amount,
        method: tx.method,
        status: tx.status,
        createdAt: tx.createdAt.toISOString(),
        gatewayRef: tx.gatewayRef,
        user: {
          name: tx.user.name,
          email: tx.user.email,
        },
        order: tx.order
          ? {
              id: tx.order.id,
              subdomain: tx.order.subdomain,
              planName: tx.order.plan?.name,
              planDuration: tx.order.plan?.durationDays,
              planRamMb: tx.order.plan?.ramMb,
              planCpu: tx.order.plan?.cpuAllowance,
              planStorageGb: tx.order.plan?.storageGb,
            }
          : undefined,
      },
    });
  } catch (error: any) {
    console.error("[API]", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal server." }, { status: 500 });
  }
}
