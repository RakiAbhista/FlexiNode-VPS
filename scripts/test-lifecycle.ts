import { prisma } from "../src/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { incus } from "../src/lib/incus";
import { subdomain } from "../src/lib/subdomain";

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "help";
  const orderId = args[1];

  console.log("\n=======================================================");
  console.log("   RuPa Cloud - Lifecycle & Expiry Test Utility");
  console.log("=======================================================\n");

  if (command === "list") {
    const orders = await prisma.order.findMany({
      include: { plan: true, user: true },
      orderBy: { createdAt: "desc" },
    });

    console.log(`Ditemukan ${orders.length} order:\n`);
    for (const o of orders) {
      console.log(`• ID           : ${o.id}`);
      console.log(`  Customer     : ${o.user?.name} (${o.user?.email})`);
      console.log(`  Plan         : ${o.plan?.name}`);
      console.log(`  Status       : ${o.status} | Server: ${o.serverStatus}`);
      console.log(`  Container    : ${o.containerId || "(tidak ada/dihapus)"}`);
      console.log(`  Expires At   : ${o.expiresAt ? o.expiresAt.toISOString() : "-"}`);
      console.log("  --------------------------------------------------");
    }
    return;
  }

  if (command === "run") {
    console.log("Menjalankan siklus cron lifecycle (sama seperti API /api/cron/lifecycle)...");
    const now = new Date();
    const suspendDeadline = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 1. Expire active orders
    const toExpire = await prisma.order.findMany({
      where: {
        status: { in: [OrderStatus.ACTIVE, OrderStatus.EXPIRING_SOON] },
        expiresAt: { lt: now },
        containerId: { not: null },
      },
    });
    console.log(`• Order yang kadaluarsa untuk dimatikan (Stop): ${toExpire.length}`);
    for (const o of toExpire) {
      console.log(`  -> Mematikan container ${o.containerId}...`);
      await incus.stop(o.containerId!);
      await prisma.order.update({
        where: { id: o.id },
        data: { status: OrderStatus.EXPIRED, serverStatus: "STOPPED" },
      });
      console.log(`  -> Status order ${o.id} diubah ke EXPIRED.`);
    }

    // 2. Delete expired orders > 7 hari
    const toDelete = await prisma.order.findMany({
      where: {
        status: OrderStatus.EXPIRED,
        expiresAt: { lt: suspendDeadline },
        containerId: { not: null },
      },
    });
    console.log(`• Order kadaluarsa > 7 hari untuk dihapus permanen: ${toDelete.length}`);
    for (const o of toDelete) {
      console.log(`  -> Menghapus permanen container ${o.containerId}...`);
      await incus.delete(o.containerId!);
      if (o.addon) {
        await subdomain.deprovision(o.containerId!);
      }
      await prisma.order.update({
        where: { id: o.id },
        data: { status: OrderStatus.FAILED, serverStatus: "STOPPED", containerId: null },
      });
      console.log(`  -> Order ${o.id} diubah ke FAILED (dihapus permanen).`);
    }

    console.log("\nSelesai menjalankan siklus lifecycle.");
    return;
  }

  if (!orderId) {
    printHelp();
    return;
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { plan: true },
  });

  if (!order) {
    console.error(`Error: Order dengan ID "${orderId}" tidak ditemukan.`);
    return;
  }

  if (command === "expire") {
    console.log(`[TEST] Mensimulasikan Masa Sewa Berakhir (EXPIRED) untuk Order: ${order.id}`);
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    // 1. Set expiresAt ke waktu lampau
    await prisma.order.update({
      where: { id: order.id },
      data: {
        expiresAt: tenMinutesAgo,
        status: OrderStatus.EXPIRED,
        serverStatus: "STOPPED",
      },
    });

    // 2. Stop container Incus
    if (order.containerId) {
      console.log(`Menghentikan container Incus: ${order.containerId}...`);
      await incus.stop(order.containerId);
    }

    console.log("\nBerhasil! Status order sekarang:");
    console.log(`• status       : EXPIRED (Masa Sewa Berakhir)`);
    console.log(`• serverStatus : STOPPED (Container Dimatikan)`);
    console.log(`• expiresAt    : ${tenMinutesAgo.toISOString()} (10 menit yang lalu)`);
    console.log("\nEfek yang dapat Anda lihat di browser customer (refresh halaman /products/[id]):");
    console.log("1. Badge atas berubah merah: 'Masa Sewa Berakhir' & 'Server Berhenti'");
    console.log("2. Tombol Start/Stop/Restart disembunyikan / diblokir.");
    console.log("3. Tombol [Perpanjang Masa Sewa] tetap aktif.");
    console.log("4. Di Web CLI muncul peringatan bahwa sewa telah berakhir.");
    console.log("5. Coba perpanjang sewa lewat UI, status akan otomatis pulih ke AKTIF!");
    return;
  }

  if (command === "delete") {
    console.log(`[TEST] Mensimulasikan Hapus Permanen (7 Hari Melewati Expired) untuk Order: ${order.id}`);
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);

    const containerToDelete = order.containerId;
    if (containerToDelete) {
      console.log(`Menghapus container Incus "${containerToDelete}" dari host...`);
      await incus.delete(containerToDelete);
      if (order.addon) {
        console.log(`Menghapus konfigurasi subdomain proxy...`);
        await subdomain.deprovision(containerToDelete);
      }
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        expiresAt: eightDaysAgo,
        status: OrderStatus.FAILED,
        serverStatus: "STOPPED",
        containerId: null,
      },
    });

    console.log("\nBerhasil! Order telah dihapus permanen:");
    console.log(`• status       : FAILED (Dihapus Permanen)`);
    console.log(`• serverStatus : STOPPED`);
    console.log(`• containerId  : null (Container Incus telah musnah dari server)`);
    console.log(`• expiresAt    : ${eightDaysAgo.toISOString()} (8 hari yang lalu)`);
    console.log("\nEfek yang dapat Anda lihat di browser customer:");
    console.log("1. Server tidak lagi dapat dinyalakan atau diakses terminalnya.");
    console.log("2. Status menunjukkan 'Dihapus Permanen' karena melewati grace period 7 hari.");
    console.log("3. Customer tidak bisa lagi memperpanjang karena container sudah dihapus.");
    return;
  }

  if (command === "restore") {
    console.log(`[TEST] Memulihkan Order: ${order.id} kembali ke ACTIVE...`);
    const threeDaysLater = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    let containerId = order.containerId;
    if (!containerId) {
      // Container sebelumnya sudah dihapus, buat nama container baru
      containerId = `rupa-${order.id.slice(0, 8)}`;
      console.log(`Mendaftarkan dan membuat container Incus baru: ${containerId}...`);
      await prisma.order.update({
        where: { id: order.id },
        data: { containerId, status: OrderStatus.PROVISIONING },
      });
      const { provisionContainer } = await import("../src/lib/provisioner");
      await provisionContainer(order.id);
    } else {
      console.log(`Menyalakan container Incus yang ada: ${containerId}...`);
      await incus.start(containerId);
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.ACTIVE,
        serverStatus: "RUNNING",
        expiresAt: threeDaysLater,
        containerId,
      },
    });

    console.log("\nBerhasil! Order dipulihkan kembali:");
    console.log(`• status       : ACTIVE`);
    console.log(`• serverStatus : RUNNING`);
    console.log(`• containerId  : ${containerId}`);
    console.log(`• expiresAt    : ${threeDaysLater.toISOString()} (+3 hari ke depan)`);
    return;
  }

  printHelp();
}

function printHelp() {
  console.log("Petunjuk Penggunaan:");
  console.log("  npx tsx scripts/test-lifecycle.ts list");
  console.log("    -> Melihat daftar order, status, dan container yang ada.\n");
  console.log("  npx tsx scripts/test-lifecycle.ts expire <orderId>");
  console.log("    -> Mensimulasikan masa sewa habis: mematikan container & mengubah status jadi EXPIRED.\n");
  console.log("  npx tsx scripts/test-lifecycle.ts delete <orderId>");
  console.log("    -> Mensimulasikan lewat 7 hari: menghapus permanen container & mengubah status jadi FAILED.\n");
  console.log("  npx tsx scripts/test-lifecycle.ts restore <orderId>");
  console.log("    -> Mengembalikan order ke status ACTIVE (+3 hari) dan menyalakan container kembali.\n");
  console.log("  npx tsx scripts/test-lifecycle.ts run");
  console.log("    -> Menjalankan pengecekan cron lifecycle pada seluruh database.");
}

main()
  .catch((err) => {
    console.error("Error:", err);
  })
  .finally(() => {
    prisma.$disconnect();
  });
