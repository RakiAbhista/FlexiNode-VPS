import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { incus } from "@/lib/incus";
import { subdomain } from "@/lib/subdomain";

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
    let order = await prisma.order.findUnique({
      where: { id },
      include: { plan: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order tidak ditemukan." }, { status: 404 });
    }

    if (order.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Jika masih PROVISIONING, sinkronisasi apakah Incus sudah memberikan IP
    if (order.status === "PROVISIONING" && order.containerId) {
      try {
        const ip = await incus.getIp(order.containerId);
        if (ip) {
          let subdomainUrl = order.subdomain;
          if (order.addon) {
            subdomainUrl = await subdomain.provision(order.containerId, ip);
          }
          order = await prisma.order.update({
            where: { id: order.id },
            data: {
              status: "ACTIVE",
              ipAddress: ip,
              subdomain: subdomainUrl,
            },
            include: { plan: true },
          });
        }
      } catch {
        // Container masih proses boot
      }
    }

    let currentServerStatus = (order as any).serverStatus;
    if (!currentServerStatus) {
      try {
        const rows: any[] = await prisma.$queryRawUnsafe(
          `SELECT "serverStatus" FROM "Order" WHERE id = $1`,
          order.id
        );
        if (rows.length > 0 && rows[0].serverStatus) {
          currentServerStatus = rows[0].serverStatus;
        } else {
          currentServerStatus = "RUNNING";
        }
      } catch {
        currentServerStatus = "RUNNING";
      }
    }

    // Deteksi paket runtime yang benar-benar terpasang di dalam container
    let detectedPackages: string[] = [];
    if (order.setupPackages) {
      try {
        detectedPackages = JSON.parse(order.setupPackages);
      } catch {
        detectedPackages = [];
      }
    }

    if (order.status === "ACTIVE" && order.containerId) {
      try {
        const detectCmd =
          "which node >/dev/null 2>&1 && echo 'nodejs'; which python3 >/dev/null 2>&1 && echo 'python'; which php >/dev/null 2>&1 && echo 'php'; which git >/dev/null 2>&1 && echo 'git_tools'; which docker >/dev/null 2>&1 && echo 'docker'; which go >/dev/null 2>&1 && echo 'golang'; which nginx >/dev/null 2>&1 && echo 'nginx'; exit 0";
        const result = await incus.exec(order.containerId, detectCmd, "/root", 4000);
        if (result && result.stdout) {
          const live = result.stdout
            .trim()
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean);
          const combined = Array.from(new Set([...detectedPackages, ...live]));
          if (combined.length !== detectedPackages.length) {
            detectedPackages = combined;
            await prisma.order
              .update({
                where: { id: order.id },
                data: { setupPackages: JSON.stringify(combined) },
              })
              .catch(() => {});
          }
        }
      } catch {
        // Abaikan jika container sedang tidak merespon
      }
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        userId: order.userId,
        planId: order.planId,
        status: order.status,
        serverStatus: currentServerStatus,
        containerId: order.containerId || undefined,
        ipAddress: order.ipAddress || undefined,
        subdomain: order.subdomain || undefined,
        sshPassword: order.sshPassword || undefined,
        addon: order.addon,
        addonPrice: order.addonPrice,
        addonSuspended: order.addonSuspended,
        addonSuspendedAt: order.addonSuspendedAt?.toISOString(),
        setupPackages: detectedPackages,
        startedAt: order.startedAt?.toISOString(),
        expiresAt: order.expiresAt?.toISOString(),
        createdAt: order.createdAt.toISOString(),
        plan: order.plan
          ? {
              id: order.plan.id,
              name: order.plan.name,
              durationDays: order.plan.durationDays,
              ramMb: order.plan.ramMb,
              cpuAllowance: order.plan.cpuAllowance,
              storageGb: order.plan.storageGb,
              price: order.plan.price,
              tier: order.plan.tier,
            }
          : undefined,
      },
    });
  } catch (error: any) {
    console.error("[API]", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal server." }, { status: 500 });
  }
}
