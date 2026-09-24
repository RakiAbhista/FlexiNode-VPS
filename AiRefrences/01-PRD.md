# PRD — RuPa Cloud

**Versi:** 2.0 (final draft, siap jadi acuan AI agent)
**Dokumen terkait:** 02-AGENTS.md · 03-DESIGN-SYSTEM.md · 04-TECH-API-CONTRACT.md · 05-CONTENT-COPY-GUIDE.md · 06-USER-FLOWS.md

---

## 1. Ringkasan Bisnis

RuPa Cloud adalah platform reseller VPS mikro yang disewakan dalam durasi pendek (1 hari, 3 hari, 1 minggu) — bukan model bulanan seperti VPS pada umumnya. Server fisik dipecah jadi container kecil (LXD/Incus, dikelola tim infra terpisah), dijual eceran lewat website self-service.

**Nama & filosofi:** RuPa — **Ru** dari Maruta (मरुत, Sansekerta: angin/kecepatan/fleksibilitas) + **Pa** dari Alpa (अल्प, Sansekerta: sedikit/ringan/ekonomis).

**Visi:** Menjadi platform VPS mikro pilihan utama mahasiswa dan developer pemula di Indonesia, untuk belajar, testing, dan deploy project secara fleksibel.

**Misi:**
1. Akses cloud terjangkau — bayar sesuai kebutuhan, bukan komitmen bulanan
2. Deployment sederhana — auto-deploy dari GitHub, interface intuitif
3. Ruang belajar yang aman — sandbox terisolasi untuk eksperimen
4. Mendukung ekosistem developer muda Indonesia

## 2. Target Pengguna

Mahasiswa Informatika/SI, developer pemula, peserta hackathon/lomba, bot developer (Discord/Telegram), peserta CTF, panitia event kampus. Karakteristik umum: sensitif harga, butuh onboarding cepat tanpa ribet, akses campuran HP (cek status) & desktop (kerja/deploy).

## 3. Model Bisnis Ringkas

- Sewa harian/3 hari/mingguan, bukan bulanan
- Sistem **saldo/wallet closed-loop** sebagai metode bayar utama (mengurangi fee payment gateway per transaksi kecil), dengan opsi bayar langsung via payment gateway sebagai alternatif di checkout
- Minimum top-up: **Rp10.000** (nilai ini harus configurable dari admin panel, bukan hardcode — kebijakan bisa berubah)
- Settlement dana ke rekening bank (bukan e-wallet pribadi), detail transaksi diambil dari dashboard/API payment gateway

| Paket | Skenario A | Skenario B |
|---|---|---|
| 1 hari | Rp5.000 | Rp3.500 |
| 3 hari | Rp12.000 | Rp9.000 |
| 1 minggu | Rp25.000 | Rp18.000 |

Harga final ditentukan menyusul — **semua harga harus configurable dari admin panel**, jangan hardcode di kode frontend maupun backend.

## 4. Keputusan Produk Terkonfirmasi

Daftar ini adalah hasil klarifikasi sepanjang proses requirement gathering — jadikan sumber kebenaran kalau ada bagian lain di dokumen ini yang terasa ambigu:

1. Detail Container/Produk diakses lewat tombol "Detail" dari halaman Active Product, bukan halaman terpisah yang berdiri sendiri di navigasi utama
2. Tombol Checkout diletakkan di navbar atas, dekat menu profil (bukan cuma dari halaman Product)
3. Saldo bersifat **closed-loop** — hanya bisa dipakai untuk sewa di platform ini, tidak bisa dicairkan bebas
4. Checkout mendukung **dua metode bayar**: pakai saldo, atau payment gateway langsung (toggle di halaman Checkout)
5. Top-up mendukung **preset nominal + input bebas**, minimum Rp10.000 (configurable)
6. Halaman **Riwayat** = gabungan riwayat transaksi finansial (top-up, sewa) DAN riwayat sewa container dalam satu timeline dengan filter jenis
7. **Manajemen Order** (admin) ≠ **Manajemen Container/Server** (admin) — dipisah: Order fokus ke siklus pemesanan (dibuat, expired, perpanjangan), Container/Server fokus operasional teknis real-time (resource usage, aksi darurat)
8. Halaman **Syarat & Ketentuan** dan **Kebijakan Privasi** wajib ada sebagai halaman statis terpisah
9. Tutorial per halaman customer berbentuk **tooltip/coach mark** menempel ke elemen terkait, bisa di-skip, preferensi "jangan tampilkan lagi" **disimpan di database** (per user, bukan local storage, supaya konsisten lintas device)
10. Referensi visual utama: **Hostinger** (clean, modern, animasi smooth)
11. Light mode saja untuk versi awal
12. Prioritas device: **HP & Desktop setara utama**, tablet sekunder
13. Tech stack: **Next.js + Tailwind CSS + shadcn/ui + Prisma ORM (SQL)** — detail versi & alasan di 04-TECH-API-CONTRACT.md

## 5. Page Inventory Lengkap

### Guest (belum login)
1. Landing Page
2. About Us
3. FAQ
4. Contact
5. Product (katalog paket — order baru bisa diproses setelah login)
6. Register
7. Login
8. Verifikasi OTP
9. Lupa Password
10. Syarat & Ketentuan
11. Kebijakan Privasi

### Customer (sudah login)
12. Dashboard (ringkasan akun)
13. Active Product (daftar container aktif)
14. Detail Container/Produk (diakses dari Active Product)
15. Checkout
16. Invoice
17. Riwayat (gabungan transaksi + sewa)
18. Top-up Saldo
19. Profil/Pengaturan Akun

### Admin
20. Dashboard
21. Manajemen Customer
22. Manajemen Transaksi
23. Manajemen Order
24. Manajemen Harga/Paket
25. Manajemen Container/Server

## 6. Detail Fungsional Per Halaman

Untuk tiap halaman: tujuan, elemen utama, state yang wajib ditangani (loading/empty/error/sukses minimal), dan catatan tutorial di mana relevan.

### GUEST

**Landing Page** — Hero (headline + CTA "Daftar Gratis"/"Lihat Paket"), section keunggulan (fleksibel durasi, harga terjangkau, auto-deploy GitHub, CLI aman), preview 3 tier harga dengan link ke Product, section "cocok untuk siapa" (ikon+label per persona), slot testimoni (kosong dulu), FAQ ringkas, footer (link legal & kontak).

**About Us** — Visi-misi, penjelasan konsep teknis secara awam (hindari jargon container/LXD berat), placeholder tim.

**FAQ** — Accordion per kategori (Pembayaran, Teknis, Akun, Kebijakan Data). Wajib ada: kebijakan data hilang saat expired, apa saja yang boleh di-install, cara kerja saldo.

**Contact** — Form kontak atau link langsung ke channel (WhatsApp/Discord/email).

**Product** — Card per tier (durasi × ukuran resource, harga, spesifikasi), toggle durasi, harga per-hari ditampilkan transparan di tiap tier, tombol "Sewa Sekarang" (redirect ke login dulu kalau guest). State: loading harga, tier nonaktif/maintenance.

**Register** — Form nama/email/password/konfirmasi, checkbox setuju ToS+Privasi (link ke halaman terkait), submit → Verifikasi OTP. State: validasi real-time, email sudah terdaftar.

**Login** — Email/password, "Lupa password?", link Register. State: kredensial salah, rate-limit warning.

**Verifikasi OTP** — Input 6 digit auto-focus, tombol kirim ulang + countdown. State: kode salah/kedaluwarsa.

**Lupa Password** — Input email → link reset → set password baru. State: pesan generik (jangan bocorkan status email terdaftar), link expired.

**Syarat & Ketentuan / Kebijakan Privasi** — Halaman statis, konten hukum (draft awal bisa dibuat AI, wajib direview manusia/legal sebelum publish resmi).

### CUSTOMER
*(semua halaman berikut punya tutorial tooltip skip-able, preferensi tersimpan di DB per user)*

**Dashboard** — Kartu saldo (+ tombol top-up cepat), jumlah produk aktif, produk mendekati expired (highlight), shortcut ke Product. State: empty (belum ada produk, CTA ke Product), loading.

**Active Product** — List/grid container: nama, status (aktif/mendekati expired/expired — beda warna badge), sisa waktu, tombol Detail. Filter/sort status. State: empty, loading.

**Detail Container/Produk** — Tab: Overview (status, sisa waktu, tombol Perpanjang, spesifikasi, IP/subdomain), Web CLI (terminal embed restricted), Deploy (koneksi GitHub, status build, tombol redeploy, log), Monitoring (grafik CPU/RAM sederhana), Backup/Export (generate & download sebelum expired), Danger Zone (reset manual + konfirmasi). State: loading per tab, container belum ready (disable CLI/deploy), error.

**Checkout** — Ringkasan pesanan, toggle metode bayar (Saldo / Payment Gateway), kalau saldo kurang → tawarkan top-up langsung tanpa keluar alur, tombol konfirmasi. State: saldo cukup/kurang, loading provisioning, sukses (redirect ke Detail Container baru), gagal.

**Invoice** — Detail 1 transaksi: nomor, tanggal, item, jumlah, metode bayar, status. Opsional: download PDF (bisa fase 2).

**Riwayat** — Timeline gabungan transaksi + sewa, filter by jenis & tanggal, link ke invoice terkait. State: empty, loading, pagination.

**Top-up Saldo** — Preset nominal + input bebas (min Rp10.000, configurable), pilihan metode payment gateway. State: loading redirect ke gateway, sukses (saldo terupdate), gagal/pending.

**Profil/Pengaturan Akun** — Edit nama/email/password, koneksi GitHub (connect/disconnect), preferensi notifikasi.

### ADMIN

**Dashboard** — Ringkasan: total customer, revenue hari ini/bulan ini, container aktif vs kapasitas total, alert kapasitas mendekati penuh, grafik pendapatan.

**Manajemen Customer** — Tabel customer (nama, email, saldo, jumlah produk aktif, status), detail per customer (riwayat transaksi, tombol suspend), search/filter.

**Manajemen Transaksi** — Tabel semua transaksi (top-up & sewa), filter status/tanggal/jenis, export CSV untuk pembukuan.

**Manajemen Order** — Tabel order: customer, paket, status provisioning, tanggal mulai/berakhir, riwayat perpanjangan.

**Manajemen Harga/Paket** — CRUD paket (durasi, ukuran, harga), toggle aktif/nonaktif, setting minimum top-up.

**Manajemen Container/Server** — List container lintas customer (real-time status, resource usage), aksi darurat (force reset, suspend) untuk kasus abuse.

## 7. Requirement Non-Fungsional

- **Responsif:** prioritas HP & Desktop setara, tablet sekunder
- **Keamanan:** rate-limiting login/checkout, validasi input ketat, proteksi terhadap manipulasi saldo (semua perubahan saldo lewat transaksi tercatat/ledger, tidak ada write langsung ke field saldo tanpa jejak)
- **Performa:** status container di dashboard near-real-time (polling atau websocket, detail di 04-TECH-API-CONTRACT.md)
- **Bahasa:** Bahasa Indonesia sebagai bahasa utama seluruh UI
- **Aksesibilitas:** kontras warna memadai, focus state terlihat, motion dikurangi kalau `prefers-reduced-motion`

## 8. Batasan & Integrasi Backend

Website (Next.js fullstack) menangani sendiri: autentikasi, saldo/wallet, order/transaksi, admin panel, database (Prisma). Untuk operasi container yang sebenarnya (create, resource limit, reset, status real-time), website memanggil **API orchestrator** yang dikelola tim infra terpisah — website tidak menjalankan logic LXD/Incus secara langsung.

Selama backend orchestrator belum siap, gunakan **mock data & adapter pattern** (detail di 04-TECH-API-CONTRACT.md) supaya nanti tinggal ganti implementasi adapter, bukan desain ulang UI.

## 9. Di Luar Cakupan (Saat Ini)

- Logic provisioning/container (LXD/Incus) — tanggung jawab tim infra
- Kepatuhan regulasi finansial detail (closed-loop wallet) — perlu konsultasi terpisah kalau skala membesar
- Aplikasi mobile native — web-only, responsive

## 10. Pertanyaan Terbuka (Belum Final)

- [ ] Payment gateway final yang dipakai (mempengaruhi detail integrasi di Tech/API Contract)
- [ ] Detail teknis akses CLI web (protokol websocket ke container, skema autentikasi sesi) — perlu disepakati dengan tim infra
- [ ] Format subdomain publik per container
- [ ] Perlu sistem referral/affiliate di fase awal atau menyusul?

---

*Dokumen ini hidup — update tiap ada keputusan baru, terutama harga final dan hasil sinkronisasi API dengan tim infra.*
