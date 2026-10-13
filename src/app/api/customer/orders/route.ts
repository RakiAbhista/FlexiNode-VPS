import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      orders: orders.map((o) => ({
        id: o.id,
        userId: o.userId,
        planId: o.planId,
        status: o.status,
        serverStatus: o.status === "FAILED" ? "STOPPED" : ((o as any).serverStatus || "RUNNING"),
        containerId: o.containerId || undefined,
        ipAddress: o.ipAddress || undefined,
        subdomain: o.subdomain || undefined,
        addon: o.addon,
        addonPrice: o.addonPrice,
        addonSuspended: o.addonSuspended,
        addonSuspendedAt: o.addonSuspendedAt?.toISOString(),
        setupPackages: o.setupPackages ? JSON.parse(o.setupPackages) : [],
        startedAt: o.startedAt?.toISOString(),
        expiresAt: o.expiresAt?.toISOString(),
        createdAt: o.createdAt.toISOString(),
        plan: o.plan
          ? {
              id: o.plan.id,
              name: o.plan.name,
              durationDays: o.plan.durationDays,
              ramMb: o.plan.ramMb,
              cpuAllowance: o.plan.cpuAllowance,
              storageGb: o.plan.storageGb,
              price: o.plan.price,
              tier: o.plan.tier,
            }
          : undefined,
      })),
    });
  } catch (error: any) {
    console.error("[API]", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal server." }, { status: 500 });
  }
}
