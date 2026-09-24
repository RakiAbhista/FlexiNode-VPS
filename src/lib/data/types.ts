export type Role = "GUEST" | "CUSTOMER" | "ADMIN";

export type OrderStatus =
  | "PENDING"
  | "PROVISIONING"
  | "ACTIVE"
  | "EXPIRING_SOON"
  | "EXPIRED"
  | "FAILED";

export type TransactionType = "TOPUP" | "RENTAL" | "EXTEND";
export type PaymentMethod = "BALANCE" | "GATEWAY";
export type TransactionStatus = "PENDING" | "SUCCESS" | "FAILED";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  balance: number;
  githubHandle?: string;
  createdAt: string;
}

export interface TutorialPref {
  id: string;
  userId: string;
  pageKey: string;
  dismissed: boolean;
}

export interface Plan {
  id: string;
  name: string;
  durationDays: number;
  ramMb: number;
  cpuAllowance: number;
  storageGb: number;
  price: number;
  active: boolean;
  tier: "Starter" | "Basic" | "Pro";
}

export interface Order {
  id: string;
  userId: string;
  planId: string;
  status: OrderStatus;
  containerId?: string;
  ipAddress?: string;
  subdomain?: string;
  startedAt?: string;
  expiresAt?: string;
  createdAt: string;
  plan?: Plan;
  user?: User;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  method: PaymentMethod;
  status: TransactionStatus;
  orderId?: string;
  gatewayRef?: string;
  createdAt: string;
  order?: Order;
  user?: User;
}

export interface AppConfig {
  key: string;
  value: string;
}

export interface DataSourceContract {
  // Auth & User
  getCurrentUser(role: Role): Promise<User | null>;
  getUserById(id: string): Promise<User | null>;
  getAllUsers(): Promise<User[]>;
  toggleUserSuspend(id: string): Promise<User>;

  // Plans (Katalog Matriks)
  getPlans(): Promise<Plan[]>;
  createPlan(plan: Omit<Plan, "id">): Promise<Plan>;
  updatePlan(id: string, plan: Partial<Plan>): Promise<Plan>;

  // Orders
  getOrdersByUser(userId: string): Promise<Order[]>;
  getOrderDetail(orderId: string): Promise<Order | null>;
  getAllOrders(): Promise<Order[]>;
  createOrder(
    userId: string,
    planId: string,
    paymentMethod: PaymentMethod
  ): Promise<{ order: Order; transaction: Transaction }>;
  extendOrder(
    orderId: string,
    days: number,
    paymentMethod: PaymentMethod
  ): Promise<Order>;

  // Transactions
  getTransactionsByUser(userId: string): Promise<Transaction[]>;
  getAllTransactions(): Promise<Transaction[]>;
  topUpBalance(
    userId: string,
    amount: number,
    method: PaymentMethod
  ): Promise<Transaction>;

  // AppConfig
  getAppConfig(key: string): Promise<string>;
  updateAppConfig(key: string, value: string): Promise<string>;

  // Tutorial Preferences
  getTutorialPref(userId: string, pageKey: string): Promise<boolean>;
  dismissTutorial(userId: string, pageKey: string): Promise<void>;
}
