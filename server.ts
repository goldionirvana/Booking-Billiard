import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { db } from "./src/db/index.ts";
import { billiardTables, billiardProducts, billiardTransactions, billiardExpenses, billiardAuditLogs, users } from "./src/db/schema.ts";
import { eq } from "drizzle-orm";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/test-db", async (req, res) => {
    try {
      await db.select().from(users).limit(1);
      res.json({ success: true });
    } catch (err: any) {
      console.error("Test connection error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/tables", async (req, res) => {
    try {
      const result = await db.select().from(billiardTables);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/tables", async (req, res) => {
    try {
      const table = req.body;
      await db.insert(billiardTables).values(table).onConflictDoUpdate({
        target: billiardTables.id,
        set: {
          number: table.number,
          name: table.name,
          type: table.type,
          pricePerHour: table.pricePerHour,
          status: table.status,
          currentStartTime: table.currentStartTime || null,
          currentCustomer: table.currentCustomer || null,
          currentEstimatedHours: table.currentEstimatedHours || null,
          billingType: table.billingType || null,
          packageHours: table.packageHours || null,
        }
      });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/products", async (req, res) => {
    try {
      const result = await db.select().from(billiardProducts);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const product = req.body;
      await db.insert(billiardProducts).values(product).onConflictDoUpdate({
        target: billiardProducts.id,
        set: {
          name: product.name,
          category: product.category,
          price: product.price,
          stock: product.stock,
        }
      });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/transactions", async (req, res) => {
    try {
      const result = await db.select().from(billiardTransactions);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      const tx = req.body;
      await db.insert(billiardTransactions).values({
        ...tx,
        items: tx.items || [],
      }).onConflictDoUpdate({
        target: billiardTransactions.invoiceNumber,
        set: {
          date: tx.date,
          timestamp: tx.timestamp,
          customer: tx.customer,
          tableNumber: tx.tableNumber,
          tableType: tx.tableType,
          pricePerHour: tx.pricePerHour,
          startTime: tx.startTime,
          endTime: tx.endTime || null,
          durationHours: tx.durationHours,
          tableCost: tx.tableCost,
          itemsCost: tx.itemsCost,
          taxCost: tx.taxCost,
          discountCost: tx.discountCost,
          grandTotal: tx.grandTotal,
          paymentMethod: tx.paymentMethod,
          amountPaid: tx.amountPaid,
          changeAmount: tx.changeAmount,
          status: tx.status,
          cashierName: tx.cashierName,
          billingType: tx.billingType || null,
          packageHours: tx.packageHours || null,
          items: tx.items || [],
        }
      });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/expenses", async (req, res) => {
    try {
      const result = await db.select().from(billiardExpenses);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/expenses", async (req, res) => {
    try {
      const exp = req.body;
      await db.insert(billiardExpenses).values(exp).onConflictDoUpdate({
        target: billiardExpenses.id,
        set: {
          date: exp.date,
          category: exp.category,
          amount: exp.amount,
          note: exp.note,
        }
      });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/expenses/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(billiardExpenses).where(eq(billiardExpenses.id, id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/audit-logs", async (req, res) => {
    try {
      const result = await db.select().from(billiardAuditLogs);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/audit-logs", async (req, res) => {
    try {
      const log = req.body;
      await db.insert(billiardAuditLogs).values(log).onConflictDoNothing();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite Integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
