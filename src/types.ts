export type TableStatus = "Kosong" | "Dipakai" | "Maintenance";
export type TableType = "9-Feet Standard" | "9-Feet Premium" | "Snooker" | "Bar Table";

export interface Table {
  id: string;
  number: string;
  name: string;
  type: TableType;
  pricePerHour: number;
  status: TableStatus;
  currentStartTime?: string; // ISO string
  currentCustomer?: string;
  currentEstimatedHours?: number;
  billingType?: "Paket" | "Open";
  packageHours?: number;
}

export type ProductCategory = "Makanan" | "Minuman" | "Snack";

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  stock: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  qty: number;
  price: number;
  total: number;
}

export type PaymentMethod = "Cash" | "QRIS" | "Transfer" | "Debit";

export interface Transaction {
  invoiceNumber: string;
  date: string; // YYYY-MM-DD
  timestamp: string; // ISO string
  customer: string;
  tableNumber: string;
  tableType: string;
  pricePerHour: number;
  startTime: string; // ISO string
  endTime?: string; // ISO string
  durationHours: number; // actual hours
  tableCost: number;
  itemsCost: number;
  taxCost: number;
  discountCost: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  changeAmount: number;
  status: "Aktif" | "Selesai";
  items: OrderItem[];
  cashierName: string;
  billingType?: "Paket" | "Open";
  packageHours?: number;
}

export type ExpenseCategory = "Gaji" | "Listrik" | "Air" | "Internet" | "Perawatan Meja" | "Operasional";

export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  category: ExpenseCategory;
  amount: number;
  note: string;
}

export interface AuditLog {
  id: string;
  timestamp: string; // ISO string
  user: string;
  action: string;
  detail: string;
}

export interface AppSetting {
  appsScriptUrl: string;
  useDemoMode: boolean;
  taxPercent: number; // e.g. 10 for 10%
  discountPercent: number; // default discount
  billiardName: string;
  billiardAddress: string;
}

export interface DashboardMetrics {
  revenueToday: number;
  revenueMonth: number;
  transactionCountToday: number;
  tablesInUse: number;
  tablesAvailable: number;
  customerCountToday: number;
}
