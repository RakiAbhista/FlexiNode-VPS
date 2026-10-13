import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { incus } from "@/lib/incus";
import { subdomain } from "@/lib/subdomain";

import { getSessionUser } from "@/lib/session";

// Proteksi: bisa dipanggil via secret header (x-cron-secret), query param ?secret=..., atau session ADMIN
const CRON_SECRET = process.env.CRON_SECRET || "rupacloud-cron-secret";

export async function GET(request: Request) {
  return handleLifecycle(request);
}

export async function POST(request: Request) {
  return handleLifecycle(request);
}

async function handleLifecycle(request: Request) {
  const url = new URL(request.url);
  const secretHeader = request.headers.get("x-cron-secret");
  const secretQuery = url.searchParams.get("secret");
  const providedSecret = secretHeader || secretQuery;

  let isAuthorized = providedSecret === CRON_SECRET;
  if (!isAuthorized) {
    const user = await getSessionUser();
    if (user && user.role === "ADMIN") {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const action = url.searchParams.get("action");
  const targetOrderId = url.searchParams.get("orderId");

  if (action === "expire" && targetOrderId) {
    // Set expiresAt ke 10 menit lalu agar langsung diproses sebagai EXPIRED
    await prisma.order.update({
      where: { id: targetOrderId },
      data: { expiresAt: new Date(Date.now() - 10 * 60 * 1000) },
    });
  } else if (action === "delete" && targetOrderId) {
    // Set expiresAt ke 8 hari lalu dan status EXPIRED agar langsung diproses sebagai DELETED (>7 hari)
    await prisma.order.update({
      where: { id: targetOrderId },
      data: {
        expiresAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        status: OrderStatus.EXPIRED,
      },
    });
  }

  const now = new Date();
  const suspendDeadline = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 hari lalu

  const results = { expired: 0, deleted: 0, markedExpiringSoon: 0, errors: [] as string[] };

  async function safeUpdateOrder(
    id: string,
    data: {
      status?: OrderStatus;
      serverStatus?: "RUNNING" | "STOPPED";
      containerId?: string | null;
    }
  ) {
    try {
      await (prisma.order.update as any)({
        where: { id },
        data,
      });
    } catch (err: any) {
      if (
        err.name === "PrismaClientValidationError" ||
        err.message?.includes("serverStatus") ||
        err.message?.includes("Unknown argument")
      ) {
        const { serverStatus, ...rest } = data;
        await prisma.order.update({
          where: { id },
          data: rest,
        });
        if (serverStatus) {
          await prisma.$executeRawUnsafe(
            `UPDATE "Order" SET "serverStatus" = $1 WHERE id = $2`,
            serverStatus,
            id
          );
        }
      } else {
        throw err;
      }
    }
  }

  // ── 1. ACTIVE orders yang sudah lewat expiresAt → SUSPEND (stop container) ──
  const toExpire = await prisma.order.findMany({
    where: {
      status: { in: [OrderStatus.ACTIVE, OrderStatus.EXPIRING_SOON] },
      expiresAt: { lt: now },
      containerId: { not: null },
    },
  });

  for (const order of toExpire) {
    try {
      await incus.stop(order.containerId!);
      await safeUpdateOrder(order.id, {
        status: OrderStatus.EXPIRED,
        serverStatus: "STOPPED",
      });
      results.expired++;
    } catch (e: any) {
      results.errors.push(`Expire ${order.id}: ${e.message}`);
    }
  }

  // ── 2. EXPIRED orders yang sudah 7 hari → HAPUS PERMANEN ──
  const toDelete = await prisma.order.findMany({
    where: {
      status: OrderStatus.EXPIRED,
      expiresAt: { lt: suspendDeadline },
      containerId: { not: null },
    },
  });

  for (const order of toDelete) {
    try {
      await incus.delete(order.containerId!);

      // Bersihkan subdomain mock jika ada
      if (order.addon) {
        await subdomain.deprovision(order.containerId!);
      }

      await safeUpdateOrder(order.id, {
        status: OrderStatus.FAILED, // Re-use FAILED sebagai "DELETED"
        serverStatus: "STOPPED",
        containerId: null,
      });
      results.deleted++;
    } catch (e: any) {
      results.errors.push(`Delete ${order.id}: ${e.message}`);
    }
  }

  // ── 3. ACTIVE orders yang akan expired dalam 24 jam → tandai EXPIRING_SOON ──
  const soonDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const { count } = await prisma.order.updateMany({
    where: {
      status: OrderStatus.ACTIVE,
      expiresAt: { lte: soonDeadline, gt: now },
    },
    data: { status: OrderStatus.EXPIRING_SOON },
  });
  results.markedExpiringSoon = count;

  // ── 4. SUSPENDED ADDONS yang sudah melewati Grace Period 24 Jam → HAPUS ADDON PERMANEN ──
  const addonGraceDeadline = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const addonsToClean = await prisma.order.findMany({
    where: {
      addon: true,
      addonSuspended: true,
      addonSuspendedAt: { lt: addonGraceDeadline },
      containerId: { not: null },
    },
  });

  let addonsTerminated = 0;
  for (const order of addonsToClean) {
    try {
      if (order.containerId) {
        await subdomain.deprovision(order.containerId);
        try {
          await incus.exec(
            order.containerId,
            "rm -f /root/.ssh/authorized_keys /root/.ssh/authorized_keys.suspended"
          );
        } catch {
          // container might be stopped
        }
      }
      await prisma.order.update({
        where: { id: order.id },
        data: {
          addon: false,
          addonSuspended: false,
          addonSuspendedAt: null,
          addonPrice: 0,
          subdomain: null,
        },
      });
      addonsTerminated++;
    } catch (e: any) {
      results.errors.push(`Addon deprovision ${order.id}: ${e.message}`);
    }
  }

  // ── 4. Pruning telemetri container lama (>48 jam) agar database tidak membengkak ──
  try {
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    await (prisma as any).containerMetric?.deleteMany({
      where: { createdAt: { lt: twoDaysAgo } },
    });
  } catch (err) {
    console.warn("[Cron] Pruning metric error:", err);
  }

  const allOrders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    success: true,
    currentTime: now.toISOString(),
    results: { ...results, addonsTerminated },
    orders: allOrders.map((o) => {
      const remainingMs = o.expiresAt ? o.expiresAt.getTime() - now.getTime() : 0;
      const hours = (remainingMs / (1000 * 60 * 60)).toFixed(1);
      return {
        id: o.id,
        status: o.status,
        serverStatus: o.serverStatus,
        containerId: o.containerId,
        expiresAt: o.expiresAt?.toISOString(),
        timeRemaining: `${hours} jam`,
      };
    }),
  });
}
