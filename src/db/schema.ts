import { pgTable, text, integer, real, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: text('created_at'),
});

export const billiardTables = pgTable('billiard_tables', {
  id: text('id').primaryKey(),
  number: text('number').notNull(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  pricePerHour: integer('price_per_hour').notNull(),
  status: text('status').notNull(),
  currentStartTime: text('current_start_time'),
  currentCustomer: text('current_customer'),
  currentEstimatedHours: real('current_estimated_hours'),
  billingType: text('billing_type'),
  packageHours: integer('package_hours'),
});

export const billiardProducts = pgTable('billiard_products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  price: integer('price').notNull(),
  stock: integer('stock').notNull(),
});

export const billiardTransactions = pgTable('billiard_transactions', {
  invoiceNumber: text('invoice_number').primaryKey(),
  date: text('date').notNull(),
  timestamp: text('timestamp').notNull(),
  customer: text('customer').notNull(),
  tableNumber: text('table_number').notNull(),
  tableType: text('table_type').notNull(),
  pricePerHour: integer('price_per_hour').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time'),
  durationHours: real('duration_hours').notNull(),
  tableCost: integer('table_cost').notNull(),
  itemsCost: integer('items_cost').notNull(),
  taxCost: integer('tax_cost').notNull(),
  discountCost: integer('discount_cost').notNull(),
  grandTotal: integer('grand_total').notNull(),
  paymentMethod: text('payment_method').notNull(),
  amountPaid: integer('amount_paid').notNull(),
  changeAmount: integer('change_amount').notNull(),
  status: text('status').notNull(),
  cashierName: text('cashier_name').notNull(),
  billingType: text('billing_type'),
  packageHours: integer('package_hours'),
  items: jsonb('items').notNull(), // contains array of OrderItem
});

export const billiardExpenses = pgTable('billiard_expenses', {
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  category: text('category').notNull(),
  amount: integer('amount').notNull(),
  note: text('note').notNull(),
});

export const billiardAuditLogs = pgTable('billiard_audit_logs', {
  id: text('id').primaryKey(),
  timestamp: text('timestamp').notNull(),
  user: text('user').notNull(),
  action: text('action').notNull(),
  detail: text('detail').notNull(),
});
