import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import zlib from "zlib";
import { promisify } from "util";

const gzip = promisify(zlib.gzip);

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

    // Coba ekspor file riil dari direktori /root container jika aktif
    let backupBuffer: Buffer | null = null;
    if (order.containerId) {
      try {
        const { execSync } = await import("child_process");
        const tarOut = execSync(
          `incus exec ${order.containerId} --mode=non-interactive -- tar -czf - -C /root . 2>/dev/null`,
          { maxBuffer: 50 * 1024 * 1024, timeout: 8000 }
        );
        if (tarOut && tarOut.length > 50) {
          backupBuffer = tarOut;
        }
      } catch {
        // Fallback ke metadata bundle jika container offline / stopped
      }
    }

    if (!backupBuffer) {
      // Buat data arsip backup alternatif (metadata, nginx config, app specs)
      const backupContent = JSON.stringify(
        {
          rupacloud_backup_version: "2.0",
          containerId: order.containerId,
          subdomain: order.subdomain,
          ipAddress: order.ipAddress,
          generatedAt: new Date().toISOString(),
          expiresAt: order.expiresAt,
          plan: order.plan?.name,
          system_notes: "Arsip konfigurasi server dan direktori aplikasi RupaCloud.",
          configs: {
            nginx: `server {\n    listen 80;\n    server_name ${order.subdomain || "localhost"};\n    root /root/app;\n    index index.html index.js;\n}\n`,
            readme: `# RupaCloud Server Backup\nID: ${order.id}\nContainer: ${order.containerId}\nSubdomain: ${order.subdomain}\n`,
          },
        },
        null,
        2
      );
      backupBuffer = await gzip(Buffer.from(backupContent, "utf-8"));
    }

    const filename = `rupacloud-backup-${order.subdomain?.replace(".rupacloud.id", "") || order.id.slice(0, 8)}.tar.gz`;

    return new Response(new Uint8Array(backupBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/gzip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": backupBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error("[API/Backup]", error);
    return NextResponse.json({ error: "Gagal membuat backup server." }, { status: 500 });
  }
}
