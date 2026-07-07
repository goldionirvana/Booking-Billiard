import React, { useState, useEffect } from "react";
import { Play, CheckCircle, Plus, Minus, Receipt, Trash2, Clock, DollarSign, User, ShieldAlert, AlertCircle, ShoppingCart } from "lucide-react";
import { Table, Product, Transaction, OrderItem, PaymentMethod, AppSetting } from "../types";
import { formatRupiah, generateInvoice } from "../utils";

interface TransaksiProps {
  tables: Table[];
  products: Product[];
  settings: AppSetting;
  userRole: string;
  cashierName: string;
  onUpdateTables: (updated: Table[]) => void;
  onUpdateProducts: (updated: Product[]) => void;
  onAddTransaction: (trans: Transaction) => void;
  onShowNotification: (msg: string, type: "success" | "error" | "info") => void;
}

export default function Transaksi({
  tables,
  products,
  settings,
  userRole,
  cashierName,
  onUpdateTables,
  onUpdateProducts,
  onAddTransaction,
  onShowNotification
}: TransaksiProps) {
  // Live timers state to refresh elapsed time
  const [currentTime, setCurrentTime] = useState(new Date());

  // Form States for new play session
  const [selectedTableId, setSelectedTableId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [estimatedHours, setEstimatedHours] = useState(1);
  const [billingType, setBillingType] = useState<"Open" | "Paket">("Open");
  const [packageHours, setPackageHours] = useState<number>(1);
  const [isStartingPlay, setIsStartingPlay] = useState(false);

  // Active Session being checked out or modified
  const [activeCheckoutTable, setActiveCheckoutTable] = useState<Table | null>(null);
  const [checkoutItems, setCheckoutItems] = useState<OrderItem[]>([]);
  const [customDiscount, setCustomDiscount] = useState(0); // in percent
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [amountPaid, setAmountPaid] = useState<number | string>("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Struk (Receipt) State to print
  const [printedReceipt, setPrintedReceipt] = useState<Transaction | null>(null);

  // Interval hook to tick every second to update running timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle Starting Play
  const handleStartPlay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTableId) {
      onShowNotification("Pilih nomor meja terlebih dahulu", "error");
      return;
    }
    if (!customerName.trim()) {
      onShowNotification("Nama Customer wajib diisi", "error");
      return;
    }

    const updated = tables.map((t) => {
      if (t.id === selectedTableId) {
        return {
          ...t,
          status: "Dipakai" as const,
          currentStartTime: new Date().toISOString(),
          currentCustomer: customerName,
          currentEstimatedHours: billingType === "Paket" ? packageHours : undefined,
          billingType: billingType,
          packageHours: billingType === "Paket" ? packageHours : undefined
        };
      }
      return t;
    });

    onUpdateTables(updated);

    // Write starting transaction record with status "Aktif"
    const newTrans: Transaction = {
      invoiceNumber: generateInvoice(),
      date: new Date().toISOString().split("T")[0],
      timestamp: new Date().toISOString(),
      customer: customerName,
      tableNumber: tables.find((t) => t.id === selectedTableId)?.number || "",
      tableType: tables.find((t) => t.id === selectedTableId)?.type || "",
      pricePerHour: tables.find((t) => t.id === selectedTableId)?.pricePerHour || 0,
      startTime: new Date().toISOString(),
      durationHours: billingType === "Paket" ? packageHours : 0,
      tableCost: 0,
      itemsCost: 0,
      taxCost: 0,
      discountCost: 0,
      grandTotal: 0,
      paymentMethod: "Cash",
      amountPaid: 0,
      changeAmount: 0,
      status: "Aktif",
      items: [],
      cashierName: cashierName,
      billingType: billingType,
      packageHours: billingType === "Paket" ? packageHours : undefined
    };

    onAddTransaction(newTrans);
    onShowNotification(`Meja ${newTrans.tableNumber} berhasil dimulai untuk ${customerName}!`, "success");

    // Reset Form
    setSelectedTableId("");
    setCustomerName("");
    setEstimatedHours(1);
    setBillingType("Open");
    setPackageHours(1);
    setIsStartingPlay(false);
  };

  // Helper: Calculate playing duration in hours
  const calculateDuration = (startTimeIso: string): number => {
    const start = new Date(startTimeIso);
    const diffMs = currentTime.getTime() - start.getTime();
    const hours = diffMs / (1000 * 60 * 60);
    return Math.max(0.01, parseFloat(hours.toFixed(2))); // minimum 0.01 hours
  };

  // Helper: Format duration (e.g. 1 jam 15 menit)
  const formatDurationText = (hours: number): string => {
    const totalMinutes = Math.round(hours * 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hrs > 0) {
      return `${hrs} jam ${mins} menit`;
    }
    return `${mins} menit`;
  };

  // Prepare for Checkout
  const handleOpenCheckout = (table: Table) => {
    setActiveCheckoutTable(table);
    setCheckoutItems([]);
    setCustomDiscount(settings.discountPercent);
    setPaymentMethod("Cash");
    setAmountPaid("");
    setIsCheckingOut(true);
  };

  // Add beverage or food to order
  const handleAddProductToCheckout = (product: Product) => {
    if (product.stock <= 0) {
      onShowNotification(`Stok ${product.name} habis!`, "error");
      return;
    }

    const existingIndex = checkoutItems.findIndex((item) => item.productId === product.id);
    if (existingIndex !== -1) {
      const updated = [...checkoutItems];
      if (updated[existingIndex].qty >= product.stock) {
        onShowNotification(`Tidak bisa melebihi stok tersedia (${product.stock})`, "error");
        return;
      }
      updated[existingIndex].qty += 1;
      updated[existingIndex].total = updated[existingIndex].qty * updated[existingIndex].price;
      setCheckoutItems(updated);
    } else {
      setCheckoutItems([
        ...checkoutItems,
        {
          productId: product.id,
          name: product.name,
          qty: 1,
          price: product.price,
          total: product.price
        }
      ]);
    }
  };

  const handleAdjustItemQty = (productId: string, delta: number) => {
    const updated = checkoutItems
      .map((item) => {
        if (item.productId === productId) {
          const product = products.find((p) => p.id === productId);
          const newQty = item.qty + delta;
          if (newQty <= 0) return null;
          if (product && newQty > product.stock) {
            onShowNotification(`Stok terbatas!`, "error");
            return item;
          }
          return {
            ...item,
            qty: newQty,
            total: newQty * item.price
          };
        }
        return item;
      })
      .filter(Boolean) as OrderItem[];
    setCheckoutItems(updated);
  };

  // Calculate Subtotals & Totals
  const duration = activeCheckoutTable ? calculateDuration(activeCheckoutTable.currentStartTime!) : 0;
  const tablePricePerHour = activeCheckoutTable ? activeCheckoutTable.pricePerHour : 0;
  
  // Calculate Table Cost based on Billing Type
  let tableCost = 0;
  if (activeCheckoutTable) {
    if (activeCheckoutTable.billingType === "Paket" && activeCheckoutTable.packageHours) {
      const minHours = activeCheckoutTable.packageHours;
      const effectiveHours = Math.max(minHours, duration);
      tableCost = Math.round(effectiveHours * tablePricePerHour);
    } else {
      tableCost = Math.round(duration * tablePricePerHour);
    }
  }

  const itemsCost = checkoutItems.reduce((sum, item) => sum + item.total, 0);
  const subtotal = tableCost + itemsCost;

  const discountCost = Math.round((subtotal * customDiscount) / 100);
  const taxableAmount = subtotal - discountCost;
  const taxCost = Math.round((taxableAmount * settings.taxPercent) / 100);
  const grandTotal = taxableAmount + taxCost;

  const finalAmountPaid = typeof amountPaid === "number" ? amountPaid : parseFloat(amountPaid) || 0;
  const changeAmount = Math.max(0, finalAmountPaid - grandTotal);

  // Finalize Checkout and payment
  const handleFinalCheckout = () => {
    if (!activeCheckoutTable) return;

    if (finalAmountPaid < grandTotal) {
      onShowNotification(`Nominal bayar kurang! Harus minimal ${formatRupiah(grandTotal)}`, "error");
      return;
    }

    // Deduct stock from products
    const updatedProducts = products.map((prod) => {
      const orderItem = checkoutItems.find((item) => item.productId === prod.id);
      if (orderItem) {
        return {
          ...prod,
          stock: Math.max(0, prod.stock - orderItem.qty)
        };
      }
      return prod;
    });
    onUpdateProducts(updatedProducts);

    // Find active transaction invoice
    const finalTrans: Transaction = {
      invoiceNumber: generateInvoice(),
      date: new Date().toISOString().split("T")[0],
      timestamp: new Date().toISOString(),
      customer: activeCheckoutTable.currentCustomer || "Guest",
      tableNumber: activeCheckoutTable.number,
      tableType: activeCheckoutTable.type,
      pricePerHour: activeCheckoutTable.pricePerHour,
      startTime: activeCheckoutTable.currentStartTime!,
      endTime: new Date().toISOString(),
      durationHours: duration,
      tableCost: tableCost,
      itemsCost: itemsCost,
      taxCost: taxCost,
      discountCost: discountCost,
      grandTotal: grandTotal,
      paymentMethod: paymentMethod,
      amountPaid: finalAmountPaid,
      changeAmount: changeAmount,
      status: "Selesai",
      items: checkoutItems,
      cashierName: cashierName,
      billingType: activeCheckoutTable.billingType || "Open",
      packageHours: activeCheckoutTable.packageHours
    };

    // Save transaction
    onAddTransaction(finalTrans);

    // Set Meja back to Kosong
    const updatedTables = tables.map((t) => {
      if (t.id === activeCheckoutTable.id) {
        return {
          ...t,
          status: "Kosong" as const,
          currentStartTime: undefined,
          currentCustomer: undefined,
          currentEstimatedHours: undefined,
          billingType: undefined,
          packageHours: undefined
        };
      }
      return t;
    });
    onUpdateTables(updatedTables);

    onShowNotification(`Transaksi ${finalTrans.invoiceNumber} Berhasil Selesai!`, "success");
    setPrintedReceipt(finalTrans); // Show receipt printer modal
    setIsCheckingOut(false);
    setActiveCheckoutTable(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Upper Navigation POS Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Billing & POS Kasir</h1>
          <p className="text-slate-400 text-sm">Kelola sewa meja billiard secara real-time dan pesan menu kafe.</p>
        </div>
        <button
          onClick={() => setIsStartingPlay(true)}
          className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-900 hover:from-emerald-400 hover:to-teal-400 font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/10 cursor-pointer flex items-center gap-2 text-sm"
        >
          <Play className="w-4 h-4 fill-slate-900" />
          <span>Mulai Sewa Baru</span>
        </button>
      </div>

      {/* Meja Active Play Dashboard Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tables.map((table) => {
          const isBusy = table.status === "Dipakai";
          const isMaint = table.status === "Maintenance";
          
          let cardBorder = "border-slate-700/50 bg-slate-800/80";
          if (isBusy) cardBorder = "border-rose-500/30 bg-rose-950/10 shadow-lg shadow-rose-950/10 ring-1 ring-rose-500/10";
          if (isMaint) cardBorder = "border-amber-500/20 bg-slate-800/50 opacity-70";

          // Calculate current running duration & running price
          const elapsed = isBusy && table.currentStartTime ? calculateDuration(table.currentStartTime) : 0;
          
          let runningCost = 0;
          if (isBusy && table.currentStartTime) {
            if (table.billingType === "Paket" && table.packageHours) {
              const minHours = table.packageHours;
              runningCost = Math.round(Math.max(minHours, elapsed) * table.pricePerHour);
            } else {
              runningCost = Math.round(elapsed * table.pricePerHour);
            }
          }

          return (
            <div key={table.id} className={`rounded-2xl border p-5 flex flex-col justify-between transition-all ${cardBorder}`}>
              
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">{table.type}</span>
                    <h3 className="text-2xl font-black text-white mt-1">Nol {table.number}</h3>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <p className="text-xs text-slate-400 font-medium">{table.name}</p>
                      {isBusy && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${
                          table.billingType === "Paket" ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/10" : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/10"
                        }`}>
                          {table.billingType === "Paket" ? `📦 Paket ${table.packageHours} Jam` : "⚡ Open"}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                    isBusy ? "bg-rose-500/15 text-rose-400" : isMaint ? "bg-amber-500/15 text-amber-400" : "bg-emerald-500/15 text-emerald-400"
                  }`}>
                    {table.status}
                  </span>
                </div>

                {isBusy ? (
                  <div className="mt-5 space-y-3.5 bg-slate-900/60 p-4 rounded-xl border border-slate-700/30">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-rose-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-semibold">Customer</p>
                        <p className="text-sm font-bold text-white leading-tight">{table.currentCustomer}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-semibold">Durasi Bermain</p>
                          <p className="text-xs text-white font-mono font-bold">{formatDurationText(elapsed)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-500 uppercase font-semibold">Running Cost</p>
                        <p className="text-xs text-emerald-400 font-mono font-extrabold">{formatRupiah(runningCost)}</p>
                      </div>
                    </div>

                    {/* Progress Bar for Package Mode */}
                    {table.billingType === "Paket" && table.packageHours && (
                      <div className="pt-2.5 border-t border-slate-800 space-y-1.5">
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Sewa Paket: {table.packageHours} Jam</span>
                          <span className={elapsed > table.packageHours ? "text-rose-400 font-bold" : "text-cyan-400 font-bold"}>
                            {elapsed > table.packageHours 
                              ? `Overtime: +${formatDurationText(elapsed - table.packageHours)}` 
                              : `Sisa: ${formatDurationText(table.packageHours - elapsed)}`
                            }
                          </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${
                              elapsed > table.packageHours ? "bg-rose-500 animate-pulse" : "bg-cyan-500"
                            }`}
                            style={{ width: `${Math.min(100, (elapsed / table.packageHours) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : isMaint ? (
                  <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex gap-2 items-center">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Meja dalam perbaikan / servis laken berkala.</span>
                  </div>
                ) : (
                  <div className="mt-6 p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-slate-400 text-xs flex justify-between items-center">
                    <span>Tarif per jam:</span>
                    <span className="font-mono font-bold text-slate-200">{formatRupiah(table.pricePerHour)}</span>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-700/30">
                {isBusy ? (
                  <button
                    onClick={() => handleOpenCheckout(table)}
                    className="w-full py-3 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-rose-950/10 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Selesai Bermain (Checkout)</span>
                  </button>
                ) : isMaint ? (
                  <button disabled className="w-full py-3 bg-slate-800 text-slate-600 font-bold rounded-xl text-xs uppercase tracking-wider border border-slate-700 cursor-not-allowed">
                    Maintenance
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedTableId(table.id);
                      setIsStartingPlay(true);
                    }}
                    className="w-full py-3 bg-slate-800 text-emerald-400 hover:bg-slate-700 font-extrabold rounded-xl text-xs uppercase tracking-wider border border-slate-700 hover:border-emerald-500/30 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-emerald-400" />
                    <span>Mulai Sewa Meja</span>
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* =========================================================
          MODAL: MULAI BERMAIN (START PLAY)
          ========================================================= */}
      {isStartingPlay && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Play className="w-5 h-5 text-emerald-400 fill-emerald-400" />
              Mulai Sewa Meja Billiard
            </h2>

            <form onSubmit={handleStartPlay} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Pilih Meja</label>
                <select
                  required
                  value={selectedTableId}
                  onChange={(e) => setSelectedTableId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Pilih Meja Kosong --</option>
                  {tables
                    .filter((t) => t.status === "Kosong")
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        Nol {t.number} - {t.name} ({formatRupiah(t.pricePerHour)}/jam)
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Nama Customer</label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan nama customer"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Tipe Billing / Jenis Sewa Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Jenis Billing</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBillingType("Open")}
                    className={`py-2.5 px-4 rounded-xl text-sm font-bold border transition-all cursor-pointer flex flex-col items-center justify-center ${
                      billingType === "Open"
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 font-extrabold"
                        : "bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-300"
                    }`}
                  >
                    <span className="text-sm">⚡ Open Play</span>
                    <span className="text-[10px] font-medium text-slate-400 mt-0.5">Bayar sesuai durasi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBillingType("Paket");
                      setPackageHours(1);
                    }}
                    className={`py-2.5 px-4 rounded-xl text-sm font-bold border transition-all cursor-pointer flex flex-col items-center justify-center ${
                      billingType === "Paket"
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 font-extrabold"
                        : "bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-300"
                    }`}
                  >
                    <span className="text-sm">📦 Paket Per Jam</span>
                    <span className="text-[10px] font-medium text-slate-400 mt-0.5">Sewa durasi tetap</span>
                  </button>
                </div>
              </div>

              {/* Conditional options based on billingType */}
              {billingType === "Open" ? (
                <div className="p-3 bg-slate-900 border border-slate-700/50 rounded-xl">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    ℹ️ <span className="font-semibold text-slate-300">Open Play:</span> Sesi akan terus berjalan hingga kasir menekan tombol <span className="text-emerald-400 font-medium">Checkout</span>. Biaya dihitung proporsional per menit.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 p-3 bg-slate-900 border border-slate-700/50 rounded-xl">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Pilih Durasi Paket</label>
                  
                  {/* Quick durations */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {[1, 2, 3, 4].map((hours) => (
                      <button
                        key={hours}
                        type="button"
                        onClick={() => setPackageHours(hours)}
                        className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          packageHours === hours
                            ? "bg-emerald-500 text-slate-950 font-black border-emerald-500"
                            : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-705"
                        }`}
                      >
                        {hours} Jam
                      </button>
                    ))}
                  </div>

                  {/* Manual counter adjustment */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                    <span className="text-xs text-slate-400 font-medium">Durasi Custom:</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPackageHours(Math.max(1, packageHours - 1))}
                        className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-sm font-mono font-bold text-white text-center w-8">{packageHours}</span>
                      <button
                        type="button"
                        onClick={() => setPackageHours(packageHours + 1)}
                        className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold cursor-pointer"
                      >
                        +
                      </button>
                      <span className="text-xs text-slate-400">Jam</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsStartingPlay(false)}
                  className="flex-1 py-3 bg-slate-900 hover:bg-slate-750 text-slate-300 font-bold rounded-xl transition-all cursor-pointer border border-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black rounded-xl transition-all shadow-lg cursor-pointer"
                >
                  Mulai Bermain
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: CHECKOUT & PEMBAYARAN & ORDER MAKAN/MINUM
          ========================================================= */}
      {isCheckingOut && activeCheckoutTable && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-5xl p-6 shadow-2xl flex flex-col lg:flex-row gap-6 my-8">
            
            {/* Left Side: Additional Cafe Ordering */}
            <div className="flex-1 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-750">
                <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                  <ShoppingCart className="w-5 h-5 text-emerald-400" />
                  Tambah Menu Kafe & Makanan
                </h3>
                <span className="text-xs text-slate-400">Pemain: <strong className="text-rose-400">{activeCheckoutTable.currentCustomer}</strong></span>
              </div>

              {/* Product selector grid */}
              <div className="max-h-[350px] overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {products.map((prod) => (
                  <button
                    key={prod.id}
                    onClick={() => handleAddProductToCheckout(prod)}
                    className="p-3 bg-slate-900 hover:bg-slate-750 rounded-xl border border-slate-750 text-left transition-all relative group cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium">{prod.category}</span>
                        <span className="text-[10px] text-slate-500">Stok: {prod.stock}</span>
                      </div>
                      <h4 className="text-xs font-bold text-white mt-1.5 group-hover:text-emerald-400 transition-colors line-clamp-1">{prod.name}</h4>
                    </div>
                    <p className="text-xs font-mono font-bold text-emerald-400 mt-2">{formatRupiah(prod.price)}</p>
                  </button>
                ))}
              </div>

              {/* Added Cafe Items Order Summary Table */}
              <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/50">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Item Tambahan Customer</h4>
                {checkoutItems.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">Belum ada makanan/minuman yang ditambahkan.</p>
                ) : (
                  <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                    {checkoutItems.map((item) => (
                      <div key={item.productId} className="flex justify-between items-center text-xs">
                        <div className="flex-1">
                          <p className="font-bold text-slate-200">{item.name}</p>
                          <p className="text-[10px] text-slate-500">{formatRupiah(item.price)} x {item.qty}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-emerald-400 font-bold">{formatRupiah(item.total)}</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleAdjustItemQty(item.productId, -1)}
                              className="w-6 h-6 rounded bg-slate-850 hover:bg-slate-750 text-white flex items-center justify-center cursor-pointer border border-slate-700"
                            >
                              -
                            </button>
                            <span className="w-4 text-center font-bold text-white text-[11px]">{item.qty}</span>
                            <button
                              onClick={() => handleAdjustItemQty(item.productId, 1)}
                              className="w-6 h-6 rounded bg-slate-850 hover:bg-slate-750 text-white flex items-center justify-center cursor-pointer border border-slate-700"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Side: Sessional Checkout Accounting & Cash Drawer */}
            <div className="w-full lg:w-[420px] bg-slate-900 rounded-2xl p-5 border border-slate-700 flex flex-col justify-between space-y-4">
              
              <div>
                <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 mb-4 flex justify-between">
                  <span>Rincian Pembayaran Billiard</span>
                  <span className="text-emerald-400 font-mono">Meja {activeCheckoutTable.number}</span>
                </h3>

                {/* Billing specs list */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Meja (Billiard)</span>
                    <span className="text-slate-200 font-medium">{activeCheckoutTable.name} ({activeCheckoutTable.type})</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Waktu Bermain</span>
                    <span className="text-slate-200 font-mono">
                      {new Date(activeCheckoutTable.currentStartTime!).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} - {currentTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Lama Bermain Aktual</span>
                    <span className="text-emerald-400 font-bold font-mono">{formatDurationText(duration)}</span>
                  </div>

                  <div className="border-t border-slate-800 pt-3 flex justify-between font-medium text-slate-400">
                    <span>Biaya Sewa Meja ({duration} jam)</span>
                    <span className="text-white font-mono font-semibold">{formatRupiah(tableCost)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Biaya Tambahan Kafe</span>
                    <span className="text-white font-mono font-semibold">{formatRupiah(itemsCost)}</span>
                  </div>
                  
                  {/* Tax and Discount settings */}
                  <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1">Diskon (%)</span>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setCustomDiscount(Math.max(0, customDiscount - 5))} className="p-1 rounded bg-slate-800 text-white cursor-pointer">&minus;</button>
                      <span className="font-mono font-bold text-white text-[11px]">{customDiscount}%</span>
                      <button onClick={() => setCustomDiscount(Math.min(100, customDiscount + 5))} className="p-1 rounded bg-slate-800 text-white cursor-pointer">&#43;</button>
                    </div>
                  </div>

                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Potongan Diskon</span>
                    <span className="text-rose-400 font-mono font-semibold">-{formatRupiah(discountCost)}</span>
                  </div>

                  <div className="flex justify-between text-slate-400">
                    <span>Pajak Resto/Pemerintah ({settings.taxPercent}%)</span>
                    <span className="text-slate-300 font-mono font-semibold">{formatRupiah(taxCost)}</span>
                  </div>

                  {/* Grand Total */}
                  <div className="border-t border-slate-800 pt-3.5 flex justify-between items-center">
                    <span className="text-sm font-bold text-white">Grand Total</span>
                    <span className="text-xl font-mono font-black text-emerald-400">{formatRupiah(grandTotal)}</span>
                  </div>
                </div>

                {/* Payment Selection row */}
                <div className="mt-5 pt-4 border-t border-slate-800 space-y-3">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Metode Pembayaran</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(["Cash", "QRIS", "Transfer", "Debit"] as PaymentMethod[]).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => {
                          setPaymentMethod(method);
                          if (method !== "Cash") {
                            setAmountPaid(grandTotal); // QRIS/Transfer/Debit usually exact amount
                          } else {
                            setAmountPaid("");
                          }
                        }}
                        className={`py-2 px-1.5 rounded-lg border text-center text-xs font-bold transition-all cursor-pointer ${
                          paymentMethod === method
                            ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                            : "bg-slate-950/60 border-slate-850 text-slate-400 hover:text-slate-300"
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount Paid Input */}
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <label>Nominal Dibayar</label>
                    {paymentMethod === "Cash" && (
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setAmountPaid(grandTotal)}
                          className="px-1.5 py-0.5 rounded bg-slate-800 text-[9px] hover:text-white cursor-pointer"
                        >
                          Uang Pas
                        </button>
                        <button
                          type="button"
                          onClick={() => setAmountPaid(50000 * Math.ceil(grandTotal / 50000))}
                          className="px-1.5 py-0.5 rounded bg-slate-800 text-[9px] hover:text-white cursor-pointer"
                        >
                          Keliatan 50k
                        </button>
                        <button
                          type="button"
                          onClick={() => setAmountPaid(100000 * Math.ceil(grandTotal / 100000))}
                          className="px-1.5 py-0.5 rounded bg-slate-800 text-[9px] hover:text-white cursor-pointer"
                        >
                          Keliatan 100k
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">Rp</span>
                    <input
                      type="number"
                      required
                      placeholder="0"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  {finalAmountPaid >= grandTotal && paymentMethod === "Cash" && (
                    <div className="flex justify-between text-xs pt-1">
                      <span className="text-slate-400">Uang Kembalian:</span>
                      <span className="text-emerald-400 font-mono font-bold">{formatRupiah(changeAmount)}</span>
                    </div>
                  )}
                </div>

              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsCheckingOut(false);
                    setActiveCheckoutTable(null);
                  }}
                  className="flex-1 py-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleFinalCheckout}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-widest transition-all cursor-pointer"
                >
                  Bayar & Cetak
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: PRINTER PREVIEW STRUK RECEIPT (THERMAL 58mm)
          ========================================================= */}
      {printedReceipt && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
            <h3 className="text-sm font-bold text-slate-200 mb-4 text-center">Simulasi Struk Kasir Thermal (58mm)</h3>

            {/* Virtual Thermal paper ticket */}
            <div className="bg-white text-slate-900 p-4 font-mono text-[10px] rounded border border-slate-300 shadow-inner max-h-[380px] overflow-y-auto">
              <div className="text-center space-y-0.5">
                <h4 className="text-xs font-bold uppercase">{settings.billiardName}</h4>
                <p className="text-[8px] opacity-80 leading-tight">{settings.billiardAddress}</p>
                <p className="text-[8px] opacity-80">Telp: (021) 8823-1111</p>
                <p className="text-[8px] uppercase border-b border-dashed border-slate-400 py-1 font-bold">Struk Pembayaran</p>
              </div>

              <div className="space-y-0.5 py-2 border-b border-dashed border-slate-400">
                <p>Invoice  : {printedReceipt.invoiceNumber}</p>
                <p>Tanggal  : {new Date(printedReceipt.timestamp).toLocaleDateString("id-ID")} {new Date(printedReceipt.timestamp).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</p>
                <p>Kasir    : {printedReceipt.cashierName}</p>
                <p>Pemain   : {printedReceipt.customer}</p>
              </div>

              <div className="py-2 space-y-1.5 border-b border-dashed border-slate-400">
                <div className="flex justify-between font-bold">
                  <span>Meja {printedReceipt.tableNumber} - {printedReceipt.tableType}</span>
                </div>
                <div className="flex justify-between pl-2 text-[8px] opacity-75">
                  <span>Skema: {printedReceipt.billingType === "Paket" ? `Paket ${printedReceipt.packageHours} Jam` : "Open Play (Sepuasnya)"}</span>
                </div>
                <div className="flex justify-between pl-2">
                  <span>Durasi: {formatDurationText(printedReceipt.durationHours)}</span>
                  <span>{formatRupiah(printedReceipt.tableCost)}</span>
                </div>

                {printedReceipt.items.map((item) => (
                  <div key={item.productId} className="space-y-0.5">
                    <div className="flex justify-between">
                      <span>{item.name}</span>
                      <span>{formatRupiah(item.total)}</span>
                    </div>
                    <div className="text-[8px] opacity-75 pl-2">
                      {item.qty} x {formatRupiah(item.price)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="py-2 space-y-0.5 border-b border-dashed border-slate-400">
                <div className="flex justify-between">
                  <span>Biaya Meja</span>
                  <span>{formatRupiah(printedReceipt.tableCost)}</span>
                </div>
                {printedReceipt.itemsCost > 0 && (
                  <div className="flex justify-between">
                    <span>Biaya Menu</span>
                    <span>{formatRupiah(printedReceipt.itemsCost)}</span>
                  </div>
                )}
                {printedReceipt.discountCost > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Potongan Diskon</span>
                    <span>-{formatRupiah(printedReceipt.discountCost)}</span>
                  </div>
                )}
                {printedReceipt.taxCost > 0 && (
                  <div className="flex justify-between">
                    <span>Pajak ({settings.taxPercent}%)</span>
                    <span>{formatRupiah(printedReceipt.taxCost)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-[11px] pt-1">
                  <span>Grand Total</span>
                  <span>{formatRupiah(printedReceipt.grandTotal)}</span>
                </div>
              </div>

              <div className="py-2 space-y-0.5">
                <div className="flex justify-between">
                  <span>Bayar ({printedReceipt.paymentMethod})</span>
                  <span>{formatRupiah(printedReceipt.amountPaid)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kembalian</span>
                  <span>{formatRupiah(printedReceipt.changeAmount)}</span>
                </div>
              </div>

              <div className="text-center pt-4 border-t border-dashed border-slate-400 space-y-0.5">
                <p className="font-bold">TERIMA KASIH</p>
                <p className="text-[7px]">Harap simpan struk pembayaran ini</p>
                <p className="text-[7px] italic">Powered by B8 Billiard POS</p>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Receipt className="w-4 h-4" />
                <span>Cetak Struk (PDF)</span>
              </button>
              <button
                onClick={() => setPrintedReceipt(null)}
                className="py-3 px-4 bg-slate-900 hover:bg-slate-750 text-slate-300 font-bold rounded-xl text-xs cursor-pointer border border-slate-700"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
