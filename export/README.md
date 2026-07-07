# Billiard POS & Accounting System (Real-time Google Spreadsheet Integration)

Selamat datang di Sistem Kasir (POS) dan Pembukuan Keuangan Billiard Modern. Sistem ini dirancang khusus untuk manajemen meja billiard, pemesanan kafe (makanan/minuman), pencatatan pengeluaran operasional, dan laporan laba-rugi terintegrasi secara real-time dengan **Google Spreadsheet** sebagai database utama.

Aplikasi ini memiliki dua versi lengkap yang siap digunakan:
1. **Versi React Modern (SPA)**: Berjalan secara responsif di preview editor ini (menggunakan React 19 + Tailwind CSS + Lucide Icons + Motion).
2. **Versi Ekspor Terpisah (HTML/JS/Bootstrap)**: Terdiri dari 10 file terpisah yang siap di-host di server statis mana pun (seperti GitHub Pages, Netlify, atau langsung di dalam Google Apps Script).

---

## Daftar File yang Disediakan
Seluruh source code lengkap telah disediakan secara rapi dan terpisah:
1. `index.html` - Halaman pembungkus utama / portal sistem.
2. `login.html` - Sistem login dengan autentikasi multi-role (Admin & Kasir).
3. `dashboard.html` - Panel POS dengan kartu metrik ringkasan harian/bulanan & grafik Chart.js.
4. `transaksi.html` - POS Kasir, timer real-time meja sewa, pesanan kafe, & cetak struk kasir thermal.
5. `pembukuan.html` - Manajemen pengeluaran (CRUD) & laporan Laba Rugi sederhana.
6. `laporan.html` - Riwayat lengkap transaksi, filter tanggal, & ekspor data (Excel & PDF).
7. `style.css` - Lembar gaya (CSS) dengan dukungan Dark Mode & animasi halus.
8. `app.js` - Logika JavaScript (ES6) yang mengontrol view, timer, pembayaran, & komunikasi API.
9. `appscript.gs` - REST API backend yang ditempelkan di Google Apps Script (doGet & doPost).
10. `README.md` - Petunjuk instalasi dan dokumentasi penggunaan sistem.

---

## Petunjuk Instalasi Database Google Spreadsheet

Untuk mengaktifkan sinkronisasi real-time antara situs POS dan Google Spreadsheet Anda, ikuti langkah-langkah berikut:

### Langkah 1: Siapkan Spreadsheet & Google Apps Script
1. Buka Google Sheets baru di [Google Drive](https://drive.google.com).
2. Di bar atas, klik **Ekstensi** &rarr; **Apps Script**.
3. Hapus seluruh kode default di editor, lalu salin dan tempel (paste) isi dari file **`appscript.gs`**.
4. Klik tombol **Simpan** (ikon disket) di bagian atas editor.

### Langkah 2: Inisialisasi Tabel Database
1. Di bagian atas editor Apps Script, pastikan fungsi yang terpilih di dropdown adalah **`setupDatabase`**.
2. Klik tombol **Jalankan** (Run).
3. Google akan meminta izin Otorisasi. Berikan izin dengan mengklik **Tinjau Izin** (Review Permissions), pilih akun Google Anda, klik **Lanjutan** (Advanced) &rarr; **Buka Proyek Tanpa Judul (tidak aman)**, lalu klik **Izinkan** (Allow).
4. Fungsi ini akan otomatis membuat seluruh sheet (tabel) yang diperlukan di spreadsheet Anda lengkap dengan header kolomnya:
   - `User` (berisi user demo bawaan: `admin`/`admin123` dan `kasir`/`kasir123`)
   - `Meja` (berisi 5 meja billiard bawaan)
   - `Transaksi`
   - `Detail Transaksi`
   - `Produk` (berisi menu kafe bawaan)
   - `Pengeluaran`
   - `AuditLog`
   - `Setting`

### Langkah 3: Deploy sebagai Aplikasi Web (REST API)
1. Di kanan atas editor Apps Script, klik tombol **Terapkan** (Deploy) &rarr; **Penerapan Baru** (New Deployment).
2. Klik ikon gerigi (Pilih Jenis) dan pilih **Aplikasi Web** (Web App).
3. Konfigurasikan detail penerapan:
   - **Deskripsi**: `Billiard POS API`
   - **Jalankan sebagai**: `Saya (Email Anda)`
   - **Siapa yang memiliki akses**: `Siapa saja` (*Anyone* - opsi ini krusial agar web POS dapat berkomunikasi secara langsung).
4. Klik **Terapkan** (Deploy).
5. Salin **URL Aplikasi Web** yang diberikan (URL ini berakhiran `/exec`).

### Langkah 4: Hubungkan POS dengan API URL Anda
1. Buka situs POS Billiard ini.
2. Masuk sebagai **Admin** (`admin` / `admin123`).
3. Buka menu **Pengaturan** di sidebar kiri.
4. Aktifkan sakelar (toggle) **Gunakan Mode Database Spreadsheet Real-time**.
5. Tempelkan URL yang Anda salin ke inputan **URL Google Apps Script Web App**.
6. Klik tombol **Tes Koneksi**. Jika muncul alert sukses hijau, klik **Simpan Pengaturan**.
7. Selesai! Sekarang seluruh aktivitas Anda di kasir, inventaris meja, stok makanan, hingga catatan pengeluaran akan langsung tersimpan dan sinkron di Spreadsheet.

---

## Hak Akses Role Pengguna
- **Admin** (`admin`/`admin123`): Memiliki akses penuh ke seluruh sistem termasuk Dashboard, POS Billing, Master Data Meja, Master Produk Kafe, Pembukuan Kas, Laporan Keuangan, Audit Log aktivitas, dan Pengaturan Spreadsheet.
- **Kasir** (`kasir`/`kasir123`): Hanya memiliki hak akses ke menu **Billing & POS Transaksi** untuk melayani customer bermain billiard dan melakukan transaksi makanan/minuman. Menu sensitif lainnya disembunyikan dan di-lock otomatis.

---

## Fitur Tambahan & Keunggulan
- **Timer Real-Time**: Waktu sewa meja berjalan detik demi detik beserta taksiran rupiah tarifnya secara visual di layar kasir.
- **Auto Invoice**: Nomor kuitansi di-generate unik berdasarkan tanggal dan nomor acak otomatis.
- **Audit Log**: Mencatat setiap aktivitas krusial kasir (misal: login, sewa meja, checkout, edit pengaturan) untuk mencegah kebocoran kas keuangan.
- **Export Excel & PDF**: Klik satu tombol di menu laporan untuk mengunduh laporan keuangan berformat CSV Excel atau mencetak file ledger A4.
- **Simulasi Cetak Struk**: Dilengkapi preview visual struk thermal ukuran 58mm untuk printer kasir mini.
- **Auto-Logout Idle 30 Menit**: Melindungi komputer kasir dari penyalahgunaan jika kasir meninggalkan meja counter lebih dari 30 menit.
