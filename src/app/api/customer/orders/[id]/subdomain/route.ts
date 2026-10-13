import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { subdomain } from "@/lib/subdomain";
import { OrderStatus } from "@prisma/client";

/**
 * PATCH /api/customer/orders/[id]/subdomain
 * Body: { newSubdomain: string }
 * Memungkinkan pelanggan yang memiliki add-on aktif untuk mengubah nama subdomainnya.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { newSubdomain } = body;

    if (!newSubdomain || typeof newSubdomain !== "string") {
      return NextResponse.json({ error: "Nama subdomain wajib diisi." }, { status: 400 });
    }

    const cleanSub = newSubdomain.toLowerCase().trim().replace(/[^a-z0-9-]/g, "").slice(0, 30);
    if (cleanSub.length < 3) {
      return NextResponse.json(
        { error: "Nama subdomain minimal 3 karakter (hanya huruf kecil, angka, dan strip)." },
        { status: 400 }
      );
    }

    const fullSubdomain = `${cleanSub}.rupacloud.id`;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order || order.userId !== user.id) {
      return NextResponse.json({ error: "Order tidak ditemukan." }, { status: 404 });
    }

    if (!order.addon) {
      return NextResponse.json(
        { error: "Subdomain hanya tersedia untuk paket dengan add-on aktif." },
        { status: 400 }
      );
    }

    if (order.addonSuspended) {
      return NextResponse.json(
        { error: "Add-on sedang ditangguhkan. Perpanjang sewa untuk mengaktifkan kembali." },
        { status: 400 }
      );
    }

    if (order.subdomain === fullSubdomain) {
      return NextResponse.json({ success: true, subdomain: fullSubdomain });
    }

    // Cek apakah subdomain sudah dipakai order lain yang aktif
    const existing = await prisma.order.findFirst({
      where: {
        id: { not: order.id },
        subdomain: fullSubdomain,
        status: { in: [OrderStatus.ACTIVE, OrderStatus.PROVISIONING, OrderStatus.EXPIRING_SOON] },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Subdomain '${fullSubdomain}' sudah digunakan. Silakan pilih nama lain.` },
        { status: 400 }
      );
    }

    // Update DNS mock
    if (order.containerId && order.ipAddress) {
      await subdomain.deprovision(order.containerId);
      await subdomain.provision(order.containerId, order.ipAddress);
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { subdomain: fullSubdomain },
    });

    return NextResponse.json({
      success: true,
      message: `Subdomain berhasil diubah menjadi https://${fullSubdomain}`,
      subdomain: updated.subdomain,
    });
  } catch (error: any) {
    console.error("[Subdomain Patch Error]:", error);
    return NextResponse.json({ error: "Gagal memperbarui subdomain." }, { status: 500 });
  }
}
