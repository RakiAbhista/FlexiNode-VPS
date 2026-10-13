import { prisma } from "@/lib/prisma";
import { incus } from "@/lib/incus";
import { subdomain } from "@/lib/subdomain";
import { OrderStatus } from "@prisma/client";
import { buildSetupScript } from "@/lib/setup-packages";

// Guard against duplicate concurrent provisioning for the same order
const ongoingProvisioning = new Set<string>();

/**
 * Background provisioner for Incus micro-VPS containers.
 * Runs asynchronously without blocking the checkout HTTP response.
 */
export async function provisionContainer(orderId: string): Promise<boolean> {
  if (ongoingProvisioning.has(orderId)) {
    return false;
  }

  ongoingProvisioning.add(orderId);

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { plan: true },
    });

    if (!order || order.status !== OrderStatus.PROVISIONING || !order.containerId) {
      ongoingProvisioning.delete(orderId);
      return false;
    }

    console.log(`[Provisioner] Starting Incus provisioning for order ${orderId} (container: ${order.containerId})...`);

    // 1. Launch Incus container with resource limits (use local image fingerprint for fast boot)
    await incus.createAndStart(order.containerId, "e20bfaead29a", {
      memoryMb: order.plan.ramMb,
      cpuAllowance: order.plan.cpuAllowance,
    });

    // 2. Poll for container IPv4 (max 15 attempts with 1s interval)
    let ip: string | null = null;
    for (let i = 0; i < 15; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      ip = await incus.getIp(order.containerId);
      if (ip) break;
    }

    if (!ip) {
      ip = "10.152.42.10"; // Fallback IP if DHCP takes a bit longer
    }

    // 3. Konfigurasi OpenSSH & root password di dalam container
    if (order.sshPassword) {
      try {
        const setupSshScript = [
          "which sshd >/dev/null 2>&1 || (apt-get update -qq && apt-get install -y openssh-server -qq)",
          "mkdir -p /etc/ssh/sshd_config.d",
          'echo "PasswordAuthentication yes" > /etc/ssh/sshd_config.d/60-rupacloud.conf',
          'echo "PermitRootLogin yes" >> /etc/ssh/sshd_config.d/60-rupacloud.conf',
          `echo "root:${order.sshPassword}" | chpasswd`,
          "systemctl enable ssh >/dev/null 2>&1 || true",
          "systemctl restart ssh >/dev/null 2>&1 || true",
        ].join(" && ");
        await incus.exec(order.containerId, setupSshScript);
        console.log(`[Provisioner] SSH configured with root password for order ${orderId}.`);
      } catch (sshErr) {
        console.warn(`[Provisioner] Warning: could not configure sshd inside container:`, sshErr);
      }
    }

    // 4. Register subdomain if add-on is active
    let subUrl = order.subdomain;
    if (order.addon) {
      subUrl = await subdomain.provision(order.containerId, ip);
    }

    // 5. Jalankan instalasi setup otomatis paket pilihan user
    let packagesToInstall: string[] = [];
    if (order.setupPackages) {
      try {
        packagesToInstall = JSON.parse(order.setupPackages);
      } catch {
        packagesToInstall = [];
      }
    }

    if (packagesToInstall.length > 0) {
      console.log(`[Provisioner] Memulai instalasi paket pilihan user untuk order ${orderId}:`, packagesToInstall);
      try {
        const setupScript = buildSetupScript(packagesToInstall);
        await incus.exec(order.containerId, setupScript, "/root", 180000);
        console.log(`[Provisioner] Selesai memasang paket otomatis untuk order ${orderId}.`);
      } catch (pkgErr) {
        console.warn(`[Provisioner] Peringatan: Gagal menjalankan beberapa setup paket untuk order ${orderId}:`, pkgErr);
      }
    }

    // 6. Update order to ACTIVE
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.ACTIVE,
        ipAddress: ip,
        subdomain: subUrl,
      },
    });

    console.log(`[Provisioner] Successfully activated order ${orderId} (container: ${order.containerId}, IP: ${ip}).`);
    return true;
  } catch (error: any) {
    console.error(`[Provisioner] Failed provisioning container for order ${orderId}:`, error);

    try {
      const failedOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: { plan: true },
      });

      if (failedOrder && failedOrder.status === OrderStatus.PROVISIONING) {
        // Refund balance if rental failed
        const refundAmount = failedOrder.plan.price + (failedOrder.addonPrice || 0);
        await prisma.user.update({
          where: { id: failedOrder.userId },
          data: { balance: { increment: refundAmount } },
        });

        await prisma.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.FAILED },
        });

        console.log(`[Provisioner] Refunded Rp ${refundAmount} to user ${failedOrder.userId}.`);
      }
    } catch (refundError) {
      console.error("[Provisioner] Refund error:", refundError);
    }

    return false;
  } finally {
    ongoingProvisioning.delete(orderId);
  }
}

/**
 * Rebuild / Reinstall OS from fresh Ubuntu 22.04 LTS image.
 * Keeps existing credentials, IP/subdomain, and subscription expiry.
 */
export async function rebuildContainer(
  orderId: string,
  customPackages?: string[]
): Promise<{ success: boolean; ip?: string; error?: string }> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { plan: true },
    });

    if (!order || !order.containerId) {
      return { success: false, error: "Order atau container tidak ditemukan." };
    }

    if (order.status === OrderStatus.FAILED) {
      return { success: false, error: "Server yang telah dihapus permanen tidak dapat di-rebuild." };
    }

    console.log(`[Provisioner] Rebuilding container ${order.containerId} for order ${orderId}...`);

    // 1. Hentikan & hapus container lama
    try {
      await incus.delete(order.containerId);
    } catch (delErr) {
      console.warn(`[Provisioner] Warning during container delete for rebuild:`, delErr);
    }

    // 2. Buat container baru dari image bersih Ubuntu 22.04 (fingerprint lokal)
    await incus.createAndStart(order.containerId, "e20bfaead29a", {
      memoryMb: order.plan.ramMb,
      cpuAllowance: order.plan.cpuAllowance,
    });

    // 3. Ambil IP baru
    let ip: string | null = null;
    for (let i = 0; i < 15; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      ip = await incus.getIp(order.containerId);
      if (ip) break;
    }

    if (!ip) {
      ip = order.ipAddress || "10.152.42.10";
    }

    // 4. Konfigurasi OpenSSH & root password
    if (order.sshPassword) {
      try {
        const setupSshScript = [
          "which sshd >/dev/null 2>&1 || (apt-get update -qq && apt-get install -y openssh-server -qq)",
          "mkdir -p /etc/ssh/sshd_config.d",
          'echo "PasswordAuthentication yes" > /etc/ssh/sshd_config.d/60-rupacloud.conf',
          'echo "PermitRootLogin yes" >> /etc/ssh/sshd_config.d/60-rupacloud.conf',
          `echo "root:${order.sshPassword}" | chpasswd`,
          "systemctl enable ssh >/dev/null 2>&1 || true",
          "systemctl restart ssh >/dev/null 2>&1 || true",
        ].join(" && ");
        await incus.exec(order.containerId, setupSshScript);
      } catch (sshErr) {
        console.warn(`[Provisioner] Warning: could not reconfigure sshd inside rebuilt container:`, sshErr);
      }
    }

    // 5. Update routing subdomain jika ada add-on
    let subUrl = order.subdomain;
    if (order.addon && ip) {
      try {
        subUrl = await subdomain.provision(order.containerId, ip);
      } catch (subErr) {
        console.warn(`[Provisioner] Warning updating subdomain routing:`, subErr);
      }
    }

    // 6. Jalankan instalasi setup paket otomatis
    const packagesToUse =
      customPackages !== undefined
        ? customPackages
        : order.setupPackages
        ? JSON.parse(order.setupPackages)
        : [];

    if (packagesToUse && packagesToUse.length > 0) {
      try {
        const setupScript = buildSetupScript(packagesToUse);
        await incus.exec(order.containerId, setupScript, "/root", 180000);
      } catch (pkgErr) {
        console.warn(`[Provisioner] Warning installing packages on rebuild:`, pkgErr);
      }
    }

    // 7. Update database status
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.ACTIVE,
        serverStatus: "RUNNING",
        ipAddress: ip,
        subdomain: subUrl,
        setupPackages: JSON.stringify(packagesToUse),
      },
    });

    console.log(`[Provisioner] Rebuild completed successfully for order ${orderId} (IP: ${ip}).`);
    return { success: true, ip };
  } catch (error: any) {
    console.error(`[Provisioner] Failed rebuilding container for order ${orderId}:`, error);
    return { success: false, error: error.message || "Gagal melakukan rebuild container." };
  }
}

