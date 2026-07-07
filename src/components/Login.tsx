import React, { useState } from "react";
import { LogIn, HelpCircle, ShieldAlert, AlertCircle } from "lucide-react";
import { AppSetting } from "../types";

interface LoginProps {
  onLoginSuccess: (user: { name: string; role: string; username: string }) => void;
  settings: AppSetting;
  isLoading: boolean;
  onShowNotification: (msg: string, type: "success" | "error" | "info") => void;
}

export default function Login({ onLoginSuccess, settings, isLoading, onShowNotification }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [localLoading, setLocalLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg("Username dan password wajib diisi");
      return;
    }

    setErrorMsg("");
    setLocalLoading(true);

    try {
      if (settings.useDemoMode) {
        // Mock Auth
        setTimeout(() => {
          setLocalLoading(false);
          const uLower = username.toLowerCase();
          if (uLower === "admin" && password === "admin123") {
            onLoginSuccess({
              username: "admin",
              name: "Billiard Manager",
              role: "Admin"
            });
            onShowNotification("Selamat Datang, Admin!", "success");
          } else if (uLower === "kasir" && password === "kasir123") {
            onLoginSuccess({
              username: "kasir",
              name: "Billiard Cashier",
              role: "Kasir"
            });
            onShowNotification("Selamat Datang, Kasir!", "success");
          } else {
            setErrorMsg("Username atau Password salah (Coba: admin/admin123 atau kasir/kasir123)");
            onShowNotification("Login Gagal!", "error");
          }
        }, 800);
      } else {
        // Live Google Apps Script Auth
        if (!settings.appsScriptUrl) {
          setErrorMsg("Sistem diset Online tapi URL Apps Script kosong. Silakan ubah ke Mode Demo dahulu.");
          setLocalLoading(false);
          return;
        }

        const res = await fetch(settings.appsScriptUrl, {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "text/plain;charset=utf-8"
          },
          body: JSON.stringify({
            action: "login",
            username: username,
            password: password
          })
        });

        const data = await res.json();
        setLocalLoading(false);

        if (data.status === "success") {
          onLoginSuccess(data.user);
          onShowNotification(`Selamat Datang, ${data.user.name}!`, "success");
        } else {
          setErrorMsg(data.message || "Gagal masuk. Periksa kembali kredensial Anda.");
          onShowNotification("Login Gagal!", "error");
        }
      }
    } catch (err: any) {
      setLocalLoading(false);
      console.error(err);
      setErrorMsg("Gagal menghubungi server. Periksa koneksi internet atau URL Apps Script Anda.");
      onShowNotification("Koneksi Error!", "error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1115] px-4 py-12 relative overflow-hidden">
      {/* Abstract Background Accents */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-[#1a1c23] border border-gray-800 rounded-2xl p-8 shadow-2xl relative z-10">
        
        {/* App Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600/10 text-indigo-400 mb-4 border border-indigo-600/20 shadow-inner">
            <span className="text-3xl font-extrabold tracking-tighter">B8</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">{settings.billiardName}</h2>
          <p className="text-sm text-gray-400 mt-1">Sistem POS & Pembukuan Real-time</p>
          
          {settings.useDemoMode && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-600/10 text-indigo-400 mt-3 border border-indigo-600/20">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
              Mode Demo Offline
            </span>
          )}
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Masalah Kredensial</p>
              <p className="text-xs opacity-90 mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Username</label>
            <input
              type="text"
              required
              disabled={isLoading || localLoading}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-[#0f1115] border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50 text-sm"
              placeholder="Masukkan username (contoh: admin / kasir)"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Password</label>
            </div>
            <input
              type="password"
              required
              disabled={isLoading || localLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#0f1115] border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50 text-sm"
              placeholder="Masukkan password (contoh: admin123 / kasir123)"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || localLoading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm"
          >
            {localLoading || isLoading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Masuk Sekarang</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-800/80 flex flex-col gap-3 text-gray-400 text-xs">
          <div className="bg-[#0f1115]/60 p-3 rounded-lg border border-gray-800/50">
            <span className="font-semibold text-gray-300 flex items-center gap-1.5 mb-1 text-indigo-400">
              <HelpCircle className="w-3.5 h-3.5" /> Akun Demo Bawaan:
            </span>
            <ul className="list-disc pl-4 space-y-1 text-gray-400">
              <li>Role Admin: <code className="text-indigo-300 font-mono">admin</code> & password <code className="text-indigo-300 font-mono">admin123</code></li>
              <li>Role Kasir: <code className="text-indigo-300 font-mono">kasir</code> & password <code className="text-indigo-300 font-mono">kasir123</code></li>
            </ul>
          </div>
          <p className="text-center text-[10px] text-gray-600">
            Sistem Keamanan dienkripsi terintegrasi Google Cloud Run Sandbox
          </p>
        </div>
      </div>
    </div>
  );
}
