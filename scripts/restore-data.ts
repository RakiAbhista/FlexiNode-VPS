import { PrismaClient, Role, OrderStatus, TransactionType, PaymentMethod, TransactionStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Restoring user accounts, active orders, and transactions...");

  const customerPasswordHash = "$2b$10$9ioFOYzTsJLcT.iYxzadaechxPDqlBFwg5OADmwAhQhKpgADbtSIm"; // Password123!

  // 1. Ensure Plans exist
  const planMicro3 = await prisma.plan.upsert({
    where: { id: "plan-micro-3d" },
    update: {},
    create: {
      id: "plan-micro-3d",
      name: "Micro VPS 3 Hari",
      durationDays: 3,
      ramMb: 512,
      cpuAllowance: 50,
      storageGb: 5,
      price: 9000,
      tier: "Micro",
      active: true,
    },
  });

  // 2. Restore Main User: Alfin Rozzaq Nirwana (Polines)
  const mainUser = await prisma.user.upsert({
    where: { id: "7832e546-99c9-406c-98c5-6ecd2262240f" },
    update: {
      email: "alfin.43324005@mhs.polines.ac.id",
      name: "Alfin Rozzaq Nirwana",
      role: Role.CUSTOMER,
      balance: 100000,
      githubHandle: "Algaray02",
      passwordHash: customerPasswordHash,
      emailVerified: true,
      suspended: false,
    },
    create: {
      id: "7832e546-99c9-406c-98c5-6ecd2262240f",
      email: "alfin.43324005@mhs.polines.ac.id",
      name: "Alfin Rozzaq Nirwana",
      role: Role.CUSTOMER,
      balance: 100000,
      githubHandle: "Algaray02",
      passwordHash: customerPasswordHash,
      emailVerified: true,
      suspended: false,
    },
  });
  console.log("✅ Main user restored:", mainUser.email, mainUser.id);

  // 3. Restore Secondary Users
  await prisma.user.upsert({
    where: { email: "alfin.rozzaq.270206@gmail.com" },
    update: {},
    create: {
      id: "e8056d42-766e-4714-927e-f8a182798e42",
      email: "alfin.rozzaq.270206@gmail.com",
      name: "Alfin Rozzaq Nirwana",
      role: Role.CUSTOMER,
      balance: 50000,
      passwordHash: customerPasswordHash,
      emailVerified: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "alfin@gmail.com" },
    update: {},
    create: {
      id: "47b96680-dbe2-47e6-9f15-4ad01c3a34f5",
      email: "alfin@gmail.com",
      name: "Alfin Rozzaq N",
      role: Role.CUSTOMER,
      balance: 50000,
      passwordHash: customerPasswordHash,
      emailVerified: true,
    },
  });
  console.log("✅ Secondary users verified/restored.");

  // 4. Restore Active Order for Container rupa-cf898b97
  const order = await prisma.order.upsert({
    where: { id: "cf898b97-d409-4c4b-b24c-1d9d240bf40b" },
    update: {
      userId: mainUser.id,
      planId: planMicro3.id,
      status: OrderStatus.ACTIVE,
      serverStatus: "RUNNING",
      containerId: "rupa-cf898b97",
      ipAddress: "10.78.126.106",
      subdomain: "rupa-cf898b97.rupacloud.id",
      sshPassword: "rc-u51zw8za",
      addon: true,
      addonPrice: 3000,
      addonSuspended: false,
      setupPackages: JSON.stringify(["nodejs", "git_tools"]),
      startedAt: new Date("2026-10-08T01:22:25.307Z"),
      expiresAt: new Date("2026-11-01T00:00:00.000Z"),
    },
    create: {
      id: "cf898b97-d409-4c4b-b24c-1d9d240bf40b",
      userId: mainUser.id,
      planId: planMicro3.id,
      status: OrderStatus.ACTIVE,
      serverStatus: "RUNNING",
      containerId: "rupa-cf898b97",
      ipAddress: "10.78.126.106",
      subdomain: "rupa-cf898b97.rupacloud.id",
      sshPassword: "rc-u51zw8za",
      addon: true,
      addonPrice: 3000,
      addonSuspended: false,
      setupPackages: JSON.stringify(["nodejs", "git_tools"]),
      startedAt: new Date("2026-10-08T01:22:25.307Z"),
      expiresAt: new Date("2026-11-01T00:00:00.000Z"),
      createdAt: new Date("2026-10-08T01:22:26.378Z"),
    },
  });
  console.log("✅ Active order restored:", order.id, "container:", order.containerId);

  // 5. Restore Subdomain DNS AppConfig
  await prisma.appConfig.upsert({
    where: { key: `subdomain:rupa-cf898b97` },
    create: {
      key: `subdomain:rupa-cf898b97`,
      value: JSON.stringify({
        subdomain: "rupa-cf898b97.rupacloud.id",
        ip: "10.78.126.106",
        createdAt: "2026-10-08T01:22:25.307Z",
      }),
    },
    update: {
      value: JSON.stringify({
        subdomain: "rupa-cf898b97.rupacloud.id",
        ip: "10.78.126.106",
        updatedAt: new Date().toISOString(),
      }),
    },
  });
  console.log("✅ Subdomain AppConfig restored.");

  // 6. Restore Transactions
  await prisma.transaction.upsert({
    where: { id: "tx-alfin-topup-1" },
    update: {},
    create: {
      id: "tx-alfin-topup-1",
      userId: mainUser.id,
      type: TransactionType.TOPUP,
      amount: 100000,
      method: PaymentMethod.GATEWAY,
      status: TransactionStatus.SUCCESS,
      gatewayRef: "QRIS-RESTORED-101",
    },
  });

  await prisma.transaction.upsert({
    where: { id: "tx-alfin-order-1" },
    update: {},
    create: {
      id: "tx-alfin-order-1",
      userId: mainUser.id,
      type: TransactionType.RENTAL,
      amount: 12000,
      method: PaymentMethod.BALANCE,
      status: TransactionStatus.SUCCESS,
      orderId: order.id,
    },
  });
  console.log("✅ Billing transactions restored.");

  console.log("🎉 ALL DATA RESTORATION COMPLETE!");
}

main()
  .catch((e) => {
    console.error("❌ Restore error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
