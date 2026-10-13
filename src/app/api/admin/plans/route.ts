import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied: Admin only." }, { status: 403 });
    }

    const plans = await prisma.plan.findMany({
      orderBy: { price: "asc" },
    });

    return NextResponse.json({
      success: true,
      plans: plans.map((p) => ({
        id: p.id,
        name: p.name,
        durationDays: p.durationDays,
        ramMb: p.ramMb,
        cpuAllowance: p.cpuAllowance,
        storageGb: p.storageGb,
        price: p.price,
        active: p.active,
        tier: p.tier,
      })),
    });
  } catch (error: any) {
    console.error("[admin/plans GET]", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal server." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied: Admin only." }, { status: 403 });
    }

    const body = await request.json();
    const { name, durationDays, ramMb, cpuAllowance, storageGb, price, tier = "Starter", active = true } = body;

    if (!name || !price || !durationDays) {
      return NextResponse.json(
        { error: "Nama paket, harga, dan durasi hari wajib diisi." },
        { status: 400 }
      );
    }

    const newPlan = await prisma.plan.create({
      data: {
        name,
        durationDays: Number(durationDays),
        ramMb: Number(ramMb || 512),
        cpuAllowance: Number(cpuAllowance || 25),
        storageGb: Number(storageGb || 10),
        price: Number(price),
        tier,
        active: Boolean(active),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Paket ${newPlan.name} berhasil dibuat!`,
      plan: newPlan,
    });
  } catch (error: any) {
    console.error("[API]", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal server." }, { status: 500 });
  }
}
