import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

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
    const { name, durationDays, ramMb, cpuAllowance, storageGb, price, tier, active } = body;

    const existing = await prisma.plan.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Paket tidak ditemukan." }, { status: 404 });
    }

    const updated = await prisma.plan.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(durationDays !== undefined ? { durationDays: Number(durationDays) } : {}),
        ...(ramMb !== undefined ? { ramMb: Number(ramMb) } : {}),
        ...(cpuAllowance !== undefined ? { cpuAllowance: Number(cpuAllowance) } : {}),
        ...(storageGb !== undefined ? { storageGb: Number(storageGb) } : {}),
        ...(price !== undefined ? { price: Number(price) } : {}),
        ...(tier !== undefined ? { tier } : {}),
        ...(active !== undefined ? { active: Boolean(active) } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Paket ${updated.name} berhasil diperbarui!`,
      plan: {
        id: updated.id,
        name: updated.name,
        durationDays: updated.durationDays,
        ramMb: updated.ramMb,
        cpuAllowance: updated.cpuAllowance,
        storageGb: updated.storageGb,
        price: updated.price,
        tier: updated.tier,
        active: updated.active,
      },
    });
  } catch (error: any) {
    console.error("[API]", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal server." }, { status: 500 });
  }
}
