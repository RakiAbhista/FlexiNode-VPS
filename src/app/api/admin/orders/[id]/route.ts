import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

const ALLOWED_STATUSES = Object.values(OrderStatus);
const MAX_EXTEND_DAYS = 30; // Admin max extend 30 hari sekaligus

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied: Admin only." }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, extendDays } = body;

    // Validasi status: hanya enum OrderStatus yang valid
    if (status && !ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Status order tidak valid." }, { status: 400 });
    }

    // Validasi extendDays: harus integer positif, max 30
    if (extendDays !== undefined) {
      const days = Number(extendDays);
      if (!Number.isInteger(days) || days < 1 || days > MAX_EXTEND_DAYS) {
        return NextResponse.json(
          { error: `extendDays harus antara 1 dan ${MAX_EXTEND_DAYS}.` },
          { status: 400 }
        );
      }
    }

    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Order tidak ditemukan." }, { status: 404 });
    }

    let newExpires = existing.expiresAt;
    if (extendDays) {
      const base = existing.expiresAt ? new Date(existing.expiresAt) : new Date();
      newExpires = new Date(base.getTime() + Number(extendDays) * 24 * 60 * 60 * 1000);
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        ...(status ? { status: status as OrderStatus } : {}),
        ...(extendDays ? { expiresAt: newExpires } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Order ${updated.id} berhasil diperbarui.`,
      status: updated.status,
      expiresAt: updated.expiresAt?.toISOString(),
    });
  } catch (error: any) {
    console.error("[admin/orders PATCH]", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal server." }, { status: 500 });
  }
}
