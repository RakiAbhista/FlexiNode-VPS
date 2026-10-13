// Mock subdomain provisioner.
// Saat ini hanya menyimpan mapping ke AppConfig (sebagai "DNS lokal").
// Ganti implementasi dengan Cloudflare API / cPanel API ketika domain sudah siap.
//
// ponytail: mock DNS, replace dengan Cloudflare API (POST /zones/:id/dns_records)
// ketika domain sudah aktif.

import { prisma } from '@/lib/prisma';

const ADDON_PRICE = 3000; // Rp 3.000 flat untuk semua durasi

export { ADDON_PRICE };

export const subdomain = {
  /**
   * Buat subdomain mock. Format: {containerName}.rupacloud.id
   * Simpan mapping di AppConfig dengan key "subdomain:{name}"
   */
  async provision(containerName: string, ipAddress: string): Promise<string> {
    const sub = `${containerName}.rupacloud.id`;

    // Simpan sebagai mock DNS record di AppConfig
    await prisma.appConfig.upsert({
      where: { key: `subdomain:${containerName}` },
      create: {
        key: `subdomain:${containerName}`,
        value: JSON.stringify({ subdomain: sub, ip: ipAddress, createdAt: new Date().toISOString() }),
      },
      update: {
        value: JSON.stringify({ subdomain: sub, ip: ipAddress, updatedAt: new Date().toISOString() }),
      },
    });

    return sub;
  },

  /**
   * Suspend subdomain (tandai status SUSPENDED pada DNS/reverse proxy)
   */
  async suspend(containerName: string) {
    const key = `subdomain:${containerName}`;
    const existing = await prisma.appConfig.findUnique({ where: { key } });
    if (existing) {
      try {
        const data = JSON.parse(existing.value);
        await prisma.appConfig.update({
          where: { key },
          data: {
            value: JSON.stringify({
              ...data,
              status: "SUSPENDED",
              suspendedAt: new Date().toISOString(),
            }),
          },
        });
      } catch {
        // Abaikan jika format json error
      }
    }
  },

  /**
   * Reaktifkan subdomain yang sempat disuspend
   */
  async reactivate(containerName: string, ipAddress: string): Promise<string> {
    const sub = `${containerName}.rupacloud.id`;
    await prisma.appConfig.upsert({
      where: { key: `subdomain:${containerName}` },
      create: {
        key: `subdomain:${containerName}`,
        value: JSON.stringify({ subdomain: sub, ip: ipAddress, status: "ACTIVE", updatedAt: new Date().toISOString() }),
      },
      update: {
        value: JSON.stringify({ subdomain: sub, ip: ipAddress, status: "ACTIVE", updatedAt: new Date().toISOString() }),
      },
    });
    return sub;
  },

  /**
   * Hapus subdomain mock ketika order dihapus / grace period lewat
   */
  async deprovision(containerName: string) {
    await prisma.appConfig.deleteMany({
      where: { key: `subdomain:${containerName}` },
    });
  },

  /**
   * List semua subdomain aktif (untuk keperluan admin / debug)
   */
  async listAll() {
    const records = await prisma.appConfig.findMany({
      where: { key: { startsWith: 'subdomain:' } },
    });
    return records.map(r => JSON.parse(r.value));
  }
};
