import { prisma } from "@/lib/prisma";
import { OrderStatus, TransactionType, TransactionStatus } from "@prisma/client";
import {
  DataSourceContract,
  User,
  Plan,
  Order,
  Transaction,
  Role,
  PaymentMethod,
} from "./types";

export const liveDataSource: DataSourceContract = {
  // Auth & User
  async getCurrentUser(role: Role): Promise<User | null> {
    const user = await prisma.user.findFirst({
      where: { role: role === "GUEST" ? undefined : role },
      orderBy: { createdAt: "asc" },
    });
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as Role,
      balance: user.balance,
      githubHandle: user.githubHandle || undefined,
      createdAt: user.createdAt.toISOString(),
    };
  },

  async getUserById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as Role,
      balance: user.balance,
      githubHandle: user.githubHandle || undefined,
      createdAt: user.createdAt.toISOString(),
    };
  },

  async getAllUsers(): Promise<User[]> {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    return users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role as Role,
      balance: u.balance,
      githubHandle: u.githubHandle || undefined,
      createdAt: u.createdAt.toISOString(),
    }));
  },

  async toggleUserSuspend(id: string): Promise<User> {
    const existing = await prisma.user.findUniqueOrThrow({ where: { id } });
    const updated = await prisma.user.update({
      where: { id },
      data: { suspended: !existing.suspended },
    });
    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role as Role,
      balance: updated.balance,
      githubHandle: updated.githubHandle || undefined,
      createdAt: updated.createdAt.toISOString(),
    };
  },

  // Plans (Katalog Matriks)
  async getPlans(): Promise<Plan[]> {
    const plans = await prisma.plan.findMany({
      where: { active: true },
      orderBy: { price: "asc" },
    });
    return plans.map((p) => ({
      id: p.id,
      name: p.name,
      durationDays: p.durationDays,
      ramMb: p.ramMb,
      cpuAllowance: p.cpuAllowance,
      storageGb: p.storageGb,
      price: p.price,
      active: p.active,
      tier: p.tier as "Starter" | "Basic" | "Pro",
    }));
  },

  async createPlan(planData: Omit<Plan, "id">): Promise<Plan> {
    const created = await prisma.plan.create({
      data: {
        name: planData.name,
        durationDays: planData.durationDays,
        ramMb: planData.ramMb,
        cpuAllowance: planData.cpuAllowance,
        storageGb: planData.storageGb,
        price: planData.price,
        active: planData.active,
        tier: planData.tier,
      },
    });
    return {
      id: created.id,
      name: created.name,
      durationDays: created.durationDays,
      ramMb: created.ramMb,
      cpuAllowance: created.cpuAllowance,
      storageGb: created.storageGb,
      price: created.price,
      active: created.active,
      tier: created.tier as "Starter" | "Basic" | "Pro",
    };
  },

  async updatePlan(id: string, planData: Partial<Plan>): Promise<Plan> {
    const updated = await prisma.plan.update({
      where: { id },
      data: { ...planData },
    });
    return {
      id: updated.id,
      name: updated.name,
      durationDays: updated.durationDays,
      ramMb: updated.ramMb,
      cpuAllowance: updated.cpuAllowance,
      storageGb: updated.storageGb,
      price: updated.price,
      active: updated.active,
      tier: updated.tier as "Starter" | "Basic" | "Pro",
    };
  },

  // Orders
  async getOrdersByUser(userId: string): Promise<Order[]> {
    const orders = await prisma.order.findMany({
      where: { userId },
      include: { plan: true, user: true },
      orderBy: { createdAt: "desc" },
    });
    return orders.map((o) => ({
      id: o.id,
      userId: o.userId,
      planId: o.planId,
      status: o.status as OrderStatus,
      serverStatus: o.serverStatus || "RUNNING",
      containerId: o.containerId || undefined,
      ipAddress: o.ipAddress || undefined,
      subdomain: o.subdomain || undefined,
      sshPassword: o.sshPassword || undefined,
      addon: o.addon,
      addonPrice: o.addonPrice,
      addonSuspended: o.addonSuspended,
      addonSuspendedAt: o.addonSuspendedAt?.toISOString(),
      startedAt: o.startedAt?.toISOString(),
      expiresAt: o.expiresAt?.toISOString(),
      createdAt: o.createdAt.toISOString(),
      setupPackages: o.setupPackages
        ? typeof o.setupPackages === "string"
          ? JSON.parse(o.setupPackages)
          : o.setupPackages
        : [],
      plan: o.plan
        ? {
            id: o.plan.id,
            name: o.plan.name,
            durationDays: o.plan.durationDays,
            ramMb: o.plan.ramMb,
            cpuAllowance: o.plan.cpuAllowance,
            storageGb: o.plan.storageGb,
            price: o.plan.price,
            active: o.plan.active,
            tier: o.plan.tier as "Micro" | "Starter" | "Basic" | "Pro",
          }
        : undefined,
      user: o.user
        ? {
            id: o.user.id,
            name: o.user.name,
            email: o.user.email,
            role: o.user.role as Role,
            balance: o.user.balance,
            createdAt: o.user.createdAt.toISOString(),
          }
        : undefined,
    }));
  },

  async getOrderDetail(orderId: string): Promise<Order | null> {
    const o = await prisma.order.findUnique({
      where: { id: orderId },
      include: { plan: true, user: true },
    });
    if (!o) return null;
    return {
      id: o.id,
      userId: o.userId,
      planId: o.planId,
      status: o.status as OrderStatus,
      serverStatus: o.serverStatus || "RUNNING",
      containerId: o.containerId || undefined,
      ipAddress: o.ipAddress || undefined,
      subdomain: o.subdomain || undefined,
      sshPassword: o.sshPassword || undefined,
      addon: o.addon,
      addonPrice: o.addonPrice,
      addonSuspended: o.addonSuspended,
      addonSuspendedAt: o.addonSuspendedAt?.toISOString(),
      startedAt: o.startedAt?.toISOString(),
      expiresAt: o.expiresAt?.toISOString(),
      createdAt: o.createdAt.toISOString(),
      setupPackages: o.setupPackages
        ? typeof o.setupPackages === "string"
          ? JSON.parse(o.setupPackages)
          : o.setupPackages
        : [],
      plan: o.plan
        ? {
            id: o.plan.id,
            name: o.plan.name,
            durationDays: o.plan.durationDays,
            ramMb: o.plan.ramMb,
            cpuAllowance: o.plan.cpuAllowance,
            storageGb: o.plan.storageGb,
            price: o.plan.price,
            active: o.plan.active,
            tier: o.plan.tier as "Micro" | "Starter" | "Basic" | "Pro",
          }
        : undefined,
    };
  },

  async getAllOrders(): Promise<Order[]> {
    const orders = await prisma.order.findMany({
      include: { plan: true, user: true },
      orderBy: { createdAt: "desc" },
    });
    return orders.map((o) => ({
      id: o.id,
      userId: o.userId,
      planId: o.planId,
      status: o.status as OrderStatus,
      containerId: o.containerId || undefined,
      ipAddress: o.ipAddress || undefined,
      subdomain: o.subdomain || undefined,
      sshPassword: o.sshPassword || undefined,
      addon: o.addon,
      addonPrice: o.addonPrice,
      addonSuspended: o.addonSuspended,
      addonSuspendedAt: o.addonSuspendedAt?.toISOString(),
      startedAt: o.startedAt?.toISOString(),
      expiresAt: o.expiresAt?.toISOString(),
      createdAt: o.createdAt.toISOString(),
      setupPackages: o.setupPackages
        ? typeof o.setupPackages === "string"
          ? JSON.parse(o.setupPackages)
          : o.setupPackages
        : [],
      plan: o.plan
        ? {
            id: o.plan.id,
            name: o.plan.name,
            durationDays: o.plan.durationDays,
            ramMb: o.plan.ramMb,
            cpuAllowance: o.plan.cpuAllowance,
            storageGb: o.plan.storageGb,
            price: o.plan.price,
            active: o.plan.active,
            tier: o.plan.tier as "Micro" | "Starter" | "Basic" | "Pro",
          }
        : undefined,
      user: o.user
        ? {
            id: o.user.id,
            name: o.user.name,
            email: o.user.email,
            role: o.user.role as Role,
            balance: o.user.balance,
            createdAt: o.user.createdAt.toISOString(),
          }
        : undefined,
    }));
  },

  async createOrder(
    userId: string,
    planId: string,
    paymentMethod: PaymentMethod,
    withAddon?: boolean,
    customSubdomain?: string,
    setupPackages?: string[]
  ): Promise<{ order: Order; transaction: Transaction }> {
    const plan = await prisma.plan.findUniqueOrThrow({ where: { id: planId } });
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

    const addonPrice = withAddon ? 3000 : 0;
    const totalAmount = plan.price + addonPrice;

    if (paymentMethod === "BALANCE" && user.balance < totalAmount) {
      throw new Error("Saldo tidak mencukupi untuk sewa server ini.");
    }

    if (paymentMethod === "BALANCE") {
      await prisma.user.update({
        where: { id: userId },
        data: { balance: { decrement: totalAmount } },
      });
    }

    const now = new Date();
    const expires = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
    const randomSub = `node-${Math.floor(100 + Math.random() * 900)}.rupacloud.id`;

    const newOrder = await prisma.order.create({
      data: {
        userId,
        planId,
        status: OrderStatus.ACTIVE,
        containerId: `lxd-cont-${Math.floor(1000 + Math.random() * 9000)}`,
        ipAddress: `103.147.22.${Math.floor(10 + Math.random() * 200)}`,
        subdomain: randomSub,
        addon: withAddon ?? false,
        addonPrice,
        setupPackages: setupPackages && setupPackages.length > 0 ? JSON.stringify(setupPackages) : null,
        startedAt: now,
        expiresAt: expires,
      },
      include: { plan: true },
    });

    const newTx = await prisma.transaction.create({
      data: {
        userId,
        type: TransactionType.RENTAL,
        amount: totalAmount,
        method: paymentMethod,
        status: TransactionStatus.SUCCESS,
        orderId: newOrder.id,
      },
    });

    return {
      order: {
        id: newOrder.id,
        userId: newOrder.userId,
        planId: newOrder.planId,
        status: newOrder.status as OrderStatus,
        containerId: newOrder.containerId || undefined,
        ipAddress: newOrder.ipAddress || undefined,
        subdomain: newOrder.subdomain || undefined,
        addon: newOrder.addon,
        addonPrice: newOrder.addonPrice,
        startedAt: newOrder.startedAt?.toISOString(),
        expiresAt: newOrder.expiresAt?.toISOString(),
        createdAt: newOrder.createdAt.toISOString(),
        plan: {
          id: newOrder.plan.id,
          name: newOrder.plan.name,
          durationDays: newOrder.plan.durationDays,
          ramMb: newOrder.plan.ramMb,
          cpuAllowance: newOrder.plan.cpuAllowance,
          storageGb: newOrder.plan.storageGb,
          price: newOrder.plan.price,
          active: newOrder.plan.active,
          tier: newOrder.plan.tier as "Micro" | "Starter" | "Basic" | "Pro",
        },
      },
      transaction: {
        id: newTx.id,
        userId: newTx.userId,
        type: newTx.type as TransactionType,
        amount: newTx.amount,
        method: newTx.method as PaymentMethod,
        status: newTx.status as TransactionStatus,
        orderId: newTx.orderId || undefined,
        createdAt: newTx.createdAt.toISOString(),
      },
    };
  },

  async extendOrder(
    orderId: string,
    days: number,
    paymentMethod: PaymentMethod
  ): Promise<Order> {
    const order = await prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { plan: true },
    });
    const pricePerDay = Math.round(order.plan.price / order.plan.durationDays);
    const totalPrice = pricePerDay * days;

    if (paymentMethod === "BALANCE") {
      const user = await prisma.user.findUniqueOrThrow({ where: { id: order.userId } });
      if (user.balance < totalPrice) {
        throw new Error("Saldo tidak mencukupi untuk perpanjangan ini.");
      }
      await prisma.user.update({
        where: { id: order.userId },
        data: { balance: { decrement: totalPrice } },
      });
    }

    const currentExpires = order.expiresAt ? new Date(order.expiresAt) : new Date();
    const newExpires = new Date(currentExpires.getTime() + days * 24 * 60 * 60 * 1000);

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        expiresAt: newExpires,
        status: OrderStatus.ACTIVE,
      },
      include: { plan: true },
    });

    await prisma.transaction.create({
      data: {
        userId: order.userId,
        type: TransactionType.EXTEND,
        amount: totalPrice,
        method: paymentMethod,
        status: TransactionStatus.SUCCESS,
        orderId,
      },
    });

    return {
      id: updated.id,
      userId: updated.userId,
      planId: updated.planId,
      status: updated.status as OrderStatus,
      containerId: updated.containerId || undefined,
      ipAddress: updated.ipAddress || undefined,
      subdomain: updated.subdomain || undefined,
      addon: updated.addon,
      addonPrice: updated.addonPrice,
      startedAt: updated.startedAt?.toISOString(),
      expiresAt: updated.expiresAt?.toISOString(),
      createdAt: updated.createdAt.toISOString(),
    };
  },

  // Transactions
  async getTransactionsByUser(userId: string): Promise<Transaction[]> {
    const txs = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return txs.map((t) => ({
      id: t.id,
      userId: t.userId,
      type: t.type as TransactionType,
      amount: t.amount,
      method: t.method as PaymentMethod,
      status: t.status as TransactionStatus,
      orderId: t.orderId || undefined,
      gatewayRef: t.gatewayRef || undefined,
      createdAt: t.createdAt.toISOString(),
    }));
  },

  async getAllTransactions(): Promise<Transaction[]> {
    const txs = await prisma.transaction.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });
    return txs.map((t) => ({
      id: t.id,
      userId: t.userId,
      type: t.type as TransactionType,
      amount: t.amount,
      method: t.method as PaymentMethod,
      status: t.status as TransactionStatus,
      orderId: t.orderId || undefined,
      gatewayRef: t.gatewayRef || undefined,
      createdAt: t.createdAt.toISOString(),
    }));
  },

  async topUpBalance(
    userId: string,
    amount: number,
    method: PaymentMethod
  ): Promise<Transaction> {
    await prisma.user.update({
      where: { id: userId },
      data: { balance: { increment: amount } },
    });

    const tx = await prisma.transaction.create({
      data: {
        userId,
        type: TransactionType.TOPUP,
        amount,
        method,
        status: TransactionStatus.SUCCESS,
        gatewayRef: `TOPUP-${Date.now()}`,
      },
    });

    return {
      id: tx.id,
      userId: tx.userId,
      type: tx.type as TransactionType,
      amount: tx.amount,
      method: tx.method as PaymentMethod,
      status: tx.status as TransactionStatus,
      createdAt: tx.createdAt.toISOString(),
    };
  },

  // AppConfig
  async getAppConfig(key: string): Promise<string> {
    const cfg = await prisma.appConfig.findUnique({ where: { key } });
    return cfg?.value || "";
  },

  async updateAppConfig(key: string, value: string): Promise<string> {
    const updated = await prisma.appConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
    return updated.value;
  },

  // Tutorial Preferences
  async getTutorialPref(userId: string, pageKey: string): Promise<boolean> {
    const pref = await prisma.tutorialPref.findUnique({
      where: { userId_pageKey: { userId, pageKey } },
    });
    return pref?.dismissed ?? false;
  },

  async dismissTutorial(userId: string, pageKey: string): Promise<void> {
    await prisma.tutorialPref.upsert({
      where: { userId_pageKey: { userId, pageKey } },
      update: { dismissed: true },
      create: { userId, pageKey, dismissed: true },
    });
  },
};
