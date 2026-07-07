import React, { useState } from "react";
import { Plus, Edit2, Trash2, Check, X, ShieldCheck, ShieldAlert, Award, FileSpreadsheet, TrendingUp, TrendingDown, BookOpen } from "lucide-react";
import { Transaction, Expense, ExpenseCategory } from "../types";
import { formatRupiah } from "../utils";

interface PembukuanProps {
  transactions: Transaction[];
  expenses: Expense[];
  userRole: string;
  onUpdateExpenses: (updated: Expense[]) => void;
  onShowNotification: (msg: string, type: "success" | "error" | "info") => void;
}

export default function Pembukuan({ transactions, expenses, userRole, onUpdateExpenses, onShowNotification }: PembukuanProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields for new Expense
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState<ExpenseCategory>("Operasional");
  const [amount, setAmount] = useState(100000);
  const [note, setNote] = useState("");

  const [isAdding, setIsAdding] = useState(false);

  // Restrict bookkeeping access to Admin
  if (userRole !== "Admin") {
    return (
      <div className="bg-slate-800 border border-slate-700/50 rounded-2xl p-8 text-center max-w-lg mx-auto">
        <ShieldAlert className="w-16 h-16 text-rose-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Akses Ditolak</h2>
        <p className="text-slate-400 text-sm">Maaf, menu Pembukuan Keuangan hanya dapat diakses oleh Admin untuk melindungi data sensitif keuangan usaha.</p>
      </div>
    );
  }

  // =========================================================
  // CALCULATE INCOMES FROM TRANSACTIONS
  // =========================================================
  const completedTrans = transactions.filter((t) => t.status === "Selesai");

  const todayStr = new Date().toISOString().split("T")[0];
  const now = new Date();

  // Weekly bound (7 days ago)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);

  let revDaily = 0;
  let revWeekly = 0;
  let revMonthly = 0;
  let revYearly = 0;

  // Revenue channels categories
  let incomeBilliardSewa = 0;
  let incomeMinuman = 0;
  let incomeMakanan = 0; // Makanan + Snack

  completedTrans.forEach((t) => {
    const tDate = new Date(t.timestamp);
    const amountVal = Number(t.grandTotal || 0);

    // Sum overall incomes
    if (t.date === todayStr) revDaily += amountVal;
    if (tDate >= sevenDaysAgo) revWeekly += amountVal;
    if (tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear()) revMonthly += amountVal;
    if (tDate.getFullYear() === now.getFullYear()) revYearly += amountVal;

    // Categorized streams
    incomeBilliardSewa += Number(t.tableCost || 0);
    
    // Scan items to split Beverage vs Food/Snack
    t.items.forEach((item) => {
      // Best effort matching if category isn't there, we check common items or initial structures
      const pName = item.name.toLowerCase();
      if (pName.includes("teh") || pName.includes("cola") || pName.includes("aqua") || pName.includes("juice") || pName.includes("drink")) {
        incomeMinuman += Number(item.total || 0);
      } else {
        // Makanan + Snack
        incomeMakanan += Number(item.total || 0);
      }
    });
  });

  // =========================================================
  // CALCULATE OPERATIONAL EXPENSES
  // =========================================================
  let totalExpenses = 0;
  let expGaji = 0;
  let expListrik = 0;
  let expAir = 0;
  let expInternet = 0;
  let expPerawatanMeja = 0;
  let expOperasional = 0;

  expenses.forEach((e) => {
    const val = Number(e.amount || 0);
    totalExpenses += val;

    switch (e.category) {
      case "Gaji": expGaji += val; break;
      case "Listrik": expListrik += val; break;
      case "Air": expAir += val; break;
      case "Internet": expInternet += val; break;
      case "Perawatan Meja": expPerawatanMeja += val; break;
      case "Operasional": expOperasional += val; break;
    }
  });

  // Accounting aggregates
  const totalRevenue = incomeBilliardSewa + incomeMinuman + incomeMakanan;
  const netProfit = totalRevenue - totalExpenses;

  // CRUD handlers for Expenses
  const handleStartAdd = () => {
    setDate(new Date().toISOString().split("T")[0]);
    setCategory("Operasional");
    setAmount(100000);
    setNote("");
    setIsAdding(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) {
      onShowNotification("Keterangan pengeluaran wajib diisi", "error");
      return;
    }

    const newExp: Expense = {
      id: "E" + Math.floor(Math.random() * 1000000),
      date: date,
      category: category,
      amount: Number(amount),
      note: note.trim()
    };

    onUpdateExpenses([newExp, ...expenses]);
    setIsAdding(false);
    onShowNotification(`Pengeluaran senilai ${formatRupiah(amount)} berhasil dicatat!`, "success");
  };

  const handleStartEdit = (exp: Expense) => {
    setEditingId(exp.id);
    setDate(exp.date);
    setCategory(exp.category);
    setAmount(exp.amount);
    setNote(exp.note);
  };

  const handleSaveEdit = (id: string) => {
    if (!note.trim()) {
      onShowNotification("Keterangan wajib diisi", "error");
      return;
    }

    const updated = expenses.map((e) => {
      if (e.id === id) {
        return {
          ...e,
          date: date,
          category: category,
          amount: Number(amount),
          note: note.trim()
        };
      }
      return e;
    });

    onUpdateExpenses(updated);
    setEditingId(null);
    onShowNotification("Catatan pengeluaran berhasil diubah!", "success");
  };

  const handleDelete = (id: string, detail: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus catatan pengeluaran "${detail}"?`)) {
      const filtered = expenses.filter((e) => e.id !== id);
      onUpdateExpenses(filtered);
      onShowNotification("Catatan pengeluaran dihapus!", "success");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Pembukuan & Laba Rugi</h1>
          <p className="text-slate-400 text-sm">Analisis arus kas (cash flow), pemasukan sewa/kafe, dan pencatatan pengeluaran.</p>
        </div>
        {!isAdding && (
          <button
            onClick={handleStartAdd}
            className="px-5 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-all shadow-lg cursor-pointer flex items-center gap-1.5 text-xs uppercase tracking-wider"
          >
            <Plus className="w-4 h-4 text-white stroke-[3px]" />
            <span>Catat Pengeluaran</span>
          </button>
        )}
      </div>

      {/* Cash Flow Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Harian */}
        <div className="bg-slate-850 p-4 border border-slate-750 rounded-xl">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pendapatan Hari Ini</p>
          <h4 className="text-lg font-bold text-emerald-400 mt-1 font-mono">{formatRupiah(revDaily)}</h4>
          <span className="text-[9px] text-slate-500">Omzet 24 jam terakhir</span>
        </div>

        {/* Mingguan */}
        <div className="bg-slate-850 p-4 border border-slate-750 rounded-xl">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pendapatan Mingguan</p>
          <h4 className="text-lg font-bold text-indigo-400 mt-1 font-mono">{formatRupiah(revWeekly)}</h4>
          <span className="text-[9px] text-slate-500">Omzet 7 hari terakhir</span>
        </div>

        {/* Bulanan */}
        <div className="bg-slate-850 p-4 border border-slate-750 rounded-xl">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pendapatan Bulanan</p>
          <h4 className="text-lg font-bold text-sky-400 mt-1 font-mono">{formatRupiah(revMonthly)}</h4>
          <span className="text-[9px] text-slate-500">Omzet bulan berjalan</span>
        </div>

        {/* Tahunan */}
        <div className="bg-slate-850 p-4 border border-slate-750 rounded-xl">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pendapatan Tahunan</p>
          <h4 className="text-lg font-bold text-teal-400 mt-1 font-mono">{formatRupiah(revYearly)}</h4>
          <span className="text-[9px] text-slate-500">Omzet tahun berjalan</span>
        </div>

      </div>

      {/* Accounting Profit & Loss Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column (2 cols): Laporan Laba Rugi Visual */}
        <div className="lg:col-span-1 bg-slate-800 border border-slate-700/50 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="border-b border-slate-750 pb-3 flex justify-between items-center">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              <span>Laporan Laba Rugi</span>
            </h2>
            <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
              Sederhana
            </span>
          </div>

          {/* Revenue channels details */}
          <div className="space-y-3.5 text-xs">
            <h3 className="font-bold text-slate-300 uppercase tracking-wide text-[10px] flex items-center gap-1.5 text-emerald-400">
              <TrendingUp className="w-4 h-4" /> Pemasukan Usaha (Inflow)
            </h3>
            
            <div className="space-y-2 pl-2">
              <div className="flex justify-between text-slate-400">
                <span>1. Sewa Meja Billiard</span>
                <span className="text-white font-mono">{formatRupiah(incomeBilliardSewa)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>2. Penjualan Minuman Kafe</span>
                <span className="text-white font-mono">{formatRupiah(incomeMinuman)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>3. Penjualan Makanan & Snack</span>
                <span className="text-white font-mono">{formatRupiah(incomeMakanan)}</span>
              </div>
              
              <div className="border-t border-slate-750 pt-2.5 flex justify-between font-bold text-slate-300">
                <span>Total Pendapatan Kotor</span>
                <span className="text-emerald-400 font-mono">{formatRupiah(totalRevenue)}</span>
              </div>
            </div>
          </div>

          {/* Expenses details */}
          <div className="space-y-3.5 text-xs pt-3 border-t border-slate-750">
            <h3 className="font-bold text-slate-300 uppercase tracking-wide text-[10px] flex items-center gap-1.5 text-rose-400">
              <TrendingDown className="w-4 h-4" /> Pengeluaran Operasional (Outflow)
            </h3>

            <div className="space-y-2 pl-2">
              <div className="flex justify-between text-slate-400">
                <span>1. Gaji Karyawan/Kasir</span>
                <span className="text-white font-mono">{formatRupiah(expGaji)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>2. Listrik (PLN)</span>
                <span className="text-white font-mono">{formatRupiah(expListrik)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>3. Air PAM</span>
                <span className="text-white font-mono">{formatRupiah(expAir)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>4. Internet & Wifi</span>
                <span className="text-white font-mono">{formatRupiah(expInternet)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>5. Perawatan Meja (Laken, Bola, Stik)</span>
                <span className="text-white font-mono">{formatRupiah(expPerawatanMeja)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>6. Operasional Toko / Kafe</span>
                <span className="text-white font-mono">{formatRupiah(expOperasional)}</span>
              </div>

              <div className="border-t border-slate-750 pt-2.5 flex justify-between font-bold text-slate-300">
                <span>Total Pengeluaran</span>
                <span className="text-rose-400 font-mono">{formatRupiah(totalExpenses)}</span>
              </div>
            </div>
          </div>

          {/* NET profit result card */}
          <div className="bg-slate-900 border border-slate-750 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Laba Bersih (Net Profit)</p>
              <h3 className={`text-xl font-mono font-black mt-1 ${netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {formatRupiah(netProfit)}
              </h3>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${netProfit >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
              <Award className="w-6 h-6" />
            </div>
          </div>

        </div>

        {/* Right column (2 cols): Expenses Log and CRUD */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Add expense form drawer */}
          {isAdding && (
            <div className="bg-slate-800 border border-slate-700/50 p-6 rounded-2xl shadow-xl space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider text-rose-400">Pencatatan Pengeluaran Baru</h3>
              <form onSubmit={handleSaveAdd} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-750 rounded-xl text-white focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-750 rounded-xl text-white focus:outline-none text-xs"
                  >
                    <option value="Gaji">Gaji Karyawan</option>
                    <option value="Listrik">Listrik</option>
                    <option value="Air">Air</option>
                    <option value="Internet">Internet</option>
                    <option value="Perawatan Meja">Perawatan Meja</option>
                    <option value="Operasional">Operasional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Jumlah (Rp)</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-750 rounded-xl text-white font-mono font-bold focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Keterangan / Memo</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="e.g., Bayar wifi IndiHome"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-750 rounded-xl text-white focus:outline-none text-xs"
                    />
                    <button type="submit" className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer">
                      Simpan
                    </button>
                    <button type="button" onClick={() => setIsAdding(false)} className="px-3 bg-slate-900 border border-slate-750 text-slate-400 rounded-xl text-xs cursor-pointer">
                      X
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Expenses List Panel */}
          <div className="bg-slate-800 border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-700/50 bg-slate-800/40 flex justify-between items-center">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-rose-400" />
                <span>Log Jurnal Pengeluaran Operasional</span>
              </h2>
              <span className="text-xs text-slate-400">Total Transaksi: {expenses.length}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-700/50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-900/40">
                    <th className="py-4 px-6">Tanggal</th>
                    <th className="py-4 px-6">Kategori</th>
                    <th className="py-4 px-6">Keterangan / Detail</th>
                    <th className="py-4 px-6 text-right">Jumlah</th>
                    <th className="py-4 px-6 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30 text-xs text-slate-300">
                  {expenses.map((exp) => {
                    const isEditing = editingId === exp.id;

                    return (
                      <tr key={exp.id} className="hover:bg-slate-750/30 transition-all">
                        
                        {/* Tanggal */}
                        <td className="py-4 px-6 font-mono text-[11px] text-slate-400">
                          {isEditing ? (
                            <input
                              type="date"
                              value={date}
                              onChange={(e) => setDate(e.target.value)}
                              className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                            />
                          ) : (
                            new Date(exp.date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
                          )}
                        </td>

                        {/* Kategori */}
                        <td className="py-4 px-6">
                          {isEditing ? (
                            <select
                              value={category}
                              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                              className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                            >
                              <option value="Gaji">Gaji</option>
                              <option value="Listrik">Listrik</option>
                              <option value="Air">Air</option>
                              <option value="Internet">Internet</option>
                              <option value="Perawatan Meja">Perawatan Meja</option>
                              <option value="Operasional">Operasional</option>
                            </select>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/15">
                              {exp.category}
                            </span>
                          )}
                        </td>

                        {/* Keterangan */}
                        <td className="py-4 px-6 font-medium text-slate-200">
                          {isEditing ? (
                            <input
                              type="text"
                              value={note}
                              onChange={(e) => setNote(e.target.value)}
                              className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white w-full max-w-xs"
                            />
                          ) : (
                            exp.note
                          )}
                        </td>

                        {/* Jumlah */}
                        <td className="py-4 px-6 text-right font-mono font-bold text-rose-400">
                          {isEditing ? (
                            <input
                              type="number"
                              value={amount}
                              onChange={(e) => setAmount(Number(e.target.value))}
                              className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono text-right w-24"
                            />
                          ) : (
                            formatRupiah(exp.amount)
                          )}
                        </td>

                        {/* Aksi */}
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => handleSaveEdit(exp.id)}
                                  className="w-7 h-7 rounded bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 flex items-center justify-center cursor-pointer border border-emerald-500/20"
                                >
                                  <Check className="w-3.5 h-3.5 stroke-[3px]" />
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="w-7 h-7 rounded bg-slate-900 hover:bg-slate-750 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer border border-slate-700"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleStartEdit(exp)}
                                  className="w-7 h-7 rounded bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white flex items-center justify-center cursor-pointer border border-indigo-500/20"
                                  title="Edit Jurnal"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDelete(exp.id, exp.note)}
                                  className="w-7 h-7 rounded bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white flex items-center justify-center cursor-pointer border border-rose-500/20"
                                  title="Hapus Jurnal"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                  {expenses.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-500 italic">
                        Belum ada pengeluaran operasional yang dicatat.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
