import React, { useState, useEffect, useRef } from "react";
import { 
  LayoutDashboard, Play, Layers, ShoppingBag, BookOpen, BarChart2, ShieldCheck, Settings, 
  LogOut, Menu, X, HelpCircle, Database, Moon, Sun, Clock, UserCheck
} from "lucide-react";

import { Table, Product, Transaction, Expense, AuditLog, AppSetting } from "./types";
import { 
  initialTables, initialProducts, initialExpenses, initialTransactions, initialAuditLogs, initialSettings 
} from "./utils";

// Component imports
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Transaksi from "./components/Transaksi";
import MasterMeja from "./components/MasterMeja";
import MasterProduk from "./components/MasterProduk";
import Pembukuan from "./components/Pembukuan";
import Laporan from "./components/Laporan";
import SettingsView from "./components/Settings";
import AuditLogView from "./components/AuditLog";

export default function App() {
  // Session authentication state
  const [session, setSession] = useState<{ username: string; name: string; role: string } | null>(null);

  // Active view routing
  const [activeView, setActiveView] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Global Datasets
  const [tables, setTables] = useState<Table[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<AppSetting>(initialSettings);

  // System States
  const [isLoading, setIsLoading] = useState(false);
  const [realTimeClock, setRealTimeClock] = useState(new Date());

  // Toast Notifications State
  const [notification, setNotification] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);

  // Idle session tracking
  const lastActivityRef = useRef<number>(Date.now());

  // Real-time top navbar clock
  useEffect(() => {
    const timer = setInterval(() => {
      setRealTimeClock(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Show customized floating toast alerts
  const showNotification = (msg: string, type: "success" | "error" | "info") => {
    setNotification({ msg, type });
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  // =========================================================
  // LOCALSTORAGE DATABASE LOADER / SYNCHRONIZER
  // =========================================================
  useEffect(() => {
    // Load config settings first
    const storedSettings = localStorage.getItem("billiard_settings");
    if (storedSettings) {
      setSettings(JSON.parse(storedSettings));
    } else {
      localStorage.setItem("billiard_settings", JSON.stringify(initialSettings));
    }

    // Load tables
    const storedTables = localStorage.getItem("billiard_tables");
    if (storedTables) {
      setTables(JSON.parse(storedTables));
    } else {
      setTables(initialTables);
      localStorage.setItem("billiard_tables", JSON.stringify(initialTables));
    }

    // Load products
    const storedProducts = localStorage.getItem("billiard_products");
    if (storedProducts) {
      setProducts(JSON.parse(storedProducts));
    } else {
      setProducts(initialProducts);
      localStorage.setItem("billiard_products", JSON.stringify(initialProducts));
    }

    // Load transactions
    const storedTrans = localStorage.getItem("billiard_transactions");
    if (storedTrans) {
      setTransactions(JSON.parse(storedTrans));
    } else {
      setTransactions(initialTransactions);
      localStorage.setItem("billiard_transactions", JSON.stringify(initialTransactions));
    }

    // Load expenses
    const storedExp = localStorage.getItem("billiard_expenses");
    if (storedExp) {
      setExpenses(JSON.parse(storedExp));
    } else {
      setExpenses(initialExpenses);
      localStorage.setItem("billiard_expenses", JSON.stringify(initialExpenses));
    }

    // Load audit logs
    const storedLogs = localStorage.getItem("billiard_logs");
    if (storedLogs) {
      setAuditLogs(JSON.parse(storedLogs));
    } else {
      setAuditLogs(initialAuditLogs);
      localStorage.setItem("billiard_logs", JSON.stringify(initialAuditLogs));
    }
  }, []);

  // Fetch full data from Google Sheets if online mode is checked
  useEffect(() => {
    if (!settings.useDemoMode && settings.appsScriptUrl && session) {
      fetchSpreadsheetData();
    }
  }, [settings.useDemoMode, settings.appsScriptUrl, session]);

  const fetchSpreadsheetData = async () => {
    setIsLoading(true);
    try {
      showNotification("Menghubungkan ke Google Spreadsheet...", "info");
      
      const [resMeja, resProduk, resRiwayat, resExp, resLogs] = await Promise.all([
        fetch(`${settings.appsScriptUrl}?action=getMeja`, { method: "GET", mode: "cors" }).then(r => r.json()),
        fetch(`${settings.appsScriptUrl}?action=getProduk`, { method: "GET", mode: "cors" }).then(r => r.json()),
        fetch(`${settings.appsScriptUrl}?action=getRiwayat`, { method: "GET", mode: "cors" }).then(r => r.json()),
        fetch(`${settings.appsScriptUrl}?action=getPengeluaran`, { method: "GET", mode: "cors" }).then(r => r.json()),
        fetch(`${settings.appsScriptUrl}?action=getAuditLog`, { method: "GET", mode: "cors" }).then(r => r.json())
      ]);

      if (resMeja.status === "success") setTables(resMeja.data);
      if (resProduk.status === "success") setProducts(resProduk.data);
      if (resRiwayat.status === "success") setTransactions(resRiwayat.data);
      if (resExp.status === "success") setExpenses(resExp.data);
      if (resLogs.status === "success") setAuditLogs(resLogs.data);

      showNotification("Seluruh database Google Sheets tersinkronisasi!", "success");
    } catch (err) {
      console.error(err);
      showNotification("Gagal sinkron Google Sheets. Berjalan dalam mode lokal.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // =========================================================
  // AUDIT LOG RECORDER UTILITY
  // =========================================================
  const recordAuditLog = (action: string, detail: string) => {
    const newLog: AuditLog = {
      id: "L" + Math.floor(Math.random() * 1000000),
      timestamp: new Date().toISOString(),
      user: session ? session.name : "System",
      action,
      detail
    };

    const updatedLogs = [newLog, ...auditLogs];
    setAuditLogs(updatedLogs);
    localStorage.setItem("billiard_logs", JSON.stringify(updatedLogs));

    // Post to spreadsheet if online
    if (!settings.useDemoMode && settings.appsScriptUrl) {
      fetch(settings.appsScriptUrl, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "saveAuditLog",
          user: session ? session.name : "System",
          act: action,
          detail: detail
        })
      }).catch(console.error);
    }
  };

  // =========================================================
  // 30 MINUTE IDLE AUTO-LOGOUT MONITOR
  // =========================================================
  useEffect(() => {
    const resetTimer = () => {
      lastActivityRef.current = Date.now();
    };

    // Listen to user movements or key taps
    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);
    window.addEventListener("mousedown", resetTimer);
    window.addEventListener("scroll", resetTimer);
    window.addEventListener("touchstart", resetTimer);

    // Run checker loop every 10 seconds
    const interval = setInterval(() => {
      if (!session) return;
      const inactiveDurationMs = Date.now() - lastActivityRef.current;
      const thirtyMinutesMs = 30 * 60 * 1000;

      if (inactiveDurationMs >= thirtyMinutesMs) {
        // Log out immediately
        setSession(null);
        setActiveView("dashboard");
        alert("Sesi Anda berakhir secara otomatis karena tidak ada aktivitas selama 30 menit (Auto-Logout).");
        recordAuditLog("Auto Logout", "Pengguna keluar otomatis karena idle 30 menit.");
      }
    }, 10000);

    return () => {
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("mousedown", resetTimer);
      window.removeEventListener("scroll", resetTimer);
      window.removeEventListener("touchstart", resetTimer);
      clearInterval(interval);
    };
  }, [session]);

  // =========================================================
  // GLOBAL STATE MODIFIERS WITH DATABASE MIRRORING
  // =========================================================
  const handleUpdateTables = (updatedTables: Table[]) => {
    setTables(updatedTables);
    localStorage.setItem("billiard_tables", JSON.stringify(updatedTables));

    // Handle online spreadsheet mirror if checked
    if (!settings.useDemoMode && settings.appsScriptUrl) {
      // Find what changed and update Google sheet
      // To keep it simple and robust, we can upload the updated list or write the target mesa
      // We will perform a loop for active play starting / checkout
      updatedTables.forEach((t) => {
        const prev = tables.find((p) => p.id === t.id);
        if (JSON.stringify(prev) !== JSON.stringify(t)) {
          fetch(settings.appsScriptUrl, {
            method: "POST",
            mode: "cors",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ action: "saveMeja", meja: t })
          }).catch(console.error);
        }
      });
    }
  };

  const handleUpdateProducts = (updatedProducts: Product[]) => {
    setProducts(updatedProducts);
    localStorage.setItem("billiard_products", JSON.stringify(updatedProducts));

    if (!settings.useDemoMode && settings.appsScriptUrl) {
      updatedProducts.forEach((p) => {
        const prev = products.find((pr) => pr.id === p.id);
        if (JSON.stringify(prev) !== JSON.stringify(p)) {
          fetch(settings.appsScriptUrl, {
            method: "POST",
            mode: "cors",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ action: "saveProduk", produk: p })
          }).catch(console.error);
        }
      });
    }
  };

  const handleUpdateExpenses = (updatedExpenses: Expense[]) => {
    setExpenses(updatedExpenses);
    localStorage.setItem("billiard_expenses", JSON.stringify(updatedExpenses));

    if (!settings.useDemoMode && settings.appsScriptUrl) {
      // Find deleted
      if (updatedExpenses.length < expenses.length) {
        expenses.forEach((e) => {
          if (!updatedExpenses.some((un) => un.id === e.id)) {
            fetch(settings.appsScriptUrl, {
              method: "POST",
              mode: "cors",
              headers: { "Content-Type": "text/plain;charset=utf-8" },
              body: JSON.stringify({ action: "deletePengeluaran", id: e.id })
            }).catch(console.error);
          }
        });
      } else {
        // Find saved/updated
        updatedExpenses.forEach((e) => {
          const prev = expenses.find((ex) => ex.id === e.id);
          if (JSON.stringify(prev) !== JSON.stringify(e)) {
            fetch(settings.appsScriptUrl, {
              method: "POST",
              mode: "cors",
              headers: { "Content-Type": "text/plain;charset=utf-8" },
              body: JSON.stringify({ action: "savePengeluaran", pengeluaran: e })
            }).catch(console.error);
          }
        });
      }
    }
  };

  const handleAddTransaction = (newTrans: Transaction) => {
    const updatedTrans = [newTrans, ...transactions];
    setTransactions(updatedTrans);
    localStorage.setItem("billiard_transactions", JSON.stringify(updatedTrans));

    // Audit logs for checkout / start playing
    if (newTrans.status === "Aktif") {
      recordAuditLog("Mulai Sewa Meja", `Meja Nol ${newTrans.tableNumber} mulai disewa oleh customer: ${newTrans.customer}`);
    } else {
      recordAuditLog("Checkout Pembayaran", `Pelunasan invoice ${newTrans.invoiceNumber} senilai ${newTrans.grandTotal}`);
    }

    // Mirror to Google Sheets Web App
    if (!settings.useDemoMode && settings.appsScriptUrl) {
      const endpoint = newTrans.status === "Aktif" ? "saveTransaksi" : "finishTransaksi";
      const payloadKey = newTrans.status === "Aktif" ? "transaksi" : "checkout";

      fetch(settings.appsScriptUrl, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: endpoint,
          [payloadKey]: newTrans
        })
      }).catch(console.error);
    }
  };

  const handleUpdateSettings = (newSettings: AppSetting) => {
    setSettings(newSettings);
    localStorage.setItem("billiard_settings", JSON.stringify(newSettings));
    recordAuditLog("Update Pengaturan", `Mengubah nama billiard ke: ${newSettings.billiardName}`);

    if (!newSettings.useDemoMode && newSettings.appsScriptUrl) {
      fetch(newSettings.appsScriptUrl, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "saveSettings", settings: newSettings })
      }).catch(console.error);
    }
  };

  const handleLoginSuccess = (user: { name: string; role: string; username: string }) => {
    setSession(user);
    setActiveView("dashboard");
    // Ensure idle activity resets
    lastActivityRef.current = Date.now();
  };

  const handleLogout = () => {
    if (window.confirm("Apakah Anda yakin ingin keluar dari sistem?")) {
      recordAuditLog("Logout", "Pengguna melakukan logout manual.");
      setSession(null);
      setActiveView("dashboard");
    }
  };

  // Render routing views
  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return <Dashboard tables={tables} transactions={transactions} expenses={expenses} onNavigateToView={setActiveView} />;
      case "transaksi":
        return (
          <Transaksi 
            tables={tables} 
            products={products} 
            settings={settings} 
            userRole={session?.role || "Kasir"} 
            cashierName={session?.name || "Billiard Cashier"}
            onUpdateTables={handleUpdateTables} 
            onUpdateProducts={handleUpdateProducts} 
            onAddTransaction={handleAddTransaction}
            onShowNotification={showNotification}
          />
        );
      case "meja":
        return <MasterMeja tables={tables} userRole={session?.role || "Kasir"} onUpdateTables={handleUpdateTables} onShowNotification={showNotification} />;
      case "produk":
        return <MasterProduk products={products} userRole={session?.role || "Kasir"} onUpdateProducts={handleUpdateProducts} onShowNotification={showNotification} />;
      case "pembukuan":
        return <Pembukuan transactions={transactions} expenses={expenses} userRole={session?.role || "Kasir"} onUpdateExpenses={handleUpdateExpenses} onShowNotification={showNotification} />;
      case "laporan":
        return <Laporan transactions={transactions} tables={tables} products={products} />;
      case "logs":
        return <AuditLogView auditLogs={auditLogs} userRole={session?.role || "Kasir"} />;
      case "settings":
        return <SettingsView settings={settings} userRole={session?.role || "Kasir"} onUpdateSettings={handleUpdateSettings} onShowNotification={showNotification} />;
      default:
        return <Dashboard tables={tables} transactions={transactions} expenses={expenses} onNavigateToView={setActiveView} />;
    }
  };

  // If user is not logged in, render beautiful login interface
  if (!session) {
    return (
      <Login 
        onLoginSuccess={handleLoginSuccess} 
        settings={settings} 
        isLoading={isLoading} 
        onShowNotification={showNotification} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1115] flex font-sans text-gray-200 antialiased relative">
      
      {/* Toast Alert Notifications */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-4 bg-white text-gray-900 px-5 py-3.5 rounded-2xl shadow-2xl border border-gray-200 animate-bounce max-w-sm">
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-extrabold text-sm shrink-0">
            {notification.type === "error" ? "✕" : "✓"}
          </div>
          <div>
            <p className="text-xs font-bold leading-none text-gray-900">Notifikasi Sistem</p>
            <p className="text-[11px] text-gray-500 mt-1 font-medium leading-tight">{notification.msg}</p>
          </div>
        </div>
      )}

      {/* =========================================================
          LEFT SIDEBAR VIEW SELECTOR
          ========================================================= */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#1a1c23] border-r border-gray-800 transform ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0 transition-transform duration-300 ease-out flex flex-col justify-between shrink-0`}>
        
        {/* Sidebar Header Brand */}
        <div>
          <div className="p-6 border-b border-gray-800 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-600/10">
                <span className="text-white font-extrabold text-lg">B8</span>
              </div>
              <span className="font-bold text-lg tracking-tight text-white">CueMaster<span className="text-indigo-500">POS</span></span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Items List */}
          <nav className="p-4 space-y-1.5">
            {[
              { id: "dashboard", label: "Dashboard Overview", icon: LayoutDashboard, roles: ["Admin", "Kasir"] },
              { id: "transaksi", label: "Transaksi Sewa (POS)", icon: Play, roles: ["Admin", "Kasir"] },
              { id: "meja", label: "Master Meja", icon: Layers, roles: ["Admin"] },
              { id: "produk", label: "Produk F&B", icon: ShoppingBag, roles: ["Admin"] },
              { id: "pembukuan", label: "Pembukuan Kas", icon: BookOpen, roles: ["Admin"] },
              { id: "laporan", label: "Laporan & Riwayat", icon: BarChart2, roles: ["Admin"] },
              { id: "logs", label: "Audit Security Log", icon: ShieldCheck, roles: ["Admin"] },
              { id: "settings", label: "Pengaturan Toko", icon: Settings, roles: ["Admin"] },
            ]
              .filter((item) => item.roles.includes(session.role))
              .map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveView(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      isActive 
                        ? "bg-indigo-600/10 text-indigo-400 border border-indigo-600/20" 
                        : "text-gray-400 hover:text-white hover:bg-gray-800/30"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-indigo-400" : "text-gray-500"}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
          </nav>
        </div>

        {/* Sidebar Footer User Credit */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center justify-between gap-3 px-2 py-1">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-sm">
                {session.name.charAt(0)}
              </div>
              <div className="truncate leading-tight">
                <p className="text-sm font-medium text-white truncate">{session.name}</p>
                <span className="text-[10px] text-gray-500 uppercase font-semibold">{session.role}</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-gray-500 hover:text-white transition-colors cursor-pointer shrink-0"
              title="Keluar Sesi"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

      </aside>

      {/* =========================================================
          RIGHT MAIN CANVAS WRAPPER & TOP NAV
          ========================================================= */}
      <div className="flex-1 min-w-0 flex flex-col">
        
        {/* Top Header Navbar */}
        <header className="h-16 border-b border-gray-800 bg-[#1a1c23] px-8 flex justify-between items-center shrink-0 sticky top-0 z-30">
          
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer">
              <Menu className="w-5.5 h-5.5" />
            </button>
            <div className="hidden sm:block">
              <h2 className="text-sm font-bold text-white tracking-tight">{settings.billiardName}</h2>
              <p className="text-[10px] text-gray-500 font-semibold truncate leading-none mt-1">{settings.billiardAddress}</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs">
            {/* Live UTC+7 clock */}
            <div className="text-right">
              <p className="text-[10px] text-gray-500 font-medium">Jam Operasional</p>
              <p className="text-xs font-mono text-indigo-400 mt-0.5">{realTimeClock.toLocaleTimeString("id-ID")} WIB</p>
            </div>

            {/* Offline/Online indicators */}
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-[10px] font-semibold border ${
                settings.useDemoMode 
                  ? "bg-gray-800 text-gray-400 border-gray-750" 
                  : "bg-green-500/10 text-green-500 border-green-500/20"
              }`}>
                {settings.useDemoMode ? "Offline DB" : "System Live"}
              </span>
            </div>
          </div>

        </header>

        {/* Dynamic viewport renderer with padding */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          
          {/* Transparent central screen spinner */}
          {isLoading && (
            <div className="absolute inset-0 bg-[#0f1115]/60 backdrop-blur-[1px] flex items-center justify-center z-50">
              <div className="bg-[#1a1c23] border border-gray-800 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3">
                <span className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
                <span className="text-xs font-bold text-gray-200 uppercase tracking-wider">Menghubungkan Spreadsheet...</span>
              </div>
            </div>
          )}

          {renderView()}

        </main>

        {/* Small desktop footer */}
        <footer className="h-10 border-t border-gray-800/60 bg-[#1a1c23]/30 px-8 flex items-center justify-between text-[10px] text-gray-600 font-semibold tracking-wider shrink-0 uppercase">
          <span>&copy; 2026 {settings.billiardName} POS & Accounting</span>
          <span>CueMaster POS &bull; v1.0.0</span>
        </footer>

      </div>

    </div>
  );
}
