import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Endpoint publik — hanya return plan yang aktif, tanpa auth
// Admin gunakan /api/admin/plans untuk CRUD
export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      where: { active: true },
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
        tier: p.tier,
      })),
    });
  } catch (error: any) {
    console.error("[api/plans GET]", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal server." }, { status: 500 });
  }
}
