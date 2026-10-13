import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { incus } from "@/lib/incus";

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
    const order = await prisma.order.findUnique({ where: { id }, include: { plan: true } });
    if (!order) {
      return NextResponse.json({ error: "Order tidak ditemukan." }, { status: 404 });
    }

    if (order.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Jika order dalam keadaan STOPPED, EXPIRED, FAILED, atau tanpa container
    if (
      order.serverStatus === "STOPPED" ||
      order.status === "EXPIRED" ||
      order.status === "FAILED" ||
      !order.containerId
    ) {
      if (order.containerId && order.serverStatus === "STOPPED") {
        try {
          await incus.stop(order.containerId);
        } catch {
          // ignore
        }
      }

      const history = await prisma.containerMetric.findMany({
        where: { orderId: order.id },
        orderBy: { createdAt: "desc" },
        take: 20,
      });
      history.reverse();

      return NextResponse.json({
        success: true,
        stats: {
          online: false,
          time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          cpu: 0,
          ramPercent: 0,
          ramMb: 0,
          ramTotalMb: order.plan?.ramMb || 768,
          diskGb: 0,
          diskTotalGb: order.plan?.storageGb || 5,
          networkRxMb: 0,
          networkTxMb: 0,
          uptime:
            order.status === "FAILED"
              ? "Server Dihapus Permanen"
              : "Server Berhenti (Stopped)",
        },
        history: history.map((m) => ({
          time: new Date(m.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          cpu: m.cpu,
          ram: m.ramPercent,
          ramMb: m.ramMb,
          diskGb: m.diskGb,
        })),
      });
    }

    const stats = await incus.stats(order.containerId);

    // Sinkronisasi batas RAM & Storage sesuai plan
    if (order.plan?.ramMb) {
      stats.ramTotalMb = order.plan.ramMb;
    }
    if (order.plan?.storageGb) {
      stats.diskTotalGb = order.plan.storageGb;
    }

    if (stats.ramTotalMb > 0) {
      stats.ramPercent = Math.min(100, Math.max(1, Math.round((stats.ramMb / stats.ramTotalMb) * 100)));
    }

    // SIMPAN rekaman metrik riil ke database (hanya jika online & throttle minimal 30 detik)
    if (stats.online) {
      try {
        const latest = await prisma.containerMetric.findFirst({
          where: { orderId: order.id },
          orderBy: { createdAt: "desc" },
          select: { createdAt: true },
        });

        const shouldInsert = !latest || (Date.now() - new Date(latest.createdAt).getTime()) >= 30_000;

        if (shouldInsert) {
          await prisma.containerMetric.create({
            data: {
              orderId: order.id,
              cpu: stats.cpu,
              ramPercent: stats.ramPercent,
              ramMb: stats.ramMb,
              ramTotalMb: stats.ramTotalMb,
              diskGb: stats.diskGb,
              diskTotalGb: stats.diskTotalGb,
              networkRxMb: stats.networkRxMb,
              networkTxMb: stats.networkTxMb,
              uptime: stats.uptime,
              online: stats.online,
            },
          });

          // Self-pruning: Batasi maksimal 50 sampel per order agar database tetap ringan
          const totalRows = await prisma.containerMetric.count({ where: { orderId: order.id } });
          if (totalRows > 50) {
            const excess = await prisma.containerMetric.findMany({
              where: { orderId: order.id },
              orderBy: { createdAt: "asc" },
              take: totalRows - 50,
              select: { id: true },
            });
            if (excess.length > 0) {
              await prisma.containerMetric.deleteMany({
                where: { id: { in: excess.map((x) => x.id) } },
              });
            }
          }
        }
      } catch (err) {
        console.warn("[Stats] Gagal menyimpan metrik telemetri ke DB:", err);
      }
    }

    // Ambil histori metrik tersimpan (maksimal 20 sampel terbaru)
    const history = await prisma.containerMetric.findMany({
      where: { orderId: order.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    history.reverse();

    return NextResponse.json({
      success: true,
      stats,
      history: history.map((m) => ({
        time: new Date(m.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        cpu: m.cpu,
        ram: m.ramPercent,
        ramMb: m.ramMb,
        diskGb: m.diskGb,
      })),
    });
  } catch (error: any) {
    console.error("[API/Stats]", error);
    return NextResponse.json({ error: "Gagal mengambil statistik container." }, { status: 500 });
  }
}
