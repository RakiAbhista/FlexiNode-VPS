import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { OrderStatus, TransactionType, TransactionStatus } from "@prisma/client";
import { incus } from "@/lib/incus";
import { subdomain, ADDON_PRICE } from "@/lib/subdomain";
import { githubCiCd } from "@/lib/github-cicd";
import { provisionContainer } from "@/lib/provisioner";

const ADDON_ALLOWED_DAYS = [3, 7];
const MAX_ACTIVE_ORDERS = 2; // 1 user max 2 VPS aktif (dari 4 slot total)
const MAX_DAYS_EXTEND = 7;   // Extend max 7 hari sekaligus

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // --- Blokir akun yang di-suspend ---
    if (user.suspended) {
      return NextResponse.json({ error: "Akun Anda telah disuspend. Hubungi admin." }, { status: 403 });
    }

    const body = await request.json();
    const {
      planId,
      paymentMethod = "BALANCE",
      withAddon = false,
      customSubdomain,
      setupPackages = [],
      githubToken,
      githubOwner,
      githubRepo,
    } = body;

    if (!planId || typeof planId !== "string") {
      return NextResponse.json({ error: "Paket wajib dipilih." }, { status: 400 });
    }

    // --- Cek quota VPS aktif ---
    const activeOrderCount = await prisma.order.count({
      where: {
        userId: user.id,
        status: { in: [OrderStatus.ACTIVE, OrderStatus.PROVISIONING, OrderStatus.EXPIRING_SOON] },
      },
    });
    if (activeOrderCount >= MAX_ACTIVE_ORDERS) {
      return NextResponse.json(
        { error: `Anda sudah memiliki ${activeOrderCount} VPS aktif. Maksimal ${MAX_ACTIVE_ORDERS} VPS per akun.` },
        { status: 400 }
      );
    }

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan || !plan.active) {
      return NextResponse.json({ error: "Paket tidak aktif atau tidak ditemukan." }, { status: 404 });
    }

    if (withAddon && !ADDON_ALLOWED_DAYS.includes(plan.durationDays)) {
      return NextResponse.json(
        { error: "Add-on hanya tersedia untuk paket 3 hari atau 7 hari." },
        { status: 400 }
      );
    }

    const addonPrice = withAddon ? ADDON_PRICE : 0;
    const totalPrice = plan.price + addonPrice;

    if (paymentMethod === "BALANCE" && user.balance < totalPrice) {
      return NextResponse.json(
        { error: `Saldo tidak mencukupi (Saldo: Rp ${user.balance.toLocaleString("id-ID")}, Tagihan: Rp ${totalPrice.toLocaleString("id-ID")}).` },
        { status: 400 }
      );
    }

    const now = new Date();
    const expires = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    const orderId = crypto.randomUUID();
    const containerName = `rupa-${orderId.replace(/-/g, "").slice(0, 8)}`;

    // Validasi dan set subdomain kustom jika customer beli add-on
    let chosenSubdomain: string | null = null;
    if (withAddon) {
      if (customSubdomain && typeof customSubdomain === "string") {
        const cleanSub = customSubdomain.toLowerCase().trim().replace(/[^a-z0-9-]/g, "").slice(0, 30);
        if (cleanSub.length >= 3) {
          const existing = await prisma.order.findFirst({
            where: {
              subdomain: `${cleanSub}.rupacloud.id`,
              status: { in: [OrderStatus.ACTIVE, OrderStatus.PROVISIONING, OrderStatus.EXPIRING_SOON] },
            },
          });
          if (existing) {
            return NextResponse.json(
              { error: `Subdomain '${cleanSub}.rupacloud.id' sudah digunakan. Silakan pilih nama lain.` },
              { status: 400 }
            );
          }
          chosenSubdomain = `${cleanSub}.rupacloud.id`;
        }
      }
      if (!chosenSubdomain) {
        chosenSubdomain = `${containerName}.rupacloud.id`;
      }
    }

    // Generate password root SSH aman untuk customer
    const randPart1 = Math.random().toString(36).substring(2, 6);
    const randPart2 = Math.random().toString(36).substring(2, 6);
    const sshPassword = `rc-${randPart1}${randPart2}`;

    const { order, transaction } = await prisma.$transaction(async (tx) => {
      // Re-check saldo di dalam transaksi untuk hindari race condition double-purchase
      const freshUser = await tx.user.findUnique({ where: { id: user.id } });
      if (!freshUser || (paymentMethod === "BALANCE" && freshUser.balance < totalPrice)) {
        throw new Error("Saldo tidak mencukupi (race condition check).");
      }

      if (paymentMethod === "BALANCE") {
        await tx.user.update({ where: { id: user.id }, data: { balance: { decrement: totalPrice } } });
      }

      const newOrder = await tx.order.create({
        data: {
          id: orderId,
          userId: user.id,
          planId: plan.id,
          status: OrderStatus.PROVISIONING,
          containerId: containerName,
          subdomain: chosenSubdomain,
          sshPassword,
          addon: withAddon,
          addonPrice,
          setupPackages: Array.isArray(setupPackages) ? JSON.stringify(setupPackages) : null,
          startedAt: now,
          expiresAt: expires,
        },
      });

      const newTx = await tx.transaction.create({
        data: {
          userId: user.id,
          type: TransactionType.RENTAL,
          amount: totalPrice,
          method: paymentMethod,
          status: TransactionStatus.SUCCESS,
          orderId: newOrder.id,
        },
      });

      return { order: newOrder, transaction: newTx };
    });

    // Jalankan provisioning Incus secara asinkron di latar belakang
    // sehingga request HTTP checkout langsung selesai tanpa loading lama
    void provisionContainer(order.id);

    return NextResponse.json({
      success: true,
      message: "Pesanan berhasil dibuat! Sedang menyiapkan container VPS...",
      order: {
        id: order.id,
        containerId: order.containerId,
        subdomain: order.subdomain,
        status: order.status,
        addon: order.addon,
        setupPackages: order.setupPackages ? JSON.parse(order.setupPackages) : [],
        expiresAt: order.expiresAt?.toISOString(),
      },
      transactionId: transaction.id,
    });
  } catch (error: any) {
    console.error("[API]", error);
    return NextResponse.json({ error: error.message || "Terjadi kesalahan internal server." }, { status: 500 });
  }
}

function generateWorkflow(serverIp: string): string {
  return `name: Deploy to RupaCloud

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${serverIp}
          username: root
          key: \${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd ~/app 2>/dev/null || (git clone \$GITHUB_SERVER_URL/\$GITHUB_REPOSITORY ~/app && cd ~/app)
            git fetch --all && git reset --hard origin/main
            npm install --omit=dev
            pm2 restart app 2>/dev/null || pm2 start npm --name app -- start
            pm2 save 2>/dev/null || true
            pm2 startup systemd -u root --hp /root 2>/dev/null || true
            systemctl enable pm2-root 2>/dev/null || true
`;
}
