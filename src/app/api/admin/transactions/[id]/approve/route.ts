import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { TransactionStatus, TransactionType } from "@prisma/client";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied: Admin only." }, { status: 403 });
    }

    const { id } = await params;
    const tx = await prisma.transaction.findUnique({ where: { id } });

    if (!tx) {
      return NextResponse.json({ error: "Transaksi tidak ditemukan." }, { status: 404 });
    }

    if (tx.status === TransactionStatus.SUCCESS) {
      return NextResponse.json({ message: "Transaksi sudah berstatus SUCCESS sebelumnya." });
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: { status: TransactionStatus.SUCCESS },
    });

    if (tx.type === TransactionType.TOPUP) {
      await prisma.user.update({
        where: { id: tx.userId },
        data: { balance: { increment: tx.amount } },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Transaksi ${tx.id} berhasil disetujui!`,
      status: updated.status,
    });
  } catch (error: any) {
    console.error("[API]", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal server." }, { status: 500 });
  }
}
