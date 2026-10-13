/**
 * clientDataSource — implementasi DataSourceContract yang aman digunakan
 * di browser ("use client" components). Semua operasi proxy ke API routes.
 *
 * TIDAK BOLEH mengimport prisma atau server-only packages.
 */
import type {
  DataSourceContract,
  Role,
  User,
  Plan,
  Order,
  Transaction,
  PaymentMethod,
} from "./types";

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `API ${url} failed with ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const clientDataSource: DataSourceContract = {
  // ── Auth & User ────────────────────────────────────────────────────────────
  async getCurrentUser(_role: Role): Promise<User | null> {
    try {
      const data = await apiFetch<{ user: User }>("/api/user/profile");
      return data.user ?? null;
    } catch {
      return null;
    }
  },

  async getUserById(id: string): Promise<User | null> {
    try {
      const data = await apiFetch<{ user: User }>(`/api/user/profile?id=${id}`);
      return data.user ?? null;
    } catch {
      return null;
    }
  },

  async getAllUsers(): Promise<User[]> {
    const data = await apiFetch<{ customers: User[] }>("/api/admin/customers");
    return data.customers ?? [];
  },

  async toggleUserSuspend(id: string): Promise<User> {
    const data = await apiFetch<{ user: User }>(`/api/admin/customers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle_suspend" }),
    });
    return data.user;
  },

  // ── Plans ──────────────────────────────────────────────────────────────────
  async getPlans(): Promise<Plan[]> {
    const data = await apiFetch<{ plans: Plan[] }>("/api/plans"); // public endpoint
    return data.plans ?? [];
  },

  async createPlan(plan: Omit<Plan, "id">): Promise<Plan> {
    const data = await apiFetch<{ plan: Plan }>("/api/admin/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(plan),
    });
    return data.plan;
  },

  async updatePlan(id: string, plan: Partial<Plan>): Promise<Plan> {
    const data = await apiFetch<{ plan: Plan }>(`/api/admin/plans/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(plan),
    });
    return data.plan;
  },

  // ── Orders ─────────────────────────────────────────────────────────────────
  async getOrdersByUser(_userId: string): Promise<Order[]> {
    const data = await apiFetch<{ orders: Order[] }>("/api/customer/orders");
    return data.orders ?? [];
  },

  async getOrderDetail(orderId: string): Promise<Order | null> {
    try {
      const data = await apiFetch<{ order: Order }>(`/api/customer/orders/${orderId}`);
      return data.order ?? null;
    } catch {
      return null;
    }
  },

  async getAllOrders(): Promise<Order[]> {
    const data = await apiFetch<{ orders: Order[] }>("/api/admin/orders");
    return data.orders ?? [];
  },

  async createOrder(
    _userId: string,
    planId: string,
    paymentMethod: PaymentMethod,
    withAddon?: boolean,
    customSubdomain?: string,
    setupPackages?: string[]
  ): Promise<{ order: Order; transaction: Transaction }> {
    const data = await apiFetch<{ order: Order; transaction: Transaction; transactionId: string }>(
      "/api/customer/orders/create",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          paymentMethod,
          withAddon: withAddon ?? false,
          customSubdomain: customSubdomain?.trim() || undefined,
          setupPackages: setupPackages && setupPackages.length > 0 ? setupPackages : undefined,
        }),
      }
    );
    return data;
  },

  async extendOrder(
    orderId: string,
    days: number,
    paymentMethod: PaymentMethod
  ): Promise<Order> {
    const data = await apiFetch<{ order: Order }>(
      `/api/customer/orders/${orderId}/extend`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days, paymentMethod }),
      }
    );
    return data.order;
  },

  // ── Transactions ───────────────────────────────────────────────────────────
  async getTransactionsByUser(_userId: string): Promise<Transaction[]> {
    const data = await apiFetch<{ transactions: Transaction[] }>("/api/customer/transactions");
    return data.transactions ?? [];
  },

  async getAllTransactions(): Promise<Transaction[]> {
    const data = await apiFetch<{ transactions: Transaction[] }>("/api/admin/transactions");
    return data.transactions ?? [];
  },

  async topUpBalance(
    _userId: string,
    amount: number,
    method: PaymentMethod
  ): Promise<Transaction> {
    const data = await apiFetch<{ transaction: Transaction }>("/api/customer/topup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, method }),
    });
    return data.transaction;
  },

  // ── AppConfig ──────────────────────────────────────────────────────────────
  async getAppConfig(key: string): Promise<string> {
    try {
      const data = await apiFetch<{ configs: Record<string, string> }>("/api/admin/config");
      return data.configs?.[key] ?? "";
    } catch {
      return "";
    }
  },

  async updateAppConfig(key: string, value: string): Promise<string> {
    await apiFetch("/api/admin/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
    return value;
  },

  // ── Tutorial Preferences ───────────────────────────────────────────────────
  async getTutorialPref(_userId: string, pageKey: string): Promise<boolean> {
    try {
      const data = await apiFetch<{ dismissed: boolean }>(
        `/api/customer/preferences?pageKey=${pageKey}`
      );
      return data.dismissed ?? false;
    } catch {
      return false;
    }
  },

  async dismissTutorial(_userId: string, pageKey: string): Promise<void> {
    await apiFetch("/api/customer/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageKey, dismissed: true }),
    }).catch(() => {});
  },
};
