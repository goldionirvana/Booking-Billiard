import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  getDocFromServer,
  getDoc
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { Table, Product, Transaction, Expense, AuditLog, AppSetting } from "./types";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

// Global error handler that conforms to the required IR schema
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test Connection function as mandated by the skill
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

// Core Operations
export async function fetchTablesFromFirebase(): Promise<Table[]> {
  const path = "tables";
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Table));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function fetchProductsFromFirebase(): Promise<Product[]> {
  const path = "products";
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function fetchTransactionsFromFirebase(): Promise<Transaction[]> {
  const path = "transactions";
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map(d => ({ invoiceNumber: d.id, ...d.data() } as Transaction));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function fetchExpensesFromFirebase(): Promise<Expense[]> {
  const path = "expenses";
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Expense));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function fetchAuditLogsFromFirebase(): Promise<AuditLog[]> {
  const path = "auditLogs";
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

// Writers
export async function saveTableToFirebase(table: Table): Promise<void> {
  const path = `tables/${table.id}`;
  try {
    // Exclude 'id' field from document body as it is the doc id
    const { id, ...data } = table;
    await setDoc(doc(db, "tables", table.id), data);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveProductToFirebase(product: Product): Promise<void> {
  const path = `products/${product.id}`;
  try {
    const { id, ...data } = product;
    await setDoc(doc(db, "products", product.id), data);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveTransactionToFirebase(transaction: Transaction): Promise<void> {
  const path = `transactions/${transaction.invoiceNumber}`;
  try {
    const { invoiceNumber, ...data } = transaction;
    await setDoc(doc(db, "transactions", transaction.invoiceNumber), data);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveExpenseToFirebase(expense: Expense): Promise<void> {
  const path = `expenses/${expense.id}`;
  try {
    const { id, ...data } = expense;
    await setDoc(doc(db, "expenses", expense.id), data);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteExpenseFromFirebase(id: string): Promise<void> {
  const path = `expenses/${id}`;
  try {
    await deleteDoc(doc(db, "expenses", id));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveAuditLogToFirebase(log: AuditLog): Promise<void> {
  const path = `auditLogs/${log.id}`;
  try {
    const { id, ...data } = log;
    await setDoc(doc(db, "auditLogs", log.id), data);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}
