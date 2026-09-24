# AGENTS.md — RuPa Cloud

Instruksi ini untuk AI coding agent (Claude Code atau sejenis) yang membangun codebase RuPa Cloud. Dokumen ini menjawab **"bagaimana cara kerja"** — untuk **"apa yang dibangun"**, lihat `01-PRD.md`.

## 1. Prinsip Utama

1. **Frontend dulu, backend menyusul.** Semua halaman di PRD harus bisa dibuka dan terlihat lengkap dengan data mock, TANPA backend/database asli berjalan. Jangan block pengembangan UI karena "nunggu API".
2. **Adapter pattern wajib** untuk semua pemanggilan data (lihat `04-TECH-API-CONTRACT.md`). Komponen UI tidak boleh tahu apakah datanya dari mock atau API asli — mereka cuma panggil fungsi dari layer data, dan layer itu yang diganti isinya nanti.
3. **Ikuti PRD & Design System sebagai sumber kebenaran.** Kalau ada instruksi yang terasa kontradiktif dengan PRD/Design System, tanyakan ke user, jangan asumsi sepihak.
4. **Jangan hardcode nilai yang sudah ditandai "configurable"** di PRD (harga, minimum top-up, dll) — selalu ambil dari layer data/config, bukan konstanta di kode komponen.

## 2. Tech Stack & Versi

- **Framework:** Next.js 15 (App Router, Turbopack), React 19
- **Styling:** Tailwind CSS v4, shadcn/ui (Radix UI primitives)
- **ORM/Database:** Prisma ORM, target database PostgreSQL (rekomendasi — lebih matang untuk fitur relasional & concurrent write dibanding MySQL untuk kasus ledger saldo; kalau tim infra sudah punya preferensi database lain, sesuaikan)
- **Bahasa:** TypeScript untuk seluruh kode, strict mode aktif
- **Validasi:** Zod untuk schema validation (form input & API request/response)
- **State/data fetching:** React Server Components sebagai default, Server Actions untuk mutasi; gunakan client state (misal Zustand/TanStack Query) hanya kalau benar-benar perlu interaktivitas client-side (CLI terminal, polling status container)

> Sebelum instalasi, cek versi terbaru & compatibility matrix tiap library (Next.js, React, Tailwind, shadcn/ui, Prisma) — jangan asumsi versi dari ingatan training, karena ekosistem ini cepat berubah. Jalankan `npm info <package> versions` atau cek changelog resmi kalau ragu.

## 3. Struktur Folder (App Router)

```
src/
  app/
    (guest)/                 # route group: landing, about, faq, contact, product, auth
      page.tsx
      about/
      faq/
      contact/
      product/
      register/
      login/
      verify-otp/
      forgot-password/
      terms/
      privacy/
    (customer)/               # route group: perlu auth
      dashboard/
      products/
        [id]/                 # detail container
      checkout/
      invoices/
        [id]/
      history/
      topup/
      settings/
    (admin)/                  # route group: perlu role admin
      dashboard/
      customers/
      transactions/
      orders/
      plans/
      servers/
    api/                      # route handlers (kalau dibutuhkan di luar Server Actions)
  components/
    ui/                       # komponen shadcn/ui (auto-generated, jangan edit manual kecuali perlu)
    shared/                   # komponen custom lintas halaman (navbar, footer, coach-mark, dll)
    <feature>/                # komponen spesifik per fitur, co-located dengan halamannya kalau memungkinkan
  lib/
    data/                     # ADAPTER LAYER — lihat 04-TECH-API-CONTRACT.md
      mock/                   # implementasi mock, aktif sekarang
      live/                   # implementasi API asli, diisi belakangan
      index.ts                # entry point yang expose satu implementasi aktif
    validations/              # skema Zod
    utils.ts
  prisma/
    schema.prisma
```

## 4. Konvensi Kode

- **Penamaan file:** kebab-case untuk file, PascalCase untuk nama komponen React
- **Komponen:** functional component + TypeScript, hindari default export kecuali untuk `page.tsx`/`layout.tsx` (konvensi Next.js)
- **Server vs Client Component:** default Server Component, tambahkan `"use client"` hanya kalau butuh interaktivitas/hook browser (state, effect, event handler)
- **Error handling UI:** gunakan `error.tsx` per route segment Next.js untuk error boundary, jangan biarkan halaman blank saat gagal fetch
- **Loading state:** gunakan `loading.tsx` per route segment + skeleton component, bukan spinner generik polos
- **Semua teks UI dalam Bahasa Indonesia**, sentence case (bukan Title Case atau ALL CAPS), sesuai `05-CONTENT-COPY-GUIDE.md`

## 5. Data Mock — Aturan Wajib

- Struktur mock data **harus mencerminkan skema Prisma** yang didefinisikan di `04-TECH-API-CONTRACT.md`, bukan struktur bebas — supaya transisi ke database asli mulus
- Taruh mock data di `lib/data/mock/`, di-generate secukupnya untuk menutupi semua state UI yang perlu didemokan (ada yang expired, ada yang aktif, ada yang baru provisioning, saldo cukup & tidak cukup, dll)
- Simulasikan delay network (`await new Promise(r => setTimeout(r, ...))`) di mock supaya loading state kebentuk & bisa dites, bukan langsung instan

## 6. Autentikasi (Sementara, Sebelum Backend Final)

Gunakan solusi auth Next.js yang umum (misal Auth.js/NextAuth atau alternatif setara) dengan session-based auth. Role dibedakan minimal 3: `guest` (tidak ada session), `customer`, `admin`. Route group `(customer)` dan `(admin)` wajib dilindungi middleware yang redirect ke `/login` kalau belum authenticated atau role tidak sesuai.

## 7. Yang TIDAK Boleh Dilakukan

- Jangan implementasi logic provisioning/container (LXD/Incus) di codebase ini — itu domain tim infra, diakses lewat API eksternal saja
- Jangan simpan kredensial/API key di kode, selalu lewat environment variable (`.env`, tidak di-commit)
- Jangan buat halaman/komponen yang tidak ada di `01-PRD.md` tanpa konfirmasi ke user dulu
- Jangan ubah token warna/tipografi di luar yang didefinisikan `03-DESIGN-SYSTEM.md` tanpa alasan kuat — kalau terasa kurang, tanyakan dulu

## 8. Git & Commit

- Commit message singkat, deskriptif, imperative mood (`"tambah halaman checkout"` bukan `"menambahkan halaman checkout"` atau `"added checkout page"`)
- 1 commit = 1 perubahan logis (jangan gabung banyak fitur tak berhubungan dalam 1 commit)

## 9. Definition of Done (per halaman)

Sebuah halaman dianggap selesai kalau:
- [ ] Semua elemen di spesifikasi PRD ada
- [ ] Semua state (loading/empty/error/sukses) sudah ditangani, bukan cuma "happy path"
- [ ] Responsif dari mobile sampai desktop (uji breakpoint di `03-DESIGN-SYSTEM.md`)
- [ ] Sesuai token desain (warna, tipografi, spacing) dari `03-DESIGN-SYSTEM.md`
- [ ] Copy/teks sesuai `05-CONTENT-COPY-GUIDE.md`
- [ ] Tooltip tutorial terpasang (khusus halaman customer)
- [ ] Data berasal dari adapter layer (`lib/data`), bukan hardcode di komponen
