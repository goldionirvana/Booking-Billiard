import React, { useState } from "react";
import { Plus, Edit2, Trash2, Check, X, ShieldAlert, Layers } from "lucide-react";
import { Table, TableType, TableStatus } from "../types";
import { formatRupiah } from "../utils";

interface MasterMejaProps {
  tables: Table[];
  userRole: string;
  onUpdateTables: (updated: Table[]) => void;
  onShowNotification: (msg: string, type: "success" | "error" | "info") => void;
}

export default function MasterMeja({ tables, userRole, onUpdateTables, onShowNotification }: MasterMejaProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<TableType>("9-Feet Standard");
  const [pricePerHour, setPricePerHour] = useState(40000);
  const [status, setStatus] = useState<TableStatus>("Kosong");

  const [isAdding, setIsAdding] = useState(false);

  // Restrict access to Admin
  if (userRole !== "Admin") {
    return (
      <div className="bg-[#1a1c23] border border-gray-800 rounded-2xl p-8 text-center max-w-lg mx-auto shadow-2xl">
        <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Akses Ditolak</h2>
        <p className="text-gray-400 text-sm leading-relaxed">Maaf, menu Master Data Meja hanya dapat diakses oleh Admin. Kasir hanya memiliki akses ke menu Transaksi.</p>
      </div>
    );
  }

  const handleStartAdd = () => {
    setNumber((tables.length + 1).toString().padStart(2, "0"));
    setName(`Meja ${tables.length + 1}`);
    setType("9-Feet Standard");
    setPricePerHour(40000);
    setStatus("Kosong");
    setIsAdding(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!number.trim() || !name.trim()) {
      onShowNotification("Nomor dan Nama Meja wajib diisi", "error");
      return;
    }

    // Check duplicate number
    if (tables.some((t) => t.number === number)) {
      onShowNotification(`Meja dengan Nomor ${number} sudah terdaftar!`, "error");
      return;
    }

    const newTable: Table = {
      id: "M" + Math.floor(Math.random() * 1000000),
      number: number.trim(),
      name: name.trim(),
      type: type,
      pricePerHour: Number(pricePerHour),
      status: status
    };

    onUpdateTables([...tables, newTable]);
    setIsAdding(false);
    onShowNotification(`Meja ${number} berhasil ditambahkan!`, "success");
  };

  const handleStartEdit = (table: Table) => {
    setEditingId(table.id);
    setNumber(table.number);
    setName(table.name);
    setType(table.type);
    setPricePerHour(table.pricePerHour);
    setStatus(table.status);
  };

  const handleSaveEdit = (id: string) => {
    if (!number.trim() || !name.trim()) {
      onShowNotification("Nomor dan Nama Meja wajib diisi", "error");
      return;
    }

    // Check duplicates excluding editing table
    if (tables.some((t) => t.number === number && t.id !== id)) {
      onShowNotification(`Meja dengan Nomor ${number} sudah terdaftar!`, "error");
      return;
    }

    const updated = tables.map((t) => {
      if (t.id === id) {
        return {
          ...t,
          number: number.trim(),
          name: name.trim(),
          type: type,
          pricePerHour: Number(pricePerHour),
          status: status
        };
      }
      return t;
    });

    onUpdateTables(updated);
    setEditingId(null);
    onShowNotification("Data meja berhasil diubah!", "success");
  };

  const handleDelete = (id: string, numberStr: string) => {
    const table = tables.find((t) => t.id === id);
    if (table && table.status === "Dipakai") {
      onShowNotification("Tidak dapat menghapus meja yang sedang dipakai bermain!", "error");
      return;
    }

    if (window.confirm(`Apakah Anda yakin ingin menghapus Meja Nomor ${numberStr}?`)) {
      const filtered = tables.filter((t) => t.id !== id);
      onUpdateTables(filtered);
      onShowNotification(`Meja Nomor ${numberStr} berhasil dihapus!`, "success");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Katalog Meja Billiard</h1>
          <p className="text-gray-400 text-sm">Kelola spesifikasi meja, tarif sewa, jenis karpet, dan ketersediaan.</p>
        </div>
        {!isAdding && (
          <button
            onClick={handleStartAdd}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/10 cursor-pointer flex items-center gap-2 text-xs uppercase tracking-wider"
          >
            <Plus className="w-4 h-4 text-white stroke-[3px]" />
            <span>Tambah Meja Baru</span>
          </button>
        )}
      </div>

      {/* Adding Form Section */}
      {isAdding && (
        <div className="bg-[#1a1c23] border border-gray-800 p-6 rounded-2xl shadow-xl">
          <h2 className="text-xs font-bold text-indigo-400 mb-4 uppercase tracking-wider">Tambah Meja Billiard Baru</h2>
          <form onSubmit={handleSaveAdd} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div>
              <label className="block text-[10px] font-bold text-gray-450 uppercase tracking-wider mb-2">Nomor Meja</label>
              <input
                type="text"
                required
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                className="w-full px-4 py-3 bg-[#0f1115] border border-gray-800 rounded-xl text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="01"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-450 uppercase tracking-wider mb-2">Nama Meja</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-[#0f1115] border border-gray-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="Meja Utama"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-450 uppercase tracking-wider mb-2">Jenis Meja</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TableType)}
                className="w-full px-4 py-3 bg-[#0f1115] border border-gray-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="9-Feet Standard">9-Feet Standard</option>
                <option value="9-Feet Premium">9-Feet Premium</option>
                <option value="Snooker">Snooker</option>
                <option value="Bar Table">Bar Table</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-450 uppercase tracking-wider mb-2">Tarif per Jam (IDR)</label>
              <input
                type="number"
                required
                value={pricePerHour}
                onChange={(e) => setPricePerHour(Number(e.target.value))}
                className="w-full px-4 py-3 bg-[#0f1115] border border-gray-800 rounded-xl text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="40000"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer"
              >
                Simpan
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="py-3 px-4 bg-[#0f1115] hover:bg-gray-800 border border-gray-800 text-gray-400 hover:text-white rounded-xl text-xs cursor-pointer"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Inventory Meja Table List */}
      <div className="bg-[#1a1c23] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-[#1a1c23]">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Katalog Meja Billiard Terdaftar</span>
          </h2>
          <span className="text-xs text-gray-500 font-semibold">Total: {tables.length} meja</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 text-[10px] font-extrabold text-gray-400 uppercase tracking-wider bg-[#0f1115]">
                <th className="py-4 px-6">Nomor</th>
                <th className="py-4 px-6">Nama Meja</th>
                <th className="py-4 px-6">Jenis / Ukuran</th>
                <th className="py-4 px-6 text-right">Tarif Per Jam</th>
                <th className="py-4 px-6">Status Bawaan</th>
                <th className="py-4 px-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-xs text-gray-300">
              {tables.map((table) => {
                const isEditing = editingId === table.id;
                
                return (
                  <tr key={table.id} className="hover:bg-gray-800/30 transition-all">
                    
                    {/* Nomor Meja Column */}
                    <td className="py-4 px-6">
                      {isEditing ? (
                        <input
                          type="text"
                          value={number}
                          onChange={(e) => setNumber(e.target.value)}
                          className="px-3 py-1.5 bg-[#0f1115] border border-gray-800 rounded text-white font-mono font-bold w-16"
                        />
                      ) : (
                        <span className="font-mono font-extrabold text-indigo-400">Meja {table.number}</span>
                      )}
                    </td>

                    {/* Nama Meja Column */}
                    <td className="py-4 px-6">
                      {isEditing ? (
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="px-3 py-1.5 bg-[#0f1115] border border-gray-800 rounded text-white w-full max-w-xs font-semibold"
                        />
                      ) : (
                        <span className="font-semibold text-white">{table.name}</span>
                      )}
                    </td>

                    {/* Jenis/Ukuran Column */}
                    <td className="py-4 px-6 text-gray-400">
                      {isEditing ? (
                        <select
                          value={type}
                          onChange={(e) => setType(e.target.value as TableType)}
                          className="px-3 py-1.5 bg-[#0f1115] border border-gray-800 rounded text-white w-full max-w-xs"
                        >
                          <option value="9-Feet Standard">9-Feet Standard</option>
                          <option value="9-Feet Premium">9-Feet Premium</option>
                          <option value="Snooker">Snooker</option>
                          <option value="Bar Table">Bar Table</option>
                        </select>
                      ) : (
                        table.type
                      )}
                    </td>

                    {/* Tarif per Jam Column */}
                    <td className="py-4 px-6 text-right font-mono font-bold">
                      {isEditing ? (
                        <input
                          type="number"
                          value={pricePerHour}
                          onChange={(e) => setPricePerHour(Number(e.target.value))}
                          className="px-3 py-1.5 bg-[#0f1115] border border-gray-800 rounded text-white text-right font-mono w-28"
                        />
                      ) : (
                        <span className="text-gray-200">{formatRupiah(table.pricePerHour)}</span>
                      )}
                    </td>

                    {/* Status Column */}
                    <td className="py-4 px-6">
                      {isEditing ? (
                        <select
                          value={status}
                          onChange={(e) => setStatus(e.target.value as TableStatus)}
                          className="px-3 py-1.5 bg-[#0f1115] border border-gray-800 rounded text-white"
                        >
                          <option value="Kosong">Kosong</option>
                          <option value="Dipakai">Dipakai</option>
                          <option value="Maintenance">Maintenance</option>
                        </select>
                      ) : (
                        <span className={`inline-flex px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          table.status === "Dipakai"
                            ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                            : table.status === "Maintenance"
                            ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                            : "bg-green-500/10 text-green-500 border border-green-500/20"
                        }`}>
                          {table.status === "Kosong" ? "Available" : table.status === "Dipakai" ? "Occupied" : "Maintenance"}
                        </span>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleSaveEdit(table.id)}
                              className="w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
                            >
                              <Check className="w-4 h-4 stroke-[3px]" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="w-8 h-8 rounded-lg bg-[#0f1115] hover:bg-gray-800 text-gray-400 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-gray-800"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleStartEdit(table)}
                              className="w-8 h-8 rounded-lg bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-indigo-500/20"
                              title="Edit Data"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(table.id, table.number)}
                              className="w-8 h-8 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-rose-500/20"
                              title="Hapus Meja"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
