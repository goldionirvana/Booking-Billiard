import { Users, DollarSign, CreditCard, Play, Coffee, AlertTriangle } from "lucide-react";
import { Table, Transaction, Expense } from "../types";
import { formatRupiah } from "../utils";

interface DashboardProps {
  tables: Table[];
  transactions: Transaction[];
  expenses: Expense[];
  onNavigateToView: (view: string) => void;
}

export default function Dashboard({ tables, transactions, expenses, onNavigateToView }: DashboardProps) {
  const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  // Statistics calculation
  let revenueToday = 0;
  let revenueMonth = 0;
  let transactionCountToday = 0;
  const customersToday: { [key: string]: boolean } = {};

  transactions.forEach((t) => {
    if (t.status === "Selesai") {
      const tDate = new Date(t.timestamp);
      if (t.date === todayStr) {
        revenueToday += t.grandTotal;
        transactionCountToday++;
        if (t.customer) {
          customersToday[t.customer] = true;
        }
      }
      if (tDate.getMonth() === thisMonth && tDate.getFullYear() === thisYear) {
        revenueMonth += t.grandTotal;
      }
    }
  });

  const tablesInUse = tables.filter((t) => t.status === "Dipakai").length;
  const tablesAvailable = tables.filter((t) => t.status === "Kosong").length;
  const tablesMaintenance = tables.filter((t) => t.status === "Maintenance").length;
  const customerCountToday = Object.keys(customersToday).length;

  // Chart Data Calculations (Last 7 Days)
  const last7Days: string[] = [];
  const dailyRevenues: number[] = [];
  const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const last7DayNames: string[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const dStr = d.toISOString().split("T")[0];
    last7Days.push(dStr);
    last7DayNames.push(dayNames[d.getDay()]);

    const dayTotal = transactions
      .filter((t) => t.status === "Selesai" && t.date === dStr)
      .reduce((sum, t) => sum + t.grandTotal, 0);
    dailyRevenues.push(dayTotal);
  }

  // Monthly Revenue Calculation (Last 6 Months)
  const last6MonthsNames: string[] = [];
  const monthlyRevenues: number[] = [];
  const monthNamesIndo = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(now.getMonth() - i);
    last6MonthsNames.push(monthNamesIndo[d.getMonth()]);

    const mTotal = transactions
      .filter((t) => {
        if (t.status !== "Selesai") return false;
        const txDate = new Date(t.timestamp);
        return txDate.getMonth() === d.getMonth() && txDate.getFullYear() === d.getFullYear();
      })
      .reduce((sum, t) => sum + t.grandTotal, 0);
    monthlyRevenues.push(mTotal);
  }

  // Peak Hours distribution (Simulated based on actual/dummy transaction timestamps)
  // Let's divide into blocks: Morning (09-12), Afternoon (12-15), Evening (15-18), Night (18-21), Late Night (21-24)
  const hourBlocks = ["09:00 - 12:00", "12:00 - 15:00", "15:00 - 18:00", "18:00 - 21:00", "21:00 - 24:00"];
  const hourCounts = [2, 4, 8, 15, 12]; // Default distribution

  // Adjust peak hour block with mock values if transactions exist
  transactions.forEach((t) => {
    const tHour = new Date(t.timestamp).getHours();
    if (tHour >= 9 && tHour < 12) hourCounts[0]++;
    else if (tHour >= 12 && tHour < 15) hourCounts[1]++;
    else if (tHour >= 15 && tHour < 18) hourCounts[2]++;
    else if (tHour >= 18 && tHour < 21) hourCounts[3]++;
    else if (tHour >= 21 && tHour < 24) hourCounts[4]++;
  });

  const maxRevenue = Math.max(...dailyRevenues, 500000);
  const maxMonthRevenue = Math.max(...monthlyRevenues, 1000000);
  const maxHours = Math.max(...hourCounts, 5);

  return (
    <div className="space-y-6">
      
      {/* Welcome Heading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard Overview</h1>
          <p className="text-gray-400 text-sm">Status real-time meja billiard dan statistik pembukuan keuangan hari ini.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">Pembaruan otomatis:</span>
          <span className="flex items-center gap-1.5 text-xs font-medium text-green-500 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            System Live
          </span>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-6">
        
        {/* Card 1: Pendapatan Hari Ini */}
        <div className="bg-[#1a1c23] border border-gray-800 p-5 rounded-2xl relative overflow-hidden shadow-xl group hover:border-indigo-500/30 transition-all">
          <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-indigo-600/10 flex items-center justify-center text-indigo-400">
            <DollarSign className="w-4 h-4" />
          </div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Pemasukan Hari Ini</p>
          <h3 className="text-xl font-bold text-white mt-2 tracking-tight truncate">{formatRupiah(revenueToday)}</h3>
          <p className="text-[10px] text-indigo-400 mt-2 font-medium">Sewa & Kafe</p>
        </div>

        {/* Card 2: Pendapatan Bulan Ini */}
        <div className="bg-[#1a1c23] border border-gray-800 p-5 rounded-2xl relative overflow-hidden shadow-xl group hover:border-indigo-500/30 transition-all">
          <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-purple-600/10 flex items-center justify-center text-purple-400">
            <DollarSign className="w-4 h-4" />
          </div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Bulan Ini</p>
          <h3 className="text-xl font-bold text-white mt-2 tracking-tight truncate">{formatRupiah(revenueMonth)}</h3>
          <p className="text-[10px] text-purple-400 mt-2 font-medium">Akumulasi Juli</p>
        </div>

        {/* Card 3: Jumlah Transaksi Hari Ini */}
        <div className="bg-[#1a1c23] border border-gray-800 p-5 rounded-2xl relative overflow-hidden shadow-xl group hover:border-indigo-500/30 transition-all">
          <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
            <CreditCard className="w-4 h-4" />
          </div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Transaksi Hari Ini</p>
          <h3 className="text-xl font-bold text-white mt-2 tracking-tight">{transactionCountToday}</h3>
          <p className="text-[10px] text-amber-400 mt-2 font-medium">Invoice Selesai</p>
        </div>

        {/* Card 4: Meja Sedang Digunakan */}
        <div className="bg-[#1a1c23] border border-gray-800 p-5 rounded-2xl relative overflow-hidden shadow-xl group hover:border-rose-500/30 transition-all cursor-pointer" onClick={() => onNavigateToView("transaksi")}>
          <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
            <Play className="w-4 h-4 animate-pulse" />
          </div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Meja Dipakai</p>
          <h3 className="text-xl font-bold text-rose-400 mt-2 tracking-tight">{tablesInUse}</h3>
          <p className="text-[10px] text-rose-400 mt-2 font-semibold hover:underline">Sewa Aktif &rarr;</p>
        </div>

        {/* Card 5: Meja Kosong */}
        <div className="bg-[#1a1c23] border border-gray-800 p-5 rounded-2xl relative overflow-hidden shadow-xl group hover:border-indigo-500/30 transition-all cursor-pointer" onClick={() => onNavigateToView("transaksi")}>
          <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
            <Play className="w-4 h-4" />
          </div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Meja Kosong</p>
          <h3 className="text-xl font-bold text-green-400 mt-2 tracking-tight">{tablesAvailable}</h3>
          <p className="text-[10px] text-green-400 mt-2 font-medium">Siap Digunakan</p>
        </div>

        {/* Card 6: Total Customer */}
        <div className="bg-[#1a1c23] border border-gray-800 p-5 rounded-2xl relative overflow-hidden shadow-xl group hover:border-indigo-500/30 transition-all">
          <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Users className="w-4 h-4" />
          </div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Customer</p>
          <h3 className="text-xl font-bold text-white mt-2 tracking-tight">{customerCountToday}</h3>
          <p className="text-[10px] text-blue-400 mt-2 font-medium">Pemain Hari Ini</p>
        </div>

      </div>

      {/* Table Management Grid Preview */}
      <div className="bg-[#1a1c23] border border-gray-800 rounded-2xl p-6 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-base font-semibold text-white">Status Meja Aktif</h2>
          <button onClick={() => onNavigateToView("transaksi")} className="text-xs font-semibold text-indigo-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors">
            Mulai Transaksi Baru &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {tables.map((table) => {
            let statusColor = "bg-[#0f1115] border-gray-800";
            let statusBadge = "bg-green-500/10 text-green-500 border border-green-500/20";
            
            if (table.status === "Dipakai") {
              statusColor = "bg-[#1a1c23] border-rose-500/20 ring-1 ring-rose-500/10";
              statusBadge = "bg-rose-500/10 text-rose-500 border border-rose-500/20";
            } else if (table.status === "Maintenance") {
              statusColor = "bg-[#1a1c23] border-amber-500/20";
              statusBadge = "bg-amber-500/10 text-amber-500 border border-amber-500/20";
            }

            return (
              <div key={table.id} className={`p-4 rounded-xl border ${statusColor} flex flex-col justify-between transition-all`}>
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] text-gray-500 font-mono font-bold uppercase">{table.type}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${statusBadge}`}>
                      {table.status === "Kosong" ? "Available" : table.status === "Dipakai" ? "Occupied" : "Maintenance"}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mt-3">Meja {table.number}</h3>
                  <p className="text-xs text-gray-500 mt-1 font-medium">{table.name}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-800/80">
                  {table.status === "Dipakai" ? (
                    <div className="space-y-1">
                      <p className="text-[10px] text-gray-400 truncate">Cust: <span className="text-white font-medium">{table.currentCustomer}</span></p>
                      <p className="text-[10px] text-indigo-400 font-mono font-semibold">
                        Sejak {table.currentStartTime ? new Date(table.currentStartTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-"}
                      </p>
                    </div>
                  ) : table.status === "Maintenance" ? (
                    <div className="flex items-center gap-1 text-[10px] text-amber-400">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Sedang diservis</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                      <span>{formatRupiah(table.pricePerHour)} / jam</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Visual Graphical Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Pendapatan Harian (7 Hari Terakhir) */}
        <div className="bg-[#1a1c23] border border-gray-800 rounded-2xl p-6 shadow-xl">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-white">Traffic Pendapatan Harian</h3>
            <p className="text-xs text-gray-500">Tren omzet 7 hari terakhir</p>
          </div>
          
          <div className="h-48 flex items-end justify-between gap-2 pt-6 px-4">
            {dailyRevenues.map((revenue, idx) => {
              const heightPct = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                  <div className="w-full bg-[#0f1115] rounded-t-lg h-32 relative flex items-end">
                    <div 
                      style={{ height: `${heightPct}%` }}
                      className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-lg hover:brightness-110 transition-all relative"
                    >
                      {/* Tooltip on Hover */}
                      <div className="absolute top-[-35px] left-1/2 translate-x-[-50%] bg-[#1a1c23] border border-gray-800 text-[10px] text-indigo-400 px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-20 shadow-2xl">
                        {formatRupiah(revenue)}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-500 font-semibold tracking-tight truncate max-w-full">
                    {last7DayNames[idx]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Pendapatan Bulanan (6 Bulan Terakhir) */}
        <div className="bg-[#1a1c23] border border-gray-800 rounded-2xl p-6 shadow-xl">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-white">Pendapatan Bulanan</h3>
            <p className="text-xs text-gray-500">Omzet bulanan semester ini</p>
          </div>

          <div className="h-48 flex items-end justify-between gap-3 pt-6 px-4">
            {monthlyRevenues.map((revenue, idx) => {
              const heightPct = maxMonthRevenue > 0 ? (revenue / maxMonthRevenue) * 100 : 0;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                  <div className="w-full bg-[#0f1115] rounded-t-lg h-32 relative flex items-end">
                    <div 
                      style={{ height: `${heightPct}%` }}
                      className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-lg hover:brightness-110 transition-all relative"
                    >
                      {/* Tooltip */}
                      <div className="absolute top-[-35px] left-1/2 translate-x-[-50%] bg-[#1a1c23] border border-gray-800 text-[10px] text-purple-400 px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-20 shadow-2xl">
                        {formatRupiah(revenue)}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-500 font-semibold">
                    {last6MonthsNames[idx]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 3: Jam Teramai */}
        <div className="bg-[#1a1c23] border border-gray-800 rounded-2xl p-6 shadow-xl">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-white">Jam Teramai</h3>
            <p className="text-xs text-gray-500">Tingkat kunjungan per blok jam bermain</p>
          </div>

          <div className="h-48 flex flex-col justify-between pt-2">
            {hourBlocks.map((block, idx) => {
              const val = hourCounts[idx];
              const pct = maxHours > 0 ? (val / maxHours) * 100 : 0;
              return (
                <div key={idx} className="flex items-center gap-3 w-full group">
                  <span className="text-[10px] text-gray-500 w-24 text-right font-semibold">{block}</span>
                  <div className="flex-1 bg-[#0f1115] h-3.5 rounded-full overflow-hidden relative">
                    <div 
                      style={{ width: `${pct}%` }}
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:brightness-115 transition-all rounded-full"
                    />
                  </div>
                  <span className="text-[10px] text-white font-mono font-bold w-6">{val}x</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
