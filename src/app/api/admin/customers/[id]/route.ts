import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const ALLOWED_ROLES = ["CUSTOMER", "ADMIN"] as const;
const MAX_BALANCE = 10_000_000; // Rp 10 juta batas saldo yang bisa di-set manual

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
    const { toggleSuspend, balance, role } = body;

    // Validasi role: hanya boleh CUSTOMER atau ADMIN
    if (role && !ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ error: "Role tidak valid." }, { status: 400 });
    }

    // Validasi balance: harus angka positif dan tidak melebihi batas wajar
    if (balance !== undefined) {
      const balNum = Number(balance);
      if (isNaN(balNum) || balNum < 0 || balNum > MAX_BALANCE) {
        return NextResponse.json(
          { error: `Saldo harus antara 0 dan Rp ${MAX_BALANCE.toLocaleString("id-ID")}.` },
          { status: 400 }
        );
      }
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "User tidak ditemukan." }, { status: 404 });
    }

    // Cegah admin men-demote dirinya sendiri (self-lockout)
    if (id === user.id && role === "CUSTOMER") {
      return NextResponse.json({ error: "Anda tidak bisa mengubah role akun Anda sendiri." }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(toggleSuspend !== undefined ? { suspended: !existing.suspended } : {}),
        ...(balance !== undefined ? { balance: Number(balance) } : {}),
        ...(role ? { role } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Data customer ${updated.name} berhasil diperbarui.`,
      customer: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        suspended: updated.suspended,
        balance: updated.balance,
      },
    });
  } catch (error: any) {
    console.error("[admin/customers PATCH]", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal server." }, { status: 500 });
  }
}
