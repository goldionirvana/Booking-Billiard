import { Table, Product, Transaction, Expense, AuditLog } from "./types";

async function getAuthHeaders() {
  return {
    "Content-Type": "application/json"
  };
}

export async function testConnection(): Promise<boolean> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch("/api/test-db", { headers });
    return res.ok;
  } catch (error) {
    console.error("Gagal menghubungkan ke SQL Server:", error);
    return false;
  }
}

export async function fetchTablesFromFirebase(): Promise<Table[]> {
  const headers = await getAuthHeaders();
  const res = await fetch("/api/tables", { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchProductsFromFirebase(): Promise<Product[]> {
  const headers = await getAuthHeaders();
  const res = await fetch("/api/products", { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchTransactionsFromFirebase(): Promise<Transaction[]> {
  const headers = await getAuthHeaders();
  const res = await fetch("/api/transactions", { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchExpensesFromFirebase(): Promise<Expense[]> {
  const headers = await getAuthHeaders();
  const res = await fetch("/api/expenses", { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchAuditLogsFromFirebase(): Promise<AuditLog[]> {
  const headers = await getAuthHeaders();
  const res = await fetch("/api/audit-logs", { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function saveTableToFirebase(table: Table): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch("/api/tables", {
    method: "POST",
    headers,
    body: JSON.stringify(table)
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function saveProductToFirebase(product: Product): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch("/api/products", {
    method: "POST",
    headers,
    body: JSON.stringify(product)
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function saveTransactionToFirebase(transaction: Transaction): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch("/api/transactions", {
    method: "POST",
    headers,
    body: JSON.stringify(transaction)
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function saveExpenseToFirebase(expense: Expense): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch("/api/expenses", {
    method: "POST",
    headers,
    body: JSON.stringify(expense)
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function deleteExpenseFromFirebase(id: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`/api/expenses/${id}`, {
    method: "DELETE",
    headers
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function saveAuditLogToFirebase(log: AuditLog): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch("/api/audit-logs", {
    method: "POST",
    headers,
    body: JSON.stringify(log)
  });
  if (!res.ok) throw new Error(await res.text());
}
