# Tech Stack & API Contract — RuPa Cloud

## 1. Tech Stack Terkonfirmasi

| Layer | Pilihan | Catatan |
|---|---|---|
| Framework | Next.js 15 (App Router, Turbopack) | React 19 di dalamnya |
| Styling | Tailwind CSS v4 | Konfigurasi via `@theme`, bukan `tailwind.config.js` model lama |
| Komponen UI | shadcn/ui | Berbasis Radix UI, komponen di-copy ke project (bukan dependency biasa) |
| ORM | Prisma | Target database: PostgreSQL (rekomendasi, lihat alasan di §2) |
| Bahasa | TypeScript (strict) | Seluruh codebase |
| Validasi | Zod | Form input & kontrak API |
| Auth | Auth.js (NextAuth) atau setara | Session-based, 3 role: guest/customer/admin |

⚠️ **Wajib dicek ulang oleh AI agent sebelum instalasi:** versi persis & compatibility matrix tiap package di atas, karena ekosistem JS bergerak cepat dan info ini bisa saja sudah tidak akurat di titik project benar-benar dimulai. Jangan install versi dari ingatan/asumsi — cek `npm view <package> versions`, changelog resmi, dan known issues compatibility (khususnya shadcn/ui dengan versi React & Tailwind yang dipakai).

## 2. Kenapa PostgreSQL (bukan MySQL)

PRD menyebut "SQL" tanpa spesifik. Rekomendasi PostgreSQL karena:
- Dukungan transaksi & constraint yang matang — penting untuk **ledger saldo** (mencegah race condition saat saldo dipotong bersamaan dari 2 request)
- Native support tipe data JSON & array kalau nanti dibutuhkan (misal menyimpan log deploy)
- Kompatibilitas mulus dengan Prisma

Kalau tim infra/hosting sudah punya preferensi lain (misal sudah biasa MySQL), ini bisa disesuaikan — bukan keputusan mati.

## 3. Adapter Pattern — Kunci Strategi "Frontend Dulu"

Semua pengambilan/pengiriman data lewat satu layer abstraksi di `lib/data/`, supaya UI tidak pernah langsung memanggil mock atau API asli.

```ts
// lib/data/index.ts
export const dataSource = process.env.NEXT_PUBLIC_DATA_SOURCE === 'live'
  ? liveDataSource
  : mockDataSource;

// Komponen/halaman cukup panggil, tanpa tahu sumbernya:
const products = await dataSource.getActiveProducts(userId);
```

Setiap fungsi di `mockDataSource` dan `liveDataSource` **wajib punya signature (input/output) yang identik** — ini kontrak yang menjamin swap-nya aman.

## 4. Skema Data (Draft Prisma Entities)

Ini draft awal struktur data — jadi acuan bentuk mock data juga. Detail field bisa berkembang, tapi struktur besar ini yang dipakai:

```prisma
model User {
  id            String   @id @default(cuid())
  name          String
  email         String   @unique
  passwordHash  String
  role          Role     @default(CUSTOMER)
  balance       Int      @default(0) // dalam rupiah, satuan terkecil (bukan desimal)
  githubHandle  String?
  createdAt     DateTime @default(now())
  tutorialSeen  TutorialPref[]
  orders        Order[]
  transactions  Transaction[]
}

enum Role {
  CUSTOMER
  ADMIN
}

model TutorialPref {
  id        String  @id @default(cuid())
  userId    String
  pageKey   String  // identifier halaman, misal "dashboard", "detail-container"
  dismissed Boolean @default(false)
  user      User    @relation(fields: [userId], references: [id])
}

model Plan {
  id          String   @id @default(cuid())
  name        String   // misal "1 Hari - 512MB"
  durationDays Int
  ramMb       Int
  cpuAllowance Int     // persentase, misal 50 = 0.5 core
  price       Int
  active       Boolean @default(true)
}

model Order {
  id            String   @id @default(cuid())
  userId        String
  planId        String
  status        OrderStatus @default(PENDING)
  containerId   String?     // referensi ke resource di sistem orchestrator (tim infra)
  startedAt     DateTime?
  expiresAt     DateTime?
  createdAt     DateTime @default(now())
  user          User     @relation(fields: [userId], references: [id])
  plan          Plan     @relation(fields: [planId], references: [id])
  transaction   Transaction?
}

enum OrderStatus {
  PENDING
  PROVISIONING
  ACTIVE
  EXPIRING_SOON
  EXPIRED
  FAILED
}

model Transaction {
  id          String   @id @default(cuid())
  userId      String
  type        TransactionType
  amount      Int
  method      PaymentMethod
  status      TransactionStatus @default(PENDING)
  orderId     String?  @unique
  gatewayRef  String?  // ID referensi dari payment gateway
  createdAt   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id])
  order       Order?   @relation(fields: [orderId], references: [id])
}

enum TransactionType {
  TOPUP
  RENTAL
  EXTEND
}

enum PaymentMethod {
  BALANCE
  GATEWAY
}

enum TransactionStatus {
  PENDING
  SUCCESS
  FAILED
}

model AppConfig {
  key   String @id // misal "min_topup"
  value String
}
```

`AppConfig` adalah tabel key-value sederhana untuk semua nilai yang harus configurable (minimum top-up, dll) — dibaca admin panel, jangan hardcode di kode.

## 5. Kontrak API — Frontend ↔ Backend Sendiri (Next.js Server Actions/Route Handlers)

Ini API/actions yang dikerjakan dalam project ini sendiri (bukan API orchestrator infra):

| Aksi | Input | Output (ringkas) |
|---|---|---|
| `getActiveProducts(userId)` | userId | `Order[]` dengan status ACTIVE/EXPIRING_SOON |
| `getOrderDetail(orderId)` | orderId | Detail order + data container (proxy dari API orchestrator) |
| `createOrder(userId, planId, paymentMethod)` | — | Order baru + trigger provisioning (panggil API orchestrator) |
| `topUp(userId, amount, method)` | — | Redirect URL payment gateway / status |
| `getBalance(userId)` | userId | Saldo saat ini |
| `getTransactionHistory(userId, filter)` | userId, filter jenis/tanggal | List gabungan transaksi & sewa |
| `dismissTutorial(userId, pageKey)` | — | Update `TutorialPref` |

## 6. Kontrak API — Frontend/Backend ↔ Orchestrator Infra (EKSTERNAL, dikelola tim lain)

Ini **belum final** — harus disepakati bersama tim infra, tapi ini asumsi awal supaya development bisa jalan paralel dengan mock:

| Aksi | Kebutuhan dari Orchestrator |
|---|---|
| Provisioning container baru | Endpoint yang terima `planId`/spesifikasi resource, return `containerId` + status |
| Cek status & resource usage container | Endpoint by `containerId`, return status/CPU/RAM/uptime |
| Perpanjang/extend container | Endpoint update masa aktif container |
| Reset/hapus container | Endpoint trigger delete+recreate dari base image |
| Akses CLI web | Mekanisme websocket/relay ke container — **protokol & autentikasi belum disepakati, jadi item open question di PRD** |
| Deploy dari GitHub | Endpoint terima artifact/trigger restart service di container |

**Tindakan lanjut:** dokumen ini perlu direvisi bersama tim infra begitu API mereka terbentuk — jangan anggap kontrak di atas final.

## 7. Environment Variables (Draft)

```
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
NEXT_PUBLIC_DATA_SOURCE=mock   # ganti ke "live" saat backend siap
PAYMENT_GATEWAY_API_KEY=
ORCHESTRATOR_API_URL=
ORCHESTRATOR_API_KEY=
```
