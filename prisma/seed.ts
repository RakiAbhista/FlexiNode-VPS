import { PrismaClient, Role, OrderStatus, TransactionType, PaymentMethod, TransactionStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding for RuPa Cloud...");

  // 1. Safe seeding without deleting production / user data
  console.log("ℹ️ Checking and seeding initial plans, admin, and configs safely (upsert)...");

  // Fixed password hash for testing (Password123! for customers, Admin123! for admin)
  const customerPasswordHash = "$2b$10$9ioFOYzTsJLcT.iYxzadaechxPDqlBFwg5OADmwAhQhKpgADbtSIm";
  const adminPasswordHash = "$2b$10$5IIIYlE6g1M3jy1FTzunNufgR1Iqd4iNmJIY3aSLnPio3z386iq0K";

  // 2. Seed Admin User (1 Admin)
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@rupacloud.id" },
    update: {},
    create: {
      id: "usr_admin_master",
      name: "Master Admin RuPa Cloud",
      email: "admin@rupacloud.id",
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      balance: 1000000,
      suspended: false,
    },
  });

  // 3. Seed Demo Customer User
  const customer1 = await prisma.user.upsert({
    where: { email: "budi@student.univ.ac.id" },
    update: {},
    create: {
      id: "usr_cust_1",
      name: "Budi Santoso (Student)",
      email: "budi@student.univ.ac.id",
      passwordHash: customerPasswordHash,
      role: Role.CUSTOMER,
      balance: 50000,
      githubHandle: "budisantoso-dev",
    },
  });

  // 4. Seed Plans (Sesuai dengan Micro VPS)
  const planMicro1 = await prisma.plan.upsert({
    where: { id: "plan-micro-1d" },
    update: {},
    create: {
      id: "plan-micro-1d",
      name: "Micro VPS 1 Hari",
      durationDays: 1,
      ramMb: 512,
      cpuAllowance: 50,
      storageGb: 5,
      price: 3500,
      tier: "Micro",
      active: true,
    },
  });

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

  const planMicro7 = await prisma.plan.upsert({
    where: { id: "plan-micro-7d" },
    update: {},
    create: {
      id: "plan-micro-7d",
      name: "Micro VPS 7 Hari",
      durationDays: 7,
      ramMb: 512,
      cpuAllowance: 50,
      storageGb: 5,
      price: 18000,
      tier: "Micro",
      active: true,
    },
  });

  // 5. Seed App Configuration
  const configs = [
    { key: "maintenance_mode", value: "false" },
    { key: "announcement_banner", value: "Selamat Datang di RuPa Cloud - Platform Sewa VPS Mikro Harian!" },
    { key: "default_quota_per_user", value: "5" },
  ];

  for (const cfg of configs) {
    await prisma.appConfig.upsert({
      where: { key: cfg.key },
      update: {},
      create: cfg,
    });
  }

  console.log("🎉 Database seeding completed safely without data loss!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
