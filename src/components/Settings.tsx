import React, { useState } from "react";
import { Settings as SettingsIcon, Link, Shield, Save, HelpCircle, Database, CheckCircle, RefreshCw } from "lucide-react";
import { AppSetting } from "../types";

interface SettingsProps {
  settings: AppSetting;
  userRole: string;
  onUpdateSettings: (newSettings: AppSetting) => void;
  onShowNotification: (msg: string, type: "success" | "error" | "info") => void;
}

export default function Settings({ settings, userRole, onUpdateSettings, onShowNotification }: SettingsProps) {
  const [url, setUrl] = useState(settings.appsScriptUrl);
  const [demoMode, setDemoMode] = useState(settings.useDemoMode);
  const [tax, setTax] = useState(settings.taxPercent);
  const [disc, setDisc] = useState(settings.discountPercent);
  const [name, setName] = useState(settings.billiardName);
  const [addr, setAddr] = useState(settings.billiardAddress);

  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ status: "success" | "error" | null; msg: string }>({ status: null, msg: "" });

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
      appsScriptUrl: url.trim(),
      useDemoMode: demoMode,
      taxPercent: Number(tax),
      discountPercent: Number(disc),
      billiardName: name.trim(),
      billiardAddress: addr.trim()
    };

    onUpdateSettings(updated);
    onShowNotification("Pengaturan berhasil disimpan!", "success");
  };

  const handleTestConnection = async () => {
    if (!url.trim()) {
      setTestResult({ status: "error", msg: "Masukkan URL Google Apps Script Web App terlebih dahulu." });
      return;
    }

    setTestingConnection(true);
    setTestResult({ status: null, msg: "Menghubungi server Google..." });

    try {
      const res = await fetch(`${url.trim()}?action=getSettings`, {
        method: "GET",
        mode: "cors"
      });
      const data = await res.json();
      setTestingConnection(false);

      if (data.status === "success") {
        setTestResult({
          status: "success",
          msg: "Koneksi Spreadsheet SUKSES! Database merespon dengan benar."
        });
        onShowNotification("Koneksi Spreadsheet Sukses!", "success");
      } else {
        setTestResult({
          status: "error",
          msg: `Gagal. Respon dari Apps Script: ${data.message || "Unknown error"}`
        });
        onShowNotification("Koneksi Spreadsheet Gagal!", "error");
      }
    } catch (err: any) {
      setTestingConnection(false);
      setTestResult({
        status: "error",
        msg: `Error koneksi: ${err.message || "Periksa koneksi internet atau CORS di Apps Script"}`
      });
      onShowNotification("Koneksi Error!", "error");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Pengaturan Sistem Billiard</h1>
        <p className="text-slate-400 text-sm">Atur parameter perpajakan, diskon bawaan, info kuitansi, dan integrasi database Google Sheets.</p>
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

            {/* Google Apps Script Integration Section */}
            <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-widest border-b border-slate-700 pt-4 pb-2 mb-2 flex items-center gap-1.5">
              <Database className="w-4 h-4" />
              <span>Integrasi Google Spreadsheet</span>
            </h2>

            <div className="p-4 bg-slate-900 rounded-xl border border-slate-750 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-200">Gunakan Mode Database Spreadsheet Real-time</span>
                <p className="text-[10px] text-slate-400">Jika dimatikan, aplikasi akan berjalan secara luring (offline) menggunakan memori lokal.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!demoMode}
                  onChange={(e) => setDemoMode(!e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                <span className="ml-3 text-xs font-bold text-slate-300">{demoMode ? "Mode Offline" : "Mode Online (Spreadsheet)"}</span>
              </label>
            </div>

            {!demoMode && (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">URL Google Apps Script Web App</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      required={!demoMode}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                    <button
                      type="button"
                      disabled={testingConnection}
                      onClick={handleTestConnection}
                      className="px-4 bg-slate-700 hover:bg-slate-650 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {testingConnection ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Link className="w-3.5 h-3.5" />}
                      <span>Tes Koneksi</span>
                    </button>
                  </div>
                </div>

                {testResult.msg && (
                  <div className={`p-3.5 rounded-xl text-xs flex gap-2 items-start border ${
                    testResult.status === "success" 
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                      : testResult.status === "error"
                      ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                      : "bg-slate-900 border-slate-800 text-slate-400"
                  }`}>
                    {testResult.status === "success" ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <Database className="w-4 h-4 shrink-0 mt-0.5" />}
                    <span>{testResult.msg}</span>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:brightness-110 font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 shadow-lg"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Pengaturan</span>
            </button>

          </form>
        </div>

        {/* Setup Accordion Instruction Column */}
        <div className="bg-slate-800 border border-slate-700/50 p-6 rounded-2xl shadow-xl space-y-4">
          <h2 className="text-xs font-bold text-white uppercase tracking-widest border-b border-slate-700 pb-2 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            <span>Panduan Deployment</span>
          </h2>
          
          <div className="text-xs text-slate-400 space-y-4">
            <p className="leading-relaxed">
              Anda dapat mengintegrasikan database billiard ini dengan Google Spreadsheet pribadi Anda secara instan menggunakan kode Google Apps Script.
            </p>

            <div className="space-y-3">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-750">
                <span className="font-bold text-white block mb-1">Langkah 1: Salin Kode</span>
                <p className="text-[11px]">Buka file <code className="text-emerald-300">/appscript.gs</code> di sidebar atau unduh dari folder root aplikasi.</p>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-750">
                <span className="font-bold text-white block mb-1">Langkah 2: Ekstensi Apps Script</span>
                <p className="text-[11px]">Buka Google Sheets baru, pilih menu <strong className="text-slate-200">Ekstensi &rarr; Apps Script</strong>. Tempelkan seluruh kode tersebut.</p>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-750">
                <span className="font-bold text-white block mb-1">Langkah 3: Inisialisasi DB</span>
                <p className="text-[11px]">Pilih fungsi <code className="text-indigo-300">setupDatabase</code> di dropdown Apps Script lalu tekan tombol <strong className="text-slate-200">Jalankan</strong>. Izinkan perizinan Google.</p>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-750">
                <span className="font-bold text-white block mb-1">Langkah 4: Deploy (Deployments)</span>
                <p className="text-[11px]">Klik <strong className="text-slate-200">Deploy &rarr; New Deployment</strong>. Pilih tipe <strong className="text-slate-200">Web App</strong>, ubah akses ke <strong className="text-emerald-400">Siapa saja (Anyone)</strong>, klik deploy. Copy URL berakhiran <code className="text-slate-300">/exec</code> lalu tempelkan di form sebelah kiri.</p>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 italic">
              *Setelah deploy, seluruh transaksi kasir, detail piringan produk, log audit, dan laba rugi akan tercatat real-time ke spreadsheet!
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
