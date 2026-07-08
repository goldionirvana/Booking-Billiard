import React, { useState } from "react";
import { Settings as SettingsIcon, Shield, Save, HelpCircle, Database, CheckCircle, RefreshCw } from "lucide-react";
import { AppSetting } from "../types";

interface SettingsProps {
  settings: AppSetting;
  userRole: string;
  onUpdateSettings: (newSettings: AppSetting) => void;
  onShowNotification: (msg: string, type: "success" | "error" | "info") => void;
  onSyncDatabase?: () => Promise<void>;
  isSyncing?: boolean;
}

export default function Settings({ settings, userRole, onUpdateSettings, onShowNotification, onSyncDatabase, isSyncing }: SettingsProps) {
  const [tax, setTax] = useState(settings.taxPercent);
  const [disc, setDisc] = useState(settings.discountPercent);
  const [name, setName] = useState(settings.billiardName);
  const [addr, setAddr] = useState(settings.billiardAddress);

  if (userRole !== "Admin") {
    return (
      <div className="bg-slate-800 border border-slate-700/50 rounded-2xl p-8 text-center max-w-lg mx-auto">
        <Shield className="w-16 h-16 text-rose-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Akses Ditolak</h2>
        <p className="text-slate-400 text-sm">Maaf, menu Pengaturan Sistem hanya dapat diakses oleh Admin untuk keamanan database perusahaan.</p>
      </div>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      onShowNotification("Nama Billiard wajib diisi!", "error");
      return;
    }

    const updated: AppSetting = {
      appsScriptUrl: "",
      useDemoMode: false,
      taxPercent: Number(tax),
      discountPercent: Number(disc),
      billiardName: name.trim(),
      billiardAddress: addr.trim()
    };

    onUpdateSettings(updated);
    onShowNotification("Pengaturan berhasil disimpan!", "success");
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Pengaturan Sistem Billiard</h1>
        <p className="text-slate-400 text-sm">Atur parameter perpajakan, diskon bawaan, info kuitansi, dan sinkronisasi database Supabase PostgreSQL.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Settings Form Column */}
        <div className="lg:col-span-2 bg-slate-800 border border-slate-700/50 p-6 rounded-2xl shadow-xl">
          <form onSubmit={handleSave} className="space-y-5">
            
            <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-widest border-b border-slate-700 pb-2 mb-4 flex items-center gap-1.5">
              <SettingsIcon className="w-4 h-4" />
              <span>Konfigurasi Umum</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Nama Billiard & Lounge</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  placeholder="e.g., Arena Billiard & Lounge"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Alamat Usaha (Struk Thermal)</label>
                <input
                  type="text"
                  required
                  value={addr}
                  onChange={(e) => setAddr(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g., Jl. Raya Billiard No. 88, Jakarta"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Pajak Restoran / Pajak Hiburan (%)</label>
                <input
                  type="number"
                  required
                  min={0}
                  max={100}
                  value={tax}
                  onChange={(e) => setTax(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Default Diskon Member (%)</label>
                <input
                  type="number"
                  required
                  min={0}
                  max={100}
                  value={disc}
                  onChange={(e) => setDisc(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                />
              </div>
            </div>

            {/* Supabase Integration Section */}
            <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-widest border-b border-slate-700 pt-4 pb-2 mb-2 flex items-center gap-1.5">
              <Database className="w-4 h-4" />
              <span>Integrasi Supabase Cloud Database</span>
            </h2>

            <div className="p-4 bg-slate-900 rounded-xl border border-slate-750 space-y-4">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Database Supabase Aktif & Terhubung
                  </span>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Seluruh data transaksi, data produk, daftar meja, pengeluaran kas, dan log audit keamanan Anda disimpan dengan aman dan dicadangkan secara real-time di server Supabase PostgreSQL.
                  </p>
                </div>
              </div>

              {onSyncDatabase && (
                <div className="pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    disabled={isSyncing}
                    onClick={async () => {
                      // Automatically save current input to settings first
                      const updated: AppSetting = {
                        appsScriptUrl: "",
                        useDemoMode: false,
                        taxPercent: Number(tax),
                        discountPercent: Number(disc),
                        billiardName: name.trim(),
                        billiardAddress: addr.trim()
                      };
                      onUpdateSettings(updated);
                      
                      // Then sync database
                      await onSyncDatabase();
                    }}
                    className="w-full py-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 hover:border-indigo-500/50 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                    <span>Sinkronkan Ulang dengan Supabase Cloud</span>
                  </button>
                  <p className="text-[10px] text-slate-500 text-center mt-1.5 leading-normal">
                    Mengunduh dan memperbarui seluruh data Meja, Produk, Transaksi, dan Pengeluaran terbaru dari server Supabase ke memori lokal browser Anda.
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:brightness-110 font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 shadow-lg"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Pengaturan</span>
            </button>

          </form>
        </div>

        {/* Operating Guide Instructions Column */}
        <div className="bg-slate-800 border border-slate-700/50 p-6 rounded-2xl shadow-xl space-y-4">
          <h2 className="text-xs font-bold text-white uppercase tracking-widest border-b border-slate-700 pb-2 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            <span>Petunjuk Operasional</span>
          </h2>
          
          <div className="text-xs text-slate-400 space-y-4">
            <p className="leading-relaxed">
              CueMaster POS dirancang untuk manajemen meja biliar dan kasir F&B yang modern, cepat, serta terpercaya dengan sistem sinkronisasi otomatis.
            </p>

            <div className="space-y-3">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-750">
                <span className="font-bold text-white block mb-1">Penyimpanan Cloud</span>
                <p className="text-[11px]">Setiap kali kasir membuka meja, melakukan transaksi checkout, atau menambah pengeluaran kas, data langsung tersimpan di Supabase PostgreSQL.</p>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-750">
                <span className="font-bold text-white block mb-1">Keamanan Data</span>
                <p className="text-[11px]">Audit Security Log mencatat semua aktivitas sensitif seperti login, perubahan pengaturan, pendaftaran meja, dan aktivitas transaksi untuk mencegah kecurangan.</p>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-750">
                <span className="font-bold text-white block mb-1">Operasional Multi-Device</span>
                <p className="text-[11px]">Gunakan fitur "Sync Cloud" di pojok kanan atas layar untuk menyelaraskan status meja dan produk secara real-time antar perangkat kasir.</p>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-750">
                <span className="font-bold text-white block mb-1">Manajemen POS</span>
                <p className="text-[11px]">Pastikan stok produk F&B selalu diperbarui di halaman produk agar kasir dapat melayani pesanan makanan & minuman dengan akurat.</p>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 italic">
              *Aplikasi ini telah sepenuhnya menggunakan Supabase PostgreSQL sebagai satu-satunya database utama yang aman dan tersinkronisasi.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
