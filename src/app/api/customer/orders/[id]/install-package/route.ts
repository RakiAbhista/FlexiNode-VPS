import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { incus } from "@/lib/incus";
import { AVAILABLE_SETUP_PACKAGES } from "@/lib/setup-packages";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const packageId = (body.packageId || "").trim();

    const pkg = AVAILABLE_SETUP_PACKAGES.find((p) => p.id === packageId);
    if (!pkg) {
      return NextResponse.json({ error: "Paket tidak valid." }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order || order.userId !== user.id) {
      return NextResponse.json({ error: "Order tidak ditemukan." }, { status: 404 });
    }

    if (!order.containerId) {
      return NextResponse.json({ error: "Container belum aktif." }, { status: 400 });
    }

    // Eksekusi instalasi paket di dalam container (timeout 180 detik)
    await incus.exec(order.containerId, pkg.script, "/root", 180000);

    // Ambil daftar paket yang sudah terpasang
    let currentPkgs: string[] = [];
    try {
      if (order.setupPackages) {
        currentPkgs = JSON.parse(order.setupPackages);
      }
    } catch {
      currentPkgs = [];
    }

    if (!currentPkgs.includes(packageId)) {
      currentPkgs.push(packageId);
    }

    await prisma.order.update({
      where: { id },
      data: { setupPackages: JSON.stringify(currentPkgs) },
    });

    return NextResponse.json({
      success: true,
      message: `Paket ${pkg.name} berhasil dipasang ke container kamu!`,
      installedPackage: packageId,
      setupPackages: currentPkgs,
    });
  } catch (error: any) {
    console.error("Install package error:", error);
    return NextResponse.json(
      { error: error?.message || "Gagal menginstall paket ke container." },
      { status: 500 }
    );
  }
}
