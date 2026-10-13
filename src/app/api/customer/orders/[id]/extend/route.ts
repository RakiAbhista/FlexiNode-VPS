import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { OrderStatus, TransactionType, TransactionStatus } from "@prisma/client";
import { incus } from "@/lib/incus";

import { subdomain, ADDON_PRICE } from "@/lib/subdomain";

const MAX_EXTEND_DAYS = 7; // Extend max 7 hari sekaligus

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.suspended) {
      return NextResponse.json({ error: "Akun Anda telah disuspend." }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    // --- Validasi input days ---
    const days = Number(body.days ?? 1);
    if (!Number.isInteger(days) || days < 1 || days > MAX_EXTEND_DAYS) {
      return NextResponse.json(
        { error: `Perpanjangan harus antara 1 sampai ${MAX_EXTEND_DAYS} hari.` },
        { status: 400 }
      );
    }

    const paymentMethod = body.paymentMethod === "GATEWAY" ? "GATEWAY" : "BALANCE";
    const withAddon = Boolean(body.withAddon && days >= 3);

    const order = await prisma.order.findUnique({ where: { id }, include: { plan: true } });

    if (!order) {
      return NextResponse.json({ error: "Order tidak ditemukan." }, { status: 404 });
    }
    if (order.userId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    if (order.status === OrderStatus.FAILED || !order.containerId) {
      return NextResponse.json({ error: "VPS ini sudah dihapus permanen." }, { status: 400 });
    }

    // Cari paket resmi yang sesuai dengan tier dan durasi yang dipilih (misal: Micro 1D, 3D, atau 7D)
    const targetPlan = await prisma.plan.findFirst({
      where: {
        tier: order.plan.tier,
        durationDays: days,
        active: true,
      },
    });

    const vpsPrice = targetPlan
      ? targetPlan.price
      : Math.round(order.plan.price / order.plan.durationDays) * days;
    const addonPrice = withAddon ? ADDON_PRICE : 0;
    const totalPrice = vpsPrice + addonPrice;

    if (paymentMethod === "BALANCE" && user.balance < totalPrice) {
      return NextResponse.json(
        { error: `Saldo tidak mencukupi (Dibutuhkan: Rp ${totalPrice.toLocaleString("id-ID")}).` },
        { status: 400 }
      );
    }

    const currentExpires = order.expiresAt ? new Date(order.expiresAt) : new Date();
    const baseDate = currentExpires.getTime() > Date.now() ? currentExpires : new Date();
    const newExpires = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);

    // Batasi akumulasi maksimal sewa aktif hingga 30 hari ke depan
    const MAX_ACCUMULATIVE_DAYS = 30;
    const maxExpiryLimit = new Date(Date.now() + MAX_ACCUMULATIVE_DAYS * 24 * 60 * 60 * 1000);
    if (newExpires.getTime() > maxExpiryLimit.getTime()) {
      return NextResponse.json(
        {
          error: `Maksimal akumulasi sewa aktif adalah ${MAX_ACCUMULATIVE_DAYS} hari ke depan. Server Anda saat ini sudah memiliki sisa masa sewa yang cukup panjang.`,
        },
        { status: 400 }
      );
    }

    // Hitung status add-on baru
    let updatedSubdomain = order.subdomain;
    let nextAddon = order.addon;
    let nextAddonSuspended = order.addonSuspended;
    let nextAddonSuspendedAt = order.addonSuspendedAt;

    if (withAddon) {
      // Perpanjang / aktifkan add-on
      nextAddon = true;
      nextAddonSuspended = false;
      nextAddonSuspendedAt = null;

      // Jika belum punya subdomain, buatkan baru
      if (!updatedSubdomain && order.containerId && order.ipAddress) {
        updatedSubdomain = await subdomain.provision(order.containerId, order.ipAddress);
      } else if (order.containerId && order.ipAddress) {
        await subdomain.reactivate(order.containerId, order.ipAddress);
      }

      // Pulihkan authorized_keys jika sebelumnya di-suspend
      if (order.containerId) {
        try {
          await incus.exec(
            order.containerId,
            "if [ -f /root/.ssh/authorized_keys.suspended ]; then mv /root/.ssh/authorized_keys.suspended /root/.ssh/authorized_keys; chmod 600 /root/.ssh/authorized_keys; fi"
          );
        } catch {
          // container might be stopped
        }
      }
    } else if (order.addon) {
      // User tidak memperpanjang add-on (atau perpanjang 1 hari) -> Add-on masuk masa tenggang / suspend
      nextAddonSuspended = true;
      nextAddonSuspendedAt = new Date();

      if (order.containerId) {
        await subdomain.suspend(order.containerId);
        try {
          // Pindahkan deploy key agar user tidak bisa deploy selama suspend
          await incus.exec(
            order.containerId,
            "if [ -f /root/.ssh/authorized_keys ]; then mv /root/.ssh/authorized_keys /root/.ssh/authorized_keys.suspended; fi"
          );
        } catch {
          // container might be stopped
        }
      }
    }

    await prisma.$transaction(async (tx) => {
      // Re-check saldo di dalam transaksi
      const freshUser = await tx.user.findUnique({ where: { id: user.id } });
      if (!freshUser || (paymentMethod === "BALANCE" && freshUser.balance < totalPrice)) {
        throw new Error("Saldo tidak mencukupi.");
      }

      if (paymentMethod === "BALANCE") {
        await tx.user.update({ where: { id: user.id }, data: { balance: { decrement: totalPrice } } });
      }

      await tx.order.update({
        where: { id },
        data: {
          planId: targetPlan ? targetPlan.id : order.planId,
          expiresAt: newExpires,
          status: OrderStatus.ACTIVE,
          addon: nextAddon,
          addonPrice: withAddon ? ADDON_PRICE : order.addonPrice,
          addonSuspended: nextAddonSuspended,
          addonSuspendedAt: nextAddonSuspendedAt,
          subdomain: updatedSubdomain,
        },
      });

      await tx.transaction.create({
        data: {
          userId: user.id,
          type: TransactionType.EXTEND,
          amount: totalPrice,
          method: paymentMethod,
          status: TransactionStatus.SUCCESS,
          orderId: order.id,
        },
      });
    });

    // Nyalakan kembali jika sedang suspended
    if (order.status === OrderStatus.EXPIRED || order.status === OrderStatus.EXPIRING_SOON) {
      try {
        await incus.start(order.containerId!);
      } catch {
        console.warn(`Gagal start container ${order.containerId}, mungkin sudah running.`);
      }
    }

    const updated = await prisma.order.findUnique({ where: { id } });
    return NextResponse.json({
      success: true,
      message: withAddon
        ? `Perpanjangan sewa ${days} hari + Add-on berhasil!`
        : `Perpanjangan sewa ${days} hari berhasil!${order.addon ? " (Add-on ditangguhkan)" : ""}`,
      expiresAt: updated?.expiresAt?.toISOString(),
      addonSuspended: updated?.addonSuspended,
    });
  } catch (error: any) {
    console.error("[API]", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal server." }, { status: 500 });
  }
}
