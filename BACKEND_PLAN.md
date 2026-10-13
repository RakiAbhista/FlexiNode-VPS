# RupaCloud Backend Implementation Plan

> Status keseluruhan: **SELESAI** (semua fase sudah diimplementasikan)

## Spesifikasi Host VPS
- **Host:** 4GB RAM, 2 Core CPU
- **Pembagian:** 4x Micro VPS × 512MB RAM, 50% CPU (0.5 core)
- **Sisa untuk Host OS + Platform:** ~2GB RAM aman
- **Virtualisasi:** Incus (LXC containers)
- **Database:** PostgreSQL via Prisma (Supabase)

---

## Harga Paket

| Paket | Durasi | Harga | Add-on CI/CD |
|---|---|---|---|
| Micro VPS 1 Hari | 1 hari | Rp 3.500 | ❌ |
| Micro VPS 3 Hari | 3 hari | Rp 9.000 | +Rp 3.000 |
| Micro VPS 7 Hari | 7 hari | Rp 18.000 | +Rp 3.000 |

**Add-on** mencakup: Subdomain `*.rupacloud.id` + CI/CD otomatis via GitHub Actions.

---

## Fase 1: Database Seed & Schema ✅

**File yang terlibat:**
- `prisma/schema.prisma` — Tambah `addon: Boolean`, `addonPrice: Int` ke model `Order`
- `prisma/seed.ts` — Data plan sesuai harga real, RAM 512MB

**Instruksi agent:**
- Jalankan `npx prisma db push` (bukan `prisma migrate dev`, karena environment non-interaktif)
- Jalankan `npx prisma db seed` untuk reset data

---

## Fase 2: Provisioning API (Create Order + Incus) ✅

**File yang terlibat:**
- `src/lib/incus.ts` — Wrapper CLI `incus` via `child_process.exec`. CPU menggunakan `limits.cpu.allowance=50%`
- `src/lib/subdomain.ts` — Mock subdomain provisioner (simpan ke `AppConfig`). **Ganti dengan Cloudflare API saat domain aktif.**
- `src/lib/github-cicd.ts` — GitHub REST API helper (inject workflow, set secret, list repos)
- `src/app/api/customer/orders/create/route.ts` — Endpoint pembelian utama

**Flow pembelian:**
1. Validasi saldo user
2. `prisma.$transaction`: potong saldo + buat Order `PROVISIONING`
3. `incus.createAndStart()` — buat container
4. Tunggu 3 detik → `incus.getIp()` — ambil IP
5. Jika `withAddon=true`: provisioning subdomain mock + inject GitHub workflow
6. Update Order ke `ACTIVE`
7. Jika Incus gagal: **rollback saldo otomatis**, Order `FAILED`

**Request body `POST /api/customer/orders/create`:**
```json
{
  "planId": "plan-micro-3d",
  "paymentMethod": "BALANCE",
  "withAddon": true,
  "githubToken": "ghp_...",
  "githubOwner": "username",
  "githubRepo": "my-repo"
}
```

---

## Fase 3: Lifecycle Management (Cron) ✅

**File yang terlibat:**
- `src/app/api/cron/lifecycle/route.ts` — Satu endpoint, tiga job
- `src/app/api/customer/orders/[id]/extend/route.ts` — Perpanjangan + auto-restart container
- `src/app/api/customer/orders/[id]/action/route.ts` — Manual start/stop/restart via Incus

**Tiga job di cron lifecycle:**

| Job | Trigger | Aksi |
|---|---|---|
| **Mark Expiring** | `ACTIVE` + `expiresAt < 24 jam` | Status → `EXPIRING_SOON` |
| **Suspend** | `ACTIVE/EXPIRING_SOON` + `expiresAt < now` | `incus stop` → `EXPIRED` |
| **Delete** | `EXPIRED` + `expiresAt < 7 hari lalu` | `incus delete` + hapus subdomain → `FAILED` |

**Setup cron di server (jalankan sekali setelah deploy):**
```bash
# Edit crontab
crontab -e

# Tambahkan baris ini (setiap 30 menit):
*/30 * * * * curl -s -X POST -H "x-cron-secret: <CRON_SECRET>" http://localhost:3000/api/cron/lifecycle
```

**Environment variable yang diperlukan:**
```env
CRON_SECRET="ganti-dengan-string-acak-panjang"
```

---

## Fase 4: Add-on CI/CD Setup ✅

**File yang terlibat:**
- `src/lib/ssh.ts` — Generate SSH key pair via `ssh-keygen` CLI (native, no extra deps)
- `src/lib/github-cicd.ts` — Enkripsi secret dengan `libsodium-wrappers` (wajib by GitHub API)
- `src/app/api/customer/orders/[id]/setup-cicd/route.ts` — Orchestrasi full CI/CD setup

**Flow setup CI/CD (user panggil setelah order aktif):**
1. Generate SSH key pair Ed25519 (disimpan sementara di `/tmp`, langsung dihapus)
2. Inject public key ke container: `incus exec {name} -- bash -c "..."`
3. Install + aktifkan OpenSSH di container
4. Enkripsi private key → simpan sebagai GitHub Secret `SSH_PRIVATE_KEY`
5. Simpan IP server sebagai GitHub Secret `SERVER_IP`
6. Inject file `.github/workflows/deploy.yml` ke repo user
7. Setiap push ke branch `main` → GitHub Actions SSH ke container → deploy otomatis

**Request body `POST /api/customer/orders/[id]/setup-cicd`:**
```json
{
  "owner": "username-github",
  "repo": "nama-repo"
}
```

> **Catatan:** User harus sudah login via GitHub agar `githubToken` tersimpan di DB. Token diambil dari session, tidak perlu dikirim ulang di body.

**Workflow yang diinject ke repo user:**
- Trigger: push ke `main`
- Action: `appleboy/ssh-action` — SSH ke VPS, pull repo, `npm install`, restart via `pm2`

---

## Subdomain Mock → Production

Saat ini subdomain disimpan di tabel `AppConfig` sebagai mock DNS.
Ketika domain aktif, ganti hanya fungsi `subdomain.provision()` di `src/lib/subdomain.ts`:

```typescript
// Ganti ini:
await prisma.appConfig.upsert(...)

// Dengan ini (Cloudflare API):
await fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${CF_TOKEN}` },
  body: JSON.stringify({ type: 'A', name: containerName, content: ipAddress, ttl: 120 })
})
```

---

## Dependency Tambahan

| Package | Alasan | Bisa Dihapus? |
|---|---|---|
| `libsodium-wrappers` | GitHub API wajib NaCl encryption untuk secrets | Tidak, tidak ada native Node equivalent |

