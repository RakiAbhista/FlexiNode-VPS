import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { incus } from "@/lib/incus";
import { rebuildContainer } from "@/lib/provisioner";

const ALLOWED_ACTIONS = ["start", "stop", "restart", "rebuild"] as const;
type AllowedAction = typeof ALLOWED_ACTIONS[number];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const action = body.action as string;

    // --- Validasi action (whitelist) ---
    if (!ALLOWED_ACTIONS.includes(action as AllowedAction)) {
      return NextResponse.json(
        { error: "Action tidak valid. Gunakan: start, stop, restart, rebuild." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order || !order.containerId) {
      return NextResponse.json({ error: "Order atau container tidak ditemukan." }, { status: 404 });
    }

    if (order.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Blokir aksi 'start' atau 'rebuild' jika order sudah expired / dihapus
    if ((action === "start" || action === "rebuild") && order.status === OrderStatus.FAILED) {
      return NextResponse.json({ error: "VPS sudah dihapus permanen, tidak dapat dioperasikan." }, { status: 400 });
    }

    const isActuallyExpired = order.expiresAt ? order.expiresAt < new Date() : false;

    async function updateOrderServerState(
      serverStatus: "RUNNING" | "STOPPED",
      status: OrderStatus
    ) {
      try {
        await (prisma.order.update as any)({
          where: { id },
          data: {
            serverStatus,
            status,
          },
        });
      } catch (err: any) {
        if (
          err.name === "PrismaClientValidationError" ||
          err.message?.includes("serverStatus") ||
          err.message?.includes("Unknown argument")
        ) {
          console.warn("[API] Prisma Client cached old schema, falling back to raw SQL for serverStatus");
          await prisma.order.update({
            where: { id },
            data: { status },
          });
          await prisma.$executeRawUnsafe(
            `UPDATE "Order" SET "serverStatus" = $1 WHERE id = $2`,
            serverStatus,
            id
          );
        } else {
          throw err;
        }
      }
    }

    if (action === "stop") {
      await incus.stop(order.containerId);
      await updateOrderServerState(
        "STOPPED",
        isActuallyExpired ? OrderStatus.EXPIRED : OrderStatus.ACTIVE
      );
      return NextResponse.json({ success: true, message: "Server berhasil dimatikan (Stopped)." });
    } else if (action === "start") {
      if (isActuallyExpired) {
        return NextResponse.json(
          { error: "Masa sewa VPS sudah berakhir. Silakan perpanjang sewa terlebih dahulu." },
          { status: 400 }
        );
      }
      await incus.start(order.containerId);
      await updateOrderServerState("RUNNING", OrderStatus.ACTIVE);
      return NextResponse.json({ success: true, message: "Server berhasil dinyalakan (Running)." });
    } else if (action === "restart") {
      if (isActuallyExpired) {
        return NextResponse.json(
          { error: "Masa sewa VPS sudah berakhir. Silakan perpanjang sewa terlebih dahulu." },
          { status: 400 }
        );
      }
      await incus.restart(order.containerId);
      await updateOrderServerState("RUNNING", OrderStatus.ACTIVE);
      return NextResponse.json({ success: true, message: "Server berhasil di-restart." });
    } else if (action === "rebuild") {
      if (isActuallyExpired) {
        return NextResponse.json(
          { error: "Masa sewa VPS sudah berakhir. Perpanjang sewa sebelum melakukan install ulang OS." },
          { status: 400 }
        );
      }
      const packages = Array.isArray(body.packages) ? body.packages : undefined;
      const res = await rebuildContainer(order.id, packages);
      if (!res.success) {
        return NextResponse.json(
          { error: res.error || "Gagal melakukan install ulang OS container." },
          { status: 500 }
        );
      }
      return NextResponse.json({
        success: true,
        message: "Sistem Operasi berhasil diinstal ulang ke Ubuntu 22.04 LTS (bersih).",
        ip: res.ip,
      });
    }
  } catch (error: any) {
    console.error("[API]", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal server." }, { status: 500 });
  }
}
