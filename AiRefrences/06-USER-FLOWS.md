# User Flows — RuPa Cloud

## 1. Registrasi & Onboarding

```mermaid
flowchart TD
    A[Landing Page] --> B[Klik Daftar]
    B --> C[Form Register]
    C -->|Submit| D[Verifikasi OTP]
    D -->|Kode benar| E[Dashboard]
    D -->|Kode salah/expired| D
    E --> F{Punya produk aktif?}
    F -->|Belum| G[Empty state + CTA Lihat Paket]
    F -->|Sudah| H[List Active Product]
```

## 2. Sewa Produk Baru (Checkout)

```mermaid
flowchart TD
    A[Halaman Product] --> B[Pilih paket & durasi]
    B --> C{Sudah login?}
    C -->|Belum| D[Login/Register] --> B
    C -->|Sudah| E[Checkout]
    E --> F{Pilih metode bayar}
    F -->|Saldo| G{Saldo cukup?}
    G -->|Cukup| H[Konfirmasi & potong saldo]
    G -->|Kurang| I[Tawarkan Top-up langsung] --> H
    F -->|Payment Gateway| J[Redirect ke gateway] --> H
    H --> K[Provisioning di backend]
    K -->|Berhasil| L[Redirect ke Detail Container]
    K -->|Gagal| M[Pesan error + saldo dikembalikan]
```

## 3. Top-up Saldo

```mermaid
flowchart TD
    A[Dashboard/Checkout] --> B[Klik Top-up]
    B --> C[Pilih nominal preset / input bebas]
    C --> D{>= minimum Rp10.000?}
    D -->|Tidak| E[Pesan validasi] --> C
    D -->|Ya| F[Pilih metode pembayaran]
    F --> G[Redirect ke payment gateway]
    G -->|Sukses| H[Saldo terupdate + notifikasi]
    G -->|Gagal/pending| I[Status pending, cek ulang nanti]
```

## 4. Kelola Produk Aktif — Deploy & CLI

```mermaid
flowchart TD
    A[Active Product] --> B[Klik Detail]
    B --> C[Halaman Detail Container]
    C --> D[Tab Overview]
    C --> E[Tab Web CLI]
    C --> F[Tab Deploy]
    C --> G[Tab Monitoring]
    C --> H[Tab Backup/Export]
    F --> I[Hubungkan GitHub]
    I --> J[Pilih repo]
    J --> K[Push ke GitHub]
    K --> L[GitHub Actions build]
    L --> M[Artifact dikirim ke container]
    M --> N[Status deploy terupdate di dashboard]
```

## 5. Perpanjangan & Expired

```mermaid
flowchart TD
    A[Container mendekati expired] --> B[Notifikasi in-app + email]
    B --> C{User bertindak?}
    C -->|Perpanjang| D[Checkout perpanjangan] --> E[Container tetap aktif]
    C -->|Backup dulu| F[Export data] --> C
    C -->|Tidak ada aksi| G[Waktu habis]
    G --> H[Container direset: delete + recreate dari base image]
    H --> I[Slot kembali tersedia untuk dijual]
```

## 6. Alur Admin — Kelola Order

```mermaid
flowchart TD
    A[Admin Dashboard] --> B[Manajemen Order]
    B --> C[Lihat daftar order & status]
    C --> D{Ada masalah/abuse?}
    D -->|Ya| E[Manajemen Container/Server] --> F[Force reset/suspend]
    D -->|Tidak| G[Monitor normal]
```

---

**Catatan:** diagram di atas pakai sintaks Mermaid — akan otomatis ter-render kalau file ini dibuka di GitHub, banyak editor Markdown modern, atau saat dipublikasikan sebagai halaman web. Kalau perlu versi visual langsung, aku bisa buatkan diagramnya sebagai gambar terpisah.
