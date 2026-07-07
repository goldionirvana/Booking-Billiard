import React, { useState } from "react";
import { Search, Calendar, FileText, Download, TrendingUp, BarChart2, Star, Filter, Coffee, Clock } from "lucide-react";
import { Transaction, Table, Product } from "../types";
import { formatRupiah } from "../utils";

interface LaporanProps {
  transactions: Transaction[];
  tables: Table[];
  products: Product[];
}

type PeriodFilter = "Hari Ini" | "7 Hari Terakhir" | "Bulan Ini" | "Semua Waktu" | "Kustom";

export default function Laporan({ transactions, tables, products }: LaporanProps) {
  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [period, setPeriod] = useState<PeriodFilter>("Semua Waktu");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const completedTrans = transactions.filter((t) => t.status === "Selesai");

  // Filter Logic
  const filteredTrans = completedTrans.filter((t) => {
    // 1. Search Query
    const matchesSearch = 
      t.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tableNumber.includes(searchQuery);

    if (!matchesSearch) return false;

    // 2. Period/Date range
    const txDate = new Date(t.timestamp);
    const todayStr = new Date().toISOString().split("T")[0];
    const txDateStr = t.date; // YYYY-MM-DD

    if (period === "Hari Ini") {
      return txDateStr === todayStr;
    } else if (period === "7 Hari Terakhir") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return txDate >= sevenDaysAgo;
    } else if (period === "Bulan Ini") {
      const now = new Date();
      return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
    } else if (period === "Kustom") {
      if (!startDate && !endDate) return true;
      const tTime = txDate.getTime();
      const sTime = startDate ? new Date(startDate + "T00:00:00").getTime() : 0;
      const eTime = endDate ? new Date(endDate + "T23:59:59").getTime() : Infinity;
      return tTime >= sTime && tTime <= eTime;
    }

    return true; // Semua Waktu
  });

  // =========================================================
  // ANALYTICS & RANKINGS
  // =========================================================

  // 1. Meja Terlaris (Top Tables)
  const tableRankMap: { [number: string]: { name: string; type: string; bookings: number; revenue: number } } = {};
  filteredTrans.forEach((t) => {
    if (!tableRankMap[t.tableNumber]) {
      tableRankMap[t.tableNumber] = { name: `Meja ${t.tableNumber}`, type: t.tableType, bookings: 0, revenue: 0 };
    }
    tableRankMap[t.tableNumber].bookings++;
    tableRankMap[t.tableNumber].revenue += t.tableCost;
  });
  const topTables = Object.keys(tableRankMap)
    .map((num) => ({ number: num, ...tableRankMap[num] }))
    .sort((a, b) => b.bookings - a.bookings);

  // 2. Produk Terlaris (Top Café Items)
  const productRankMap: { [name: string]: { qty: number; revenue: number } } = {};
  filteredTrans.forEach((t) => {
    t.items.forEach((item) => {
      if (!productRankMap[item.name]) {
        productRankMap[item.name] = { qty: 0, revenue: 0 };
      }
      productRankMap[item.name].qty += item.qty;
      productRankMap[item.name].revenue += item.total;
    });
  });
  const topProducts = Object.keys(productRankMap)
    .map((name) => ({ name: name, ...productRankMap[name] }))
    .sort((a, b) => b.qty - a.qty);

  // 3. Customer Terbanyak (Top Loyal Customers)
  const customerRankMap: { [name: string]: { visits: number; spent: number } } = {};
  filteredTrans.forEach((t) => {
    const cust = t.customer || "Guest";
    if (!customerRankMap[cust]) {
      customerRankMap[cust] = { visits: 0, spent: 0 };
    }
    customerRankMap[cust].visits++;
    customerRankMap[cust].spent += t.grandTotal;
  });
  const topCustomers = Object.keys(customerRankMap)
    .map((name) => ({ name: name, ...customerRankMap[name] }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 5); // top 5 customers

  // Overall financial sums of filtered transactions
  const totalRevenue = filteredTrans.reduce((sum, t) => sum + t.grandTotal, 0);
  const totalTableRevenue = filteredTrans.reduce((sum, t) => sum + t.tableCost, 0);
  const totalCafeRevenue = filteredTrans.reduce((sum, t) => sum + t.itemsCost, 0);

  // EXPORT TO EXCEL (CSV Format generation)
  const exportToExcel = () => {
    if (filteredTrans.length === 0) {
      alert("Tidak ada data untuk diekspor.");
      return;
    }

    // Prepare CSV header
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Invoice,Tanggal,Customer,Nomor Meja,Jenis Meja,Tarif/Jam,Mulai,Selesai,Durasi (Jam),Biaya Meja,Biaya Kafe,Pajak,Diskon,Grand Total,Metode Bayar,Kasir\r\n";

    // Loop lines
    filteredTrans.forEach((t) => {
      const line = [
        t.invoiceNumber,
        t.date,
        `"${t.customer}"`,
        t.tableNumber,
        `"${t.tableType}"`,
        t.pricePerHour,
        new Date(t.startTime).toLocaleTimeString("id-ID"),
        t.endTime ? new Date(t.endTime).toLocaleTimeString("id-ID") : "-",
        t.durationHours,
        t.tableCost,
        t.itemsCost,
        t.taxCost,
        t.discountCost,
        t.grandTotal,
        t.paymentMethod,
        t.cashierName
      ].join(",");
      csvContent += line + "\r\n";
    });

    // Generate link and download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Riwayat_Transaksi_${period.replace(" ", "_")}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // EXPORT TO PDF (Standard Printer view of Table)
  const exportToPdf = () => {
    // We open a new window and render a pristine black-and-white ledger list for printing.
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Popup blocker menghalangi ekspor PDF. Izinkan popup untuk website ini.");
      return;
    }

    const html = `
      <html>
        <head>
          <title>Laporan Transaksi Billiard</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 30px; color: #333; font-size: 11px; }
            h1 { text-align: center; margin-bottom: 5px; font-size: 18px; text-transform: uppercase; }
            h3 { text-align: center; font-weight: normal; margin-top: 0; color: #666; margin-bottom: 25px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #ddd; padding: 8px 10px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; font-size: 10px; text-transform: uppercase; }
            .right { text-align: right; }
            .bold { font-weight: bold; }
            .footer-info { margin-top: 40px; display: flex; justify-content: space-between; font-size: 10px; color: #777; }
            .summary { margin-top: 20px; font-size: 12px; font-weight: bold; float: right; border: 1px solid #333; padding: 10px; background-color: #fafafa; }
          </style>
        </head>
        <body>
          <h1>Laporan Riwayat Transaksi Billiard</h1>
          <h3>Periode: ${period} (${startDate || "Awal"} s/d ${endDate || "Hari Ini"})</h3>
          
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Tanggal</th>
                <th>Customer</th>
                <th>Meja</th>
                <th>Durasi (Jam)</th>
                <th class="right">Biaya Meja</th>
                <th class="right">Biaya Kafe</th>
                <th class="right">Pajak</th>
                <th class="right">Diskon</th>
                <th class="right">Grand Total</th>
                <th>Pembayaran</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTrans.map((t) => `
                <tr>
                  <td>${t.invoiceNumber}</td>
                  <td>${new Date(t.timestamp).toLocaleDateString("id-ID")} ${new Date(t.timestamp).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</td>
                  <td>${t.customer}</td>
                  <td>Meja ${t.tableNumber}</td>
                  <td>${t.durationHours.toFixed(2)} jam</td>
                  <td class="right">Rp ${t.tableCost.toLocaleString("id-ID")}</td>
                  <td class="right">Rp ${t.itemsCost.toLocaleString("id-ID")}</td>
                  <td class="right">Rp ${t.taxCost.toLocaleString("id-ID")}</td>
                  <td class="right">Rp ${t.discountCost.toLocaleString("id-ID")}</td>
                  <td class="bold right">Rp ${t.grandTotal.toLocaleString("id-ID")}</td>
                  <td>${t.paymentMethod}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <div class="summary">
            <p>Total Sewa Meja: Rp ${totalTableRevenue.toLocaleString("id-ID")}</p>
            <p>Total Penjualan Kafe: Rp ${totalCafeRevenue.toLocaleString("id-ID")}</p>
            <p style="border-top: 1px solid #ddd; padding-top: 5px; font-size: 13px; color: #00875a;">Total Pendapatan: Rp ${totalRevenue.toLocaleString("id-ID")}</p>
          </div>

          <div class="footer-info" style="clear: both; margin-top: 50px;">
            <p>Dicetak pada: ${new Date().toLocaleString("id-ID")}</p>
            <p>Otorisasi Manajemen Billiard</p>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      
      {/* Upper section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Laporan & Riwayat Transaksi</h1>
          <p className="text-slate-400 text-sm">Lacak seluruh invoice transaksi billiard, filter omzet periode, dan ekspor data pembukuan.</p>
        </div>
        
        {/* Export buttons */}
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={exportToExcel}
            className="flex-1 md:flex-initial px-4 py-2.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Ekspor Excel</span>
          </button>
          <button
            onClick={exportToPdf}
            className="flex-1 md:flex-initial px-4 py-2.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-rose-400" />
            <span>Ekspor PDF (Cetak)</span>
          </button>
        </div>
      </div>

      {/* Filter Ribbon Panel */}
      <div className="bg-slate-800 border border-slate-700/50 p-5 rounded-2xl flex flex-col md:flex-row gap-4 items-end justify-between">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
          
          {/* Filter 1: Search */}
          <div className="md:col-span-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Cari Transaksi</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="No Invoice, Pemain, Meja"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full"
              />
            </div>
          </div>

          {/* Filter 2: Period */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Rentang Waktu</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodFilter)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              <option value="Semua Waktu">Semua Waktu</option>
              <option value="Hari Ini">Hari Ini</option>
              <option value="7 Hari Terakhir">7 Hari Terakhir</option>
              <option value="Bulan Ini">Bulan Ini</option>
              <option value="Kustom">Kustom Tanggal</option>
            </select>
          </div>

          {/* Filter 3 & 4: Custom Calendar dates */}
          {period === "Kustom" && (
            <>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Mulai Tanggal</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Sampai Tanggal</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>
            </>
          )}

        </div>

        {/* Display filtered revenue totals */}
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-750 flex items-center gap-4 w-full md:w-auto">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Omzet Terfilter</span>
            <span className="text-lg font-mono font-black text-emerald-400">{formatRupiah(totalRevenue)}</span>
          </div>
          <TrendingUp className="w-8 h-8 text-emerald-400 shrink-0 opacity-80" />
        </div>
      </div>

      {/* Business Intelligence Analytical Leaderboard grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Panel 1: Meja Terlaris */}
        <div className="bg-slate-800 border border-slate-700/50 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Paling Sering Disewa (Meja)</h3>
          </div>
          
          <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
            {topTables.map((t, idx) => {
              const maxBookings = topTables[0]?.bookings || 1;
              const pct = (t.bookings / maxBookings) * 100;

              return (
                <div key={t.number} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-200">Meja {t.number} <span className="text-[10px] text-slate-400 font-normal">({t.type})</span></span>
                    <span className="font-mono text-slate-400">{t.bookings} kali bermain</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                    <div style={{ width: `${pct}%` }} className="h-full bg-gradient-to-r from-emerald-500 to-teal-400" />
                  </div>
                  <p className="text-[10px] text-right text-emerald-400 font-mono font-semibold">{formatRupiah(t.revenue)}</p>
                </div>
              );
            })}
            {topTables.length === 0 && (
              <p className="text-xs text-slate-500 italic py-4">Belum ada riwayat sewa meja.</p>
            )}
          </div>
        </div>

        {/* Panel 2: Produk Terlaris */}
        <div className="bg-slate-800 border border-slate-700/50 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Coffee className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Produk Kafe Paling Laris</h3>
          </div>

          <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
            {topProducts.map((p, idx) => {
              const maxQty = topProducts[0]?.qty || 1;
              const pct = (p.qty / maxQty) * 100;

              return (
                <div key={p.name} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-200">{p.name}</span>
                    <span className="font-mono text-slate-400">{p.qty} pcs</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                    <div style={{ width: `${pct}%` }} className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" />
                  </div>
                  <p className="text-[10px] text-right text-indigo-400 font-mono font-semibold">{formatRupiah(p.revenue)}</p>
                </div>
              );
            })}
            {topProducts.length === 0 && (
              <p className="text-xs text-slate-500 italic py-4">Belum ada penjualan makanan/minuman.</p>
            )}
          </div>
        </div>

        {/* Panel 3: Pelanggan Setia */}
        <div className="bg-slate-800 border border-slate-700/50 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Daftar Customer Terbanyak</h3>
          </div>

          <div className="space-y-4">
            {topCustomers.map((c, idx) => (
              <div key={c.name} className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-slate-750">
                <div className="text-xs">
                  <p className="font-bold text-white">{c.name}</p>
                  <p className="text-[10px] text-slate-400">{c.visits}x Booking Bermain</p>
                </div>
                <div className="text-right text-xs">
                  <p className="font-mono font-bold text-amber-400">{formatRupiah(c.spent)}</p>
                  <span className="text-[9px] text-slate-500 font-semibold uppercase">Total Belanja</span>
                </div>
              </div>
            ))}
            {topCustomers.length === 0 && (
              <p className="text-xs text-slate-500 italic py-4">Belum ada riwayat booking.</p>
            )}
          </div>
        </div>

      </div>

      {/* Audit History Transaction Log Table */}
      <div className="bg-slate-800 border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-700/50 bg-slate-800/40">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-emerald-400" />
            <span>Riwayat Arsip Invoice Transaksi Selesai</span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700/50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-900/40">
                <th className="py-4 px-6">No Invoice</th>
                <th className="py-4 px-6">Tanggal / Waktu</th>
                <th className="py-4 px-6">Customer</th>
                <th className="py-4 px-6">Nomor Meja</th>
                <th className="py-4 px-6 text-center">Durasi Bermain</th>
                <th className="py-4 px-6 text-right">Biaya Meja</th>
                <th className="py-4 px-6 text-right">Biaya Kafe</th>
                <th className="py-4 px-6 text-right font-bold">Grand Total</th>
                <th className="py-4 px-6 text-center">Pembayaran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30 text-xs text-slate-300">
              {filteredTrans.map((t) => (
                <tr key={t.invoiceNumber} className="hover:bg-slate-750/30 transition-all group">
                  
                  {/* Invoice */}
                  <td className="py-4 px-6 font-mono font-extrabold text-emerald-400 group-hover:underline">
                    {t.invoiceNumber}
                  </td>

                  {/* Tanggal */}
                  <td className="py-4 px-6 font-mono text-[11px] text-slate-400">
                    {new Date(t.timestamp).toLocaleDateString("id-ID")} {new Date(t.timestamp).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                  </td>

                  {/* Customer */}
                  <td className="py-4 px-6 font-bold text-white">
                    {t.customer}
                  </td>

                  {/* Nomor Meja */}
                  <td className="py-4 px-6 font-semibold">
                    Meja {t.tableNumber}
                    <span className="block text-[10px] text-slate-500 font-normal">{t.tableType}</span>
                  </td>

                  {/* Durasi */}
                  <td className="py-4 px-6 text-center font-mono">
                    {t.durationHours.toFixed(2)} jam
                  </td>

                  {/* Biaya Meja */}
                  <td className="py-4 px-6 text-right font-mono text-slate-400">
                    {formatRupiah(t.tableCost)}
                  </td>

                  {/* Biaya Kafe */}
                  <td className="py-4 px-6 text-right font-mono text-slate-400">
                    {t.itemsCost > 0 ? formatRupiah(t.itemsCost) : "-"}
                  </td>

                  {/* Grand Total */}
                  <td className="py-4 px-6 text-right font-mono font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {formatRupiah(t.grandTotal)}
                  </td>

                  {/* Pembayaran */}
                  <td className="py-4 px-6 text-center">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-900 border border-slate-800 text-slate-300">
                      {t.paymentMethod}
                    </span>
                  </td>

                </tr>
              ))}
              {filteredTrans.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-500 italic">
                    Belum ada riwayat transaksi selesai untuk filter yang dipilih.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
