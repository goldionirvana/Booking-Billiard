import React, { useState } from "react";
import { Plus, Edit2, Trash2, Check, X, Search, ShoppingBag, ShieldAlert, AlertTriangle } from "lucide-react";
import { Product, ProductCategory } from "../types";
import { formatRupiah } from "../utils";

interface MasterProdukProps {
  products: Product[];
  userRole: string;
  onUpdateProducts: (updated: Product[]) => void;
  onShowNotification: (msg: string, type: "success" | "error" | "info") => void;
}

export default function MasterProduk({ products, userRole, onUpdateProducts, onShowNotification }: MasterProdukProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("Semua");

  // Form Fields
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ProductCategory>("Minuman");
  const [price, setPrice] = useState(10000);
  const [stock, setStock] = useState(50);

  const [isAdding, setIsAdding] = useState(false);

  // Restricted Access to Admin role for CRUD product catalog
  if (userRole !== "Admin") {
    return (
      <div className="bg-[#1a1c23] border border-gray-800 rounded-2xl p-8 text-center max-w-lg mx-auto shadow-2xl">
        <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Akses Ditolak</h2>
        <p className="text-gray-400 text-sm leading-relaxed">Maaf, menu Master Data Produk Kafe hanya dapat diakses oleh Admin. Kasir hanya memiliki akses ke menu Transaksi.</p>
      </div>
    );
  }

  const handleStartAdd = () => {
    setName("");
    setCategory("Minuman");
    setPrice(10000);
    setStock(50);
    setIsAdding(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      onShowNotification("Nama produk wajib diisi", "error");
      return;
    }

    const newProd: Product = {
      id: "P" + Math.floor(Math.random() * 1000000),
      name: name.trim(),
      category: category,
      price: Number(price),
      stock: Number(stock)
    };

    onUpdateProducts([...products, newProd]);
    setIsAdding(false);
    onShowNotification(`Produk ${name} berhasil didaftarkan!`, "success");
  };

  const handleStartEdit = (prod: Product) => {
    setEditingId(prod.id);
    setName(prod.name);
    setCategory(prod.category);
    setPrice(prod.price);
    setStock(prod.stock);
  };

  const handleSaveEdit = (id: string) => {
    if (!name.trim()) {
      onShowNotification("Nama produk wajib diisi", "error");
      return;
    }

    const updated = products.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          name: name.trim(),
          category: category,
          price: Number(price),
          stock: Number(stock)
        };
      }
      return p;
    });

    onUpdateProducts(updated);
    setEditingId(null);
    onShowNotification("Data produk kafe berhasil diperbarui!", "success");
  };

  const handleDelete = (id: string, prodName: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus produk "${prodName}"?`)) {
      const filtered = products.filter((p) => p.id !== id);
      onUpdateProducts(filtered);
      onShowNotification(`Produk "${prodName}" berhasil dihapus!`, "success");
    }
  };

  // Search and Filter logic
  const filteredProducts = products.filter((prod) => {
    const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "Semua" || prod.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Katalog F&B / Cafe</h1>
          <p className="text-gray-400 text-sm">Kelola stok makanan, minuman ringan, dan snack pelengkap customer billiard.</p>
        </div>
        {!isAdding && (
          <button
            onClick={handleStartAdd}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/10 cursor-pointer flex items-center gap-2 text-xs uppercase tracking-wider"
          >
            <Plus className="w-4 h-4 text-white stroke-[3px]" />
            <span>Tambah Produk Baru</span>
          </button>
        )}
      </div>

      {/* Adding form drawer */}
      {isAdding && (
        <div className="bg-[#1a1c23] border border-gray-800 p-6 rounded-2xl shadow-xl">
          <h2 className="text-xs font-bold text-indigo-400 mb-4 uppercase tracking-wider">Tambah Produk Kafe Baru</h2>
          <form onSubmit={handleSaveAdd} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-gray-450 uppercase tracking-wider mb-2">Nama Produk</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-[#0f1115] border border-gray-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="Indomie Rebus Spesial"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-450 uppercase tracking-wider mb-2">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="w-full px-4 py-3 bg-[#0f1115] border border-gray-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="Minuman">Minuman</option>
                <option value="Makanan">Makanan</option>
                <option value="Snack">Snack</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-450 uppercase tracking-wider mb-2">Harga Jual (Rp)</label>
              <input
                type="number"
                required
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-4 py-3 bg-[#0f1115] border border-gray-800 rounded-xl text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="15000"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-450 uppercase tracking-wider mb-2">Stok Awal</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  required
                  value={stock}
                  onChange={(e) => setStock(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-[#0f1115] border border-gray-800 rounded-xl text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="100"
                />
                <button
                  type="submit"
                  className="px-5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer"
                >
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 bg-[#0f1115] hover:bg-gray-800 border border-gray-800 text-gray-450 rounded-xl text-xs cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Product List Table Wrapper */}
      <div className="bg-[#1a1c23] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        
        {/* Search & Category Filter Section */}
        <div className="p-5 border-b border-gray-800 bg-[#1a1c23] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold text-white">Daftar Produk Kafe</h2>
            <span className="text-xs text-gray-550">({filteredProducts.length} Terpilih)</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-stretch">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari produk..."
                className="pl-10 pr-4 py-2 bg-[#0f1115] border border-gray-800 rounded-lg text-xs text-white placeholder-gray-650 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-60"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex gap-1 bg-[#0f1115] p-1 rounded-lg border border-gray-800 text-xs">
              {["Semua", "Minuman", "Makanan", "Snack"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-md font-semibold transition-all text-[11px] cursor-pointer ${
                    categoryFilter === cat
                      ? "bg-indigo-600/10 text-indigo-400"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Database Table view */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 text-[10px] font-extrabold text-gray-400 uppercase tracking-wider bg-[#0f1115]">
                <th className="py-4 px-6">ID</th>
                <th className="py-4 px-6">Nama Produk</th>
                <th className="py-4 px-6">Kategori</th>
                <th className="py-4 px-6 text-right">Harga Jual</th>
                <th className="py-4 px-6 text-center">Stok</th>
                <th className="py-4 px-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-xs text-gray-300">
              {filteredProducts.map((prod) => {
                const isEditing = editingId === prod.id;
                const isLowStock = prod.stock <= 10;

                return (
                  <tr key={prod.id} className="hover:bg-gray-800/30 transition-all">
                    
                    {/* ID */}
                    <td className="py-4 px-6 font-mono text-[10px] text-gray-550">
                      {prod.id}
                    </td>

                    {/* Nama Produk */}
                    <td className="py-4 px-6">
                      {isEditing ? (
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="px-3 py-1.5 bg-[#0f1115] border border-gray-800 rounded text-white font-semibold w-full max-w-sm"
                        />
                      ) : (
                        <span className="font-semibold text-white">{prod.name}</span>
                      )}
                    </td>

                    {/* Kategori */}
                    <td className="py-4 px-6 text-gray-400">
                      {isEditing ? (
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value as ProductCategory)}
                          className="px-3 py-1.5 bg-[#0f1115] border border-gray-800 rounded text-white"
                        >
                          <option value="Minuman">Minuman</option>
                          <option value="Makanan">Makanan</option>
                          <option value="Snack">Snack</option>
                        </select>
                      ) : (
                        <span className="inline-flex px-2.5 py-0.5 rounded text-[10px] font-semibold bg-[#0f1115] text-gray-400 border border-gray-800">
                          {prod.category}
                        </span>
                      )}
                    </td>

                    {/* Harga Jual */}
                    <td className="py-4 px-6 text-right font-mono font-bold">
                      {isEditing ? (
                        <input
                          type="number"
                          value={price}
                          onChange={(e) => setPrice(Number(e.target.value))}
                          className="px-3 py-1.5 bg-[#0f1115] border border-gray-800 rounded text-white text-right font-mono w-28"
                        />
                      ) : (
                        <span className="text-gray-200">{formatRupiah(prod.price)}</span>
                      )}
                    </td>

                    {/* Stok */}
                    <td className="py-4 px-6 text-center">
                      {isEditing ? (
                        <input
                          type="number"
                          value={stock}
                          onChange={(e) => setStock(Number(e.target.value))}
                          className="px-3 py-1.5 bg-[#0f1115] border border-gray-800 rounded text-white text-center font-mono w-20"
                        />
                      ) : (
                        <div className="flex items-center justify-center gap-1.5">
                          <span className={`font-mono font-bold ${isLowStock ? "text-rose-450 font-extrabold" : "text-gray-300"}`}>
                            {prod.stock}
                          </span>
                          {isLowStock && (
                            <span className="p-0.5 rounded bg-rose-500/10 text-rose-500" title="Stok Hampir Habis!">
                              <AlertTriangle className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Aksi */}
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleSaveEdit(prod.id)}
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
                              onClick={() => handleStartEdit(prod)}
                              className="w-8 h-8 rounded-lg bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-indigo-500/20"
                              title="Edit Jual"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(prod.id, prod.name)}
                              className="w-8 h-8 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-rose-500/20"
                              title="Hapus Produk"
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
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500 italic font-medium">
                    Tidak ada produk kafe yang cocok dengan pencarian Anda.
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
