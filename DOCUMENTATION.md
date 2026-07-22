# 📖 DOKUMENTASI LENGKAP & PANDUAN PENGGUNAAN
## STORE MANAGEMENT SYSTEM (GT AUTO SALES STAFF)

Selamat datang di **Store Management System (Master Dashboard)**! 
Aplikasi ini dirancang untuk memudahkan manajemen toko, analisis kinerja staf penjualan, optimasi stok otomatis (Auto Stock), identifikasi *broken size*, serta pelacakan perubahan harga produk.

---

## 📌 DAFTAR MODUL DASHBOARD

1. [Store Sales Achievement](#1-store-sales-achievement-)
2. [Sales Staff Performance](#2-sales-staff-performance-)
3. [Sales Hourly Analysis](#3-sales-hourly-analysis-)
4. [Auto Stock Dashboard](#4-auto-stock-dashboard-)
5. [Broken Size & IL Ratio](#5-broken-size--il-ratio-)
6. [Change Price Analysis](#6-change-price-analysis-)

---

### 1. 🏆 Store Sales Achievement
**Fungsi Utama:** Menganalisis pencapaian penjualan toko secara keseluruhan dibanding target bulanan dan performa tahun sebelumnya (Last Year / LY).

#### Cara Penggunaan:
1. **Upload File Data:** Unggah file Excel berikut pada sidebar kiri:
   - *Merchandise Sales Report* (.xls / .xlsx)
   - *Daily Cash Collection* (.xls / .xlsx)
   - *Salesperson / ADV ORD* (.xls / .xlsx)
   - *Sales Last Year* (.xls / .xlsx)
2. **Atur Target Bulanan:** Klik tombol **`SET MONTHLY TARGETS`** untuk mengisi target nominal toko bulan berjalan.
3. **Proses Data:** Klik tombol **`PROCESS`** untuk menghitung metrik toko (Total Sales, Qty, UPT, ATV, AUR, SM).
4. **Filter Rentang Waktu:** Gunakan dropdown periode tanggal (*Today, This Week, This Month, dll.*) untuk memperbarui rangkuman.
5. **Cetak & Export:** Gunakan tombol **`PRINT REPORT`** atau **`EXPORT EXCEL`** untuk menyimpan hasil laporan.

---

### 2. 📊 Sales Staff Performance
**Fungsi Utama:** Memantau kinerja individu dan tim sales staff secara terperinci melalui indikator UPT, RPT, Nilai Sales, dan Persentase Kontribusi.

#### Cara Penggunaan:
1. **Upload Data Staf:** Unggah file data penjualan staf / Sales Memo.
2. **Multi-Select Filter Staf:** Gunakan dropdown interaktif **`STAFF FILTER`** (bisa memilih lebih dari 1 staf sekaligus).
3. **Filter Kalender:** Tentukan rentang tanggal awal (*FROM*) dan tanggal akhir (*UNTIL*) menggunakan input kalender.
4. **Analisis Grafik Pie Chart:**
   - Visualisasi pie chart otomatis menghitung dan menampilkan nilai real + persentase kontribusi di setiap potongan grafik.
   - Pilihan metrik: *Sales Value (Rp), Sales Qty (Pcs), UPT, RPT, Contrib %*.
5. **Unduh Grafik:** Klik **`DOWNLOAD CHART`** untuk mengunduh grafik dalam bentuk gambar.

---

### 3. 🕒 Sales Hourly Analysis
**Fungsi Utama:** Memetakan pola transaksi berdasarkan jam operasional toko untuk mengidentifikasi *Peak Hours* (jam sibuk) dan jam sepi.

#### Cara Penggunaan:
1. **Upload Data Transaksi:** Unggah file transaksi yang berisi stempel waktu (jam & menit).
2. **Analisis Jam Puncak:** Perhatikan grafik batang/garis distribusi transaksi per jam.
3. **Optimasi Penjadwalan:** Alokasikan jumlah staf jaga toko lebih banyak pada jam-jam dengan trafik tertinggi.

---

### 4. 📦 Auto Stock Dashboard
**Fungsi Utama:** Rekomendasi otomatis pengisian stok (*Restock / Auto Stock*) produk toko berdasarkan tingkat penjualan dan sisa stok.

#### Cara Penggunaan:
1. **Upload Master Stok & Sales:** Unggah file stok gudang/toko dan laporan penjualan.
2. **Filter Produk (Sidebar Kiri):**
   - Cari artikel/brand tertentu melalui kotak pencarian.
   - Filter rentang harga (*EXACT, MIN, MAX*).
   - Filter Brand, Kategori, Gender, dan Tingkat Diskon.
3. **Tampilan Dinamis:** Tabel di sebelah kanan akan **secara otomatis menyesuaikan tingginya** dengan panjang sidebar filter di kiri, dilengkapi *scrollbar* mandiri.
4. **Simpan Preset:** Gunakan fitur **`PRESET`** untuk menyimpan kombinasi filter favorit agar bisa dimuat kembali dengan cepat di lain waktu.

---

### 5. 📐 Broken Size & IL Ratio
**Fungsi Utama:** Memantau kelengkapan ukuran (*size matrix*) produk untuk mendeteksi stok barang yang ukurannya sudah pecah/mati (*Broken Size*).

#### Cara Penggunaan:
1. **Upload Master Size Matrix:** Unggah file stok produk yang memiliki rincian ukuran per artikel.
2. **Filter Status Size:** Filter berdasarkan status (*BROKEN, NOT BROKEN, UNCATEGORIZE*).
3. **Analisis Rasio IL:** Evaluasi kolom rasio IL untuk memutuskan artikel mana yang perlu didiskonkan (*clearing sales*) atau diretur.

---

### 6. 🏷️ Change Price Analysis
**Fungsi Utama:** Menganalisis dan memverifikasi daftar perubahan harga/diskon barang sebelum dicetak menjadi label harga toko.

#### Cara Penggunaan:
1. **Upload File Perubahan Harga:** Unggah file daftar perubahan diskon atau harga baru.
2. **Filter & Sortir:** 
   - Filter berdasarkan status perubahan (*TRUE = Harga Berubah / FALSE = Harga Tetap*).
   - Urutkan data berdasarkan *Qty Tertinggi / Terendah* untuk memprioritaskan barang dengan stok terbanyak.
3. **Navigasi Presisi:** Tabel kanan secara dinamis menyesuaikan tinggi sidebar filter dengan *scrollbar* independen.

---

## 🛠️ FITUR GLOBAL & AKSESIBILITAS

- **❓ Fitur User Guidance (Bantuan Melayang):**
  Di setiap halaman modul, terdapat tombol melayang **`PANDUAN / HELP`** di sudut kanan bawah. Klik tombol tersebut kapan saja untuk melihat langkah cepat penggunaan modul terkait!
- **🖱️ Drag-to-Scroll:**
  Anda dapat menggeser tabel atau area data dengan menahan klik kanan/kiri mouse (drag) untuk pengalaman navigasi yang lebih leluasa.
- **📱 Responsive Layout:**
  Layout mendukung berbagai ukuran layar desktop maupun tablet secara optimal.

---

*Dikembangkan oleh Team Store Management System &copy; 2026*
