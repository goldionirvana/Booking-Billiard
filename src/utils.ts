import { Table, Product, Transaction, Expense, AuditLog, AppSetting } from "./types";

// Helper Formatter Rupiah
export function formatRupiah(num: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
}

// Generate Invoice Number
export function generateInvoice(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `INV-${year}${month}${day}-${rand}`;
}

// Seed Data for LocalStorage Fallback (Demo Mode)
export const initialTables: Table[] = [
  { id: "M1", number: "01", name: "Meja 1 (VIP)", type: "9-Feet Premium", pricePerHour: 50000, status: "Kosong" },
  { id: "M2", number: "02", name: "Meja 2 (VIP)", type: "9-Feet Premium", pricePerHour: 50000, status: "Kosong" },
  { id: "M3", number: "03", name: "Meja 3 (Standard)", type: "9-Feet Standard", pricePerHour: 40000, status: "Kosong" },
  { id: "M4", number: "04", name: "Meja 4 (Standard)", type: "9-Feet Standard", pricePerHour: 40000, status: "Kosong" },
  { id: "M5", number: "05", name: "Meja 5 (Snooker)", type: "Snooker", pricePerHour: 60000, status: "Kosong" },
  { id: "M6", number: "06", name: "Meja 6 (Bar)", type: "Bar Table", pricePerHour: 30000, status: "Kosong" }
];

export const initialProducts: Product[] = [
  { id: "P1", name: "Teh Botol Sosro", category: "Minuman", price: 8000, stock: 120 },
  { id: "P2", name: "Coca Cola Cans", category: "Minuman", price: 10000, stock: 85 },
  { id: "P3", name: "Aqua Botol 600ml", category: "Minuman", price: 5000, stock: 200 },
  { id: "P4", name: "Indomie Goreng Double", category: "Makanan", price: 18000, stock: 150 },
  { id: "P5", name: "Nasi Goreng Spesial", category: "Makanan", price: 22000, stock: 75 },
  { id: "P6", name: "Kentang Goreng (Fries)", category: "Makanan", price: 15000, stock: 90 },
  { id: "P7", name: "Kripik Singkong", category: "Snack", price: 7000, stock: 110 },
  { id: "P8", name: "Kacang Garuda", category: "Snack", price: 6000, stock: 140 }
];

export const initialExpenses: Expense[] = [
  { id: "E1", date: "2026-07-01", category: "Gaji", amount: 2500000, note: "Gaji Kasir Roni bulan Juli" },
  { id: "E2", date: "2026-07-02", category: "Listrik", amount: 850000, note: "Tagihan listrik PLN Juli" },
  { id: "E3", date: "2026-07-03", category: "Internet", amount: 350000, note: "Tagihan Wifi Biznet" },
  { id: "E4", date: "2026-07-05", category: "Perawatan Meja", amount: 600000, note: "Ganti laken Meja 3 & poles bola" },
  { id: "E5", date: "2026-07-06", category: "Operasional", amount: 150000, note: "Beli sabun pembersih & tisu" }
];

export const initialTransactions: Transaction[] = [
  {
    invoiceNumber: "INV-260705-1823",
    date: "2026-07-05",
    timestamp: "2026-07-05T14:30:00.000Z",
    customer: "Dani Ramadhan",
    tableNumber: "01",
    tableType: "9-Feet Premium",
    pricePerHour: 50000,
    startTime: "2026-07-05T14:30:00.000Z",
    endTime: "2026-07-05T16:30:00.000Z",
    durationHours: 2.0,
    tableCost: 100000,
    itemsCost: 34000,
    taxCost: 13400,
    discountCost: 10000,
    grandTotal: 137400,
    paymentMethod: "QRIS",
    amountPaid: 137400,
    changeAmount: 0,
    status: "Selesai",
    cashierName: "Billiard Cashier",
    items: [
      { productId: "P1", name: "Teh Botol Sosro", qty: 2, price: 8000, total: 16000 },
      { productId: "P4", name: "Indomie Goreng Double", qty: 1, price: 18000, total: 18000 }
    ]
  },
  {
    invoiceNumber: "INV-260706-5591",
    date: "2026-07-06",
    timestamp: "2026-07-06T10:15:00.000Z",
    customer: "Hendra Wijaya",
    tableNumber: "03",
    tableType: "9-Feet Standard",
    pricePerHour: 40000,
    startTime: "2026-07-06T10:15:00.000Z",
    endTime: "2026-07-06T11:45:00.000Z",
    durationHours: 1.5,
    tableCost: 60000,
    itemsCost: 17000,
    taxCost: 7700,
    discountCost: 0,
    grandTotal: 84700,
    paymentMethod: "Cash",
    amountPaid: 100000,
    changeAmount: 15300,
    status: "Selesai",
    cashierName: "Billiard Cashier",
    items: [
      { productId: "P2", name: "Coca Cola Cans", qty: 1, price: 10000, total: 10000 },
      { productId: "P7", name: "Kripik Singkong", qty: 1, price: 7000, total: 7000 }
    ]
  },
  {
    invoiceNumber: "INV-260706-9921",
    date: "2026-07-06",
    timestamp: "2026-07-06T19:00:00.000Z",
    customer: "Rizky Pratama",
    tableNumber: "05",
    tableType: "Snooker",
    pricePerHour: 60000,
    startTime: "2026-07-06T19:00:00.000Z",
    endTime: "2026-07-06T22:00:00.000Z",
    durationHours: 3.0,
    tableCost: 180000,
    itemsCost: 65000,
    taxCost: 24500,
    discountCost: 15000,
    grandTotal: 254500,
    paymentMethod: "Transfer",
    amountPaid: 254500,
    changeAmount: 0,
    status: "Selesai",
    cashierName: "Billiard Manager",
    items: [
      { productId: "P1", name: "Teh Botol Sosro", qty: 3, price: 8000, total: 24000 },
      { productId: "P5", name: "Nasi Goreng Spesial", qty: 1, price: 22000, total: 22000 },
      { productId: "P6", name: "Kentang Goreng (Fries)", qty: 1, price: 15000, total: 15000 }
    ]
  }
];

export const initialAuditLogs: AuditLog[] = [
  { id: "L1", timestamp: "2026-07-07T06:00:00.000Z", user: "Billiard Manager", action: "Login", detail: "Berhasil masuk ke sistem sebagai Admin" },
  { id: "L2", timestamp: "2026-07-07T06:10:00.000Z", user: "Billiard Manager", action: "Update Pengaturan", detail: "Mengubah pengaturan nama billiard" }
];

export const initialSettings: AppSetting = {
  appsScriptUrl: "",
  useDemoMode: false,
  taxPercent: 10,
  discountPercent: 0,
  billiardName: "Arena Billiard & Lounge",
  billiardAddress: "Jl. Raya Billiard No. 88, Jakarta Selatan"
};
