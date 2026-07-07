import React, { useState } from "react";
import { ShieldCheck, Calendar, Search, Trash2, ShieldAlert } from "lucide-react";
import { AuditLog } from "../types";

interface AuditLogProps {
  auditLogs: AuditLog[];
  userRole: string;
}

export default function AuditLogView({ auditLogs, userRole }: AuditLogProps) {
  const [query, setQuery] = useState("");

  if (userRole !== "Admin") {
    return (
      <div className="bg-slate-800 border border-slate-700/50 rounded-2xl p-8 text-center max-w-lg mx-auto">
        <ShieldAlert className="w-16 h-16 text-rose-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Akses Ditolak</h2>
        <p className="text-slate-400 text-sm">Maaf, menu Log Audit Aktivitas hanya dapat diakses oleh Admin untuk keamanan pengawasan internal.</p>
      </div>
    );
  }

  const filteredLogs = auditLogs.filter((log) => {
    return (
      log.user.toLowerCase().includes(query.toLowerCase()) ||
      log.action.toLowerCase().includes(query.toLowerCase()) ||
      log.detail.toLowerCase().includes(query.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Audit Log Aktivitas</h1>
          <p className="text-slate-400 text-sm">Log rekam jejak aktivitas kasir dan administrator untuk kepatuhan operasional.</p>
        </div>
      </div>

      {/* Log Search and Table Wrapper */}
      <div className="bg-slate-800 border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-700/50 bg-slate-800/40 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">Jurnal Log Keamanan & Aktivitas</h2>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari log (User, Aksi, Memo)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-64"
            />
          </div>
        </div>

        {/* List of actions */}
        <div className="overflow-y-auto max-h-[500px]">
          <div className="divide-y divide-slate-750 font-mono text-[11px] text-slate-300">
            {filteredLogs.map((log) => {
              let actionBadge = "text-emerald-400 bg-emerald-500/10";
              if (log.action.toLowerCase().includes("hapus") || log.action.toLowerCase().includes("delete")) {
                actionBadge = "text-rose-400 bg-rose-500/10";
              } else if (log.action.toLowerCase().includes("edit") || log.action.toLowerCase().includes("update")) {
                actionBadge = "text-amber-400 bg-amber-500/10";
              } else if (log.action.toLowerCase().includes("login")) {
                actionBadge = "text-sky-400 bg-sky-500/10";
              }

              return (
                <div key={log.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-750/10 transition-colors">
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] text-slate-500">
                        [{new Date(log.timestamp).toLocaleString("id-ID")}]
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${actionBadge}`}>
                        {log.action}
                      </span>
                      <span className="text-white font-bold text-xs font-sans">
                        Oleh: {log.user}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-sans">{log.detail}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-slate-600 bg-slate-900 px-2 py-1 rounded">
                      ID: {log.id}
                    </span>
                  </div>
                </div>
              );
            })}
            {filteredLogs.length === 0 && (
              <div className="text-center py-12 text-slate-500 italic font-sans text-xs">
                Belum ada catatan aktivitas keamanan yang terekam.
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
