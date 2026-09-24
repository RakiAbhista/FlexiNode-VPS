import {
  DataSourceContract,
  User,
  Plan,
  Order,
  Transaction,
  Role,
  PaymentMethod,
} from "../types";

// Mock Database State
const mockUsers: User[] = [
  {
    id: "usr_cust_1",
    name: "Budi Pratama",
    email: "budi@mahasiswa.ac.id",
    role: "CUSTOMER",
    balance: 35000,
    githubHandle: "budipratama",
    createdAt: "2026-09-01T10:00:00Z",
  },
  {
    id: "usr_cust_2",
    name: "Siti Rahma",
    email: "siti@dev.id",
    role: "CUSTOMER",
    balance: 5000,
    githubHandle: "sitirahma",
    createdAt: "2026-09-15T14:30:00Z",
  },
  {
    id: "usr_admin_1",
    name: "Admin RuPa Cloud",
    email: "admin@rupacloud.id",
    role: "ADMIN",
    balance: 0,
    createdAt: "2026-08-01T08:00:00Z",
  },
];

// Matrix Plans: Durasi (1, 3, 7 hari) x Resource Size (Starter, Basic, Pro)
const mockPlans: Plan[] = [
  // 1 Hari
  {
    id: "plan_1d_starter",
    name: "1 Hari — Starter",
    durationDays: 1,
    ramMb: 512,
    cpuAllowance: 50,
    storageGb: 5,
    price: 3500,
    active: true,
    tier: "Starter",
  },
  {
    id: "plan_1d_basic",
    name: "1 Hari — Basic",
    durationDays: 1,
    ramMb: 1024,
    cpuAllowance: 100,
    storageGb: 10,
    price: 6000,
    active: true,
    tier: "Basic",
  },
  {
    id: "plan_1d_pro",
    name: "1 Hari — Pro",
    durationDays: 1,
    ramMb: 2048,
    cpuAllowance: 200,
    storageGb: 20,
    price: 10000,
    active: true,
    tier: "Pro",
  },

  // 3 Hari
  {
    id: "plan_3d_starter",
    name: "3 Hari — Starter",
    durationDays: 3,
    ramMb: 512,
    cpuAllowance: 50,
    storageGb: 5,
    price: 9000,
    active: true,
    tier: "Starter",
  },
  {
    id: "plan_3d_basic",
    name: "3 Hari — Basic",
    durationDays: 3,
    ramMb: 1024,
    cpuAllowance: 100,
    storageGb: 10,
    price: 15000,
    active: true,
    tier: "Basic",
  },
  {
    id: "plan_3d_pro",
    name: "3 Hari — Pro",
    durationDays: 3,
    ramMb: 2048,
    cpuAllowance: 200,
    storageGb: 20,
    price: 25000,
    active: true,
    tier: "Pro",
  },

  // 1 Minggu (7 Hari)
  {
    id: "plan_7d_starter",
    name: "1 Minggu — Starter",
    durationDays: 7,
    ramMb: 512,
    cpuAllowance: 50,
    storageGb: 5,
    price: 18000,
    active: true,
    tier: "Starter",
  },
  {
    id: "plan_7d_basic",
    name: "1 Minggu — Basic",
    durationDays: 7,
    ramMb: 1024,
    cpuAllowance: 100,
    storageGb: 10,
    price: 32000,
    active: true,
    tier: "Basic",
  },
  {
    id: "plan_7d_pro",
    name: "1 Minggu — Pro",
    durationDays: 7,
    ramMb: 2048,
    cpuAllowance: 200,
    storageGb: 20,
    price: 50000,
    active: true,
    tier: "Pro",
  },
];

const mockOrders: Order[] = [
  {
    id: "ord_101",
    userId: "usr_cust_1",
    planId: "plan_3d_basic",
    status: "ACTIVE",
    containerId: "cnt_lxd_9921",
    ipAddress: "103.152.118.42",
    subdomain: "budi-bot.rupacloud.id",
    startedAt: "2026-09-24T00:00:00Z",
    expiresAt: "2026-09-27T00:00:00Z",
    createdAt: "2026-09-23T23:55:00Z",
  },
  {
    id: "ord_102",
    userId: "usr_cust_1",
    planId: "plan_1d_starter",
    status: "EXPIRING_SOON",
    containerId: "cnt_lxd_9925",
    ipAddress: "103.152.118.49",
    subdomain: "demo-ctf.rupacloud.id",
    startedAt: "2026-09-23T18:00:00Z",
    expiresAt: "2026-09-24T18:00:00Z",
    createdAt: "2026-09-23T17:50:00Z",
  },
  {
    id: "ord_103",
    userId: "usr_cust_1",
    planId: "plan_1d_starter",
    status: "EXPIRED",
    containerId: "cnt_lxd_9811",
    ipAddress: "103.152.118.12",
    subdomain: "test-node.rupacloud.id",
    startedAt: "2026-09-20T08:00:00Z",
    expiresAt: "2026-09-21T08:00:00Z",
    createdAt: "2026-09-20T07:55:00Z",
  },
];

const mockTransactions: Transaction[] = [
  {
    id: "trx_topup_500",
    userId: "usr_cust_1",
    type: "TOPUP",
    amount: 50000,
    method: "GATEWAY",
    status: "SUCCESS",
    gatewayRef: "QRIS_9918231",
    createdAt: "2026-09-22T10:00:00Z",
  },
  {
    id: "trx_rent_101",
    userId: "usr_cust_1",
    type: "RENTAL",
    amount: 15000,
    method: "BALANCE",
    status: "SUCCESS",
    orderId: "ord_101",
    createdAt: "2026-09-23T23:55:00Z",
  },
  {
    id: "trx_rent_102",
    userId: "usr_cust_1",
    type: "RENTAL",
    amount: 3500,
    method: "BALANCE",
    status: "SUCCESS",
    orderId: "ord_102",
    createdAt: "2026-09-23T17:50:00Z",
  },
];

const mockAppConfig: Record<string, string> = {
  min_topup: "10000",
};

const mockTutorialPrefs: Record<string, boolean> = {};

const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockDataSource: DataSourceContract = {
  async getCurrentUser(role: Role): Promise<User | null> {
    await delay();
    if (role === "GUEST") return null;
    return mockUsers.find((u) => u.role === role) || mockUsers[0];
  },

  async getUserById(id: string): Promise<User | null> {
    await delay();
    return mockUsers.find((u) => u.id === id) || null;
  },

  async getAllUsers(): Promise<User[]> {
    await delay();
    return [...mockUsers];
  },

  async toggleUserSuspend(id: string): Promise<User> {
    await delay();
    const user = mockUsers.find((u) => u.id === id);
    if (!user) throw new Error("User tidak ditemukan");
    return user;
  },

  async getPlans(): Promise<Plan[]> {
    await delay();
    return mockPlans.filter((p) => p.active);
  },

  async createPlan(planData: Omit<Plan, "id">): Promise<Plan> {
    await delay();
    const newPlan: Plan = {
      ...planData,
      id: `plan_${Date.now()}`,
    };
    mockPlans.push(newPlan);
    return newPlan;
  },

  async updatePlan(id: string, planData: Partial<Plan>): Promise<Plan> {
    await delay();
    const index = mockPlans.findIndex((p) => p.id === id);
    if (index === -1) throw new Error("Plan tidak ditemukan");
    mockPlans[index] = { ...mockPlans[index], ...planData };
    return mockPlans[index];
  },

  async getOrdersByUser(userId: string): Promise<Order[]> {
    await delay();
    const orders = mockOrders.filter((o) => o.userId === userId);
    return orders.map((o) => ({
      ...o,
      plan: mockPlans.find((p) => p.id === o.planId),
    }));
  },

  async getOrderDetail(orderId: string): Promise<Order | null> {
    await delay();
    const order = mockOrders.find((o) => o.id === orderId);
    if (!order) return null;
    return {
      ...order,
      plan: mockPlans.find((p) => p.id === order.planId),
      user: mockUsers.find((u) => u.id === order.userId),
    };
  },

  async getAllOrders(): Promise<Order[]> {
    await delay();
    return mockOrders.map((o) => ({
      ...o,
      plan: mockPlans.find((p) => p.id === o.planId),
      user: mockUsers.find((u) => u.id === o.userId),
    }));
  },

  async createOrder(
    userId: string,
    planId: string,
    paymentMethod: PaymentMethod
  ): Promise<{ order: Order; transaction: Transaction }> {
    await delay();
    const user = mockUsers.find((u) => u.id === userId);
    const plan = mockPlans.find((p) => p.id === planId);
    if (!user || !plan) throw new Error("User atau Plan tidak valid");

    if (paymentMethod === "BALANCE" && user.balance < plan.price) {
      throw new Error("Saldo tidak cukup");
    }

    if (paymentMethod === "BALANCE") {
      user.balance -= plan.price;
    }

    const now = new Date();
    const expires = new Date();
    expires.setDate(now.getDate() + plan.durationDays);

    const newOrder: Order = {
      id: `ord_${Date.now()}`,
      userId,
      planId,
      status: "ACTIVE",
      containerId: `cnt_lxd_${Math.floor(1000 + Math.random() * 9000)}`,
      ipAddress: `103.152.118.${Math.floor(10 + Math.random() * 90)}`,
      subdomain: `server-${Math.floor(100 + Math.random() * 900)}.rupacloud.id`,
      startedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      createdAt: now.toISOString(),
      plan,
      user,
    };

    const newTrx: Transaction = {
      id: `trx_${Date.now()}`,
      userId,
      type: "RENTAL",
      amount: plan.price,
      method: paymentMethod,
      status: "SUCCESS",
      orderId: newOrder.id,
      createdAt: now.toISOString(),
      order: newOrder,
    };

    mockOrders.unshift(newOrder);
    mockTransactions.unshift(newTrx);

    return { order: newOrder, transaction: newTrx };
  },

  async extendOrder(
    orderId: string,
    days: number,
    paymentMethod: PaymentMethod
  ): Promise<Order> {
    await delay();
    const order = mockOrders.find((o) => o.id === orderId);
    if (!order) throw new Error("Order tidak ditemukan");
    const user = mockUsers.find((u) => u.id === order.userId);
    const plan = mockPlans.find((p) => p.id === order.planId);
    if (!user || !plan) throw new Error("Order tidak valid");

    const extensionPrice = (plan.price / plan.durationDays) * days;
    if (paymentMethod === "BALANCE" && user.balance < extensionPrice) {
      throw new Error("Saldo tidak cukup untuk perpanjang");
    }

    if (paymentMethod === "BALANCE") {
      user.balance -= extensionPrice;
    }

    const currentExpiry = new Date(order.expiresAt || new Date());
    currentExpiry.setDate(currentExpiry.getDate() + days);
    order.expiresAt = currentExpiry.toISOString();
    order.status = "ACTIVE";

    const newTrx: Transaction = {
      id: `trx_${Date.now()}`,
      userId: user.id,
      type: "EXTEND",
      amount: extensionPrice,
      method: paymentMethod,
      status: "SUCCESS",
      orderId: order.id,
      createdAt: new Date().toISOString(),
      order,
    };
    mockTransactions.unshift(newTrx);

    return { ...order, plan };
  },

  async getTransactionsByUser(userId: string): Promise<Transaction[]> {
    await delay();
    const list = mockTransactions.filter((t) => t.userId === userId);
    return list.map((t) => ({
      ...t,
      order: mockOrders.find((o) => o.id === t.orderId),
    }));
  },

  async getAllTransactions(): Promise<Transaction[]> {
    await delay();
    return mockTransactions.map((t) => ({
      ...t,
      order: mockOrders.find((o) => o.id === t.orderId),
      user: mockUsers.find((u) => u.id === t.userId),
    }));
  },

  async topUpBalance(
    userId: string,
    amount: number,
    method: PaymentMethod
  ): Promise<Transaction> {
    await delay();
    const user = mockUsers.find((u) => u.id === userId);
    if (!user) throw new Error("User tidak ditemukan");

    user.balance += amount;

    const newTrx: Transaction = {
      id: `trx_topup_${Date.now()}`,
      userId,
      type: "TOPUP",
      amount,
      method,
      status: "SUCCESS",
      gatewayRef: `QRIS_${Math.floor(1000000 + Math.random() * 9000000)}`,
      createdAt: new Date().toISOString(),
    };

    mockTransactions.unshift(newTrx);
    return newTrx;
  },

  async getAppConfig(key: string): Promise<string> {
    await delay();
    return mockAppConfig[key] || "10000";
  },

  async updateAppConfig(key: string, value: string): Promise<string> {
    await delay();
    mockAppConfig[key] = value;
    return value;
  },

  async getTutorialPref(userId: string, pageKey: string): Promise<boolean> {
    await delay();
    return !!mockTutorialPrefs[`${userId}_${pageKey}`];
  },

  async dismissTutorial(userId: string, pageKey: string): Promise<void> {
    await delay();
    mockTutorialPrefs[`${userId}_${pageKey}`] = true;
  },
};
