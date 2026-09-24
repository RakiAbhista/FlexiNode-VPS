# Design System — RuPa Cloud

Referensi visual utama: **Hostinger** — clean, modern, animasi halus & bertujuan (bukan dekorasi berlebihan). Mode: **Light mode saja** untuk versi awal.

> **Catatan penting:** Logo RuPa Cloud yang sudah dibuat sebelumnya pakai aksen **teal**, sementara palet resmi di bawah ini bertema **navy-blue**. Ini perlu diselaraskan — opsi: (a) revisi logo ke aksen biru supaya konsisten dengan UI, atau (b) tetap pakai teal khusus di logo sebagai "aksen tunggal" yang membedakan brand mark dari UI produk. Putuskan salah satu sebelum aset final dipakai di produksi.

## 1. Warna

### Palet brand (dari user)

| Token | Hex | Peran |
|---|---|---|
| `navy-900` | `#021024` | Warna paling gelap — teks utama, elemen "highlight" penting (sesuai arahan: warna gelap dipakai buat menyorot, bukan dominan) |
| `navy-800` | `#052659` | Gelap sekunder — heading besar, tombol primary, elemen navigasi aktif |
| `blue-600` | `#5483B3` | Aksen interaktif utama — tombol CTA, link, ikon aktif |
| `blue-400` | `#7DA0CA` | Aksen sekunder — hover state, border aktif, elemen dekoratif ringan |
| `blue-100` | `#C1E8FF` | Latar belakang lembut — section alternatif, card background, badge netral |
| `white` | `#FFFFFF` | Latar belakang utama/dominan |

**Prinsip pemakaian (sesuai arahan user):** warna **cerah** (`white`, `blue-100`) jadi latar belakang dominan di seluruh halaman. Warna **gelap** (`navy-900`, `navy-800`) dipakai secukupnya untuk menyorot — teks penting, tombol utama, judul — bukan jadi warna dasar section besar.

### Warna semantik (tambahan, di luar palet brand)

Dibutuhkan untuk status yang harus jelas beda tanpa mengandalkan warna biru saja (misal status container aktif/mendekati-expired/expired):

| Token | Hex (indikatif) | Peran |
|---|---|---|
| `success` | `#16A34A` | Status aktif, transaksi berhasil |
| `warning` | `#D97706` | Mendekati expired, saldo hampir habis |
| `danger` | `#DC2626` | Expired, gagal, aksi destruktif (reset/hapus) |
| `neutral` | `#6B7280` | Teks sekunder, elemen nonaktif |

### Teks

| Token | Sumber | Peran |
|---|---|---|
| `text-primary` | `navy-900` | Heading, body text utama |
| `text-secondary` | `neutral` / `navy-800` di atas background terang | Deskripsi, label sekunder |
| `text-on-dark` | `white` | Teks di atas background gelap (navbar, tombol primary) |

## 2. Tipografi

**Font:** satu keluarga font, sans-serif clean dengan beberapa bobot — rekomendasi **Plus Jakarta Sans** (karakter modern-friendly, tetap clean, tidak se-generik Inter untuk sebuah brand yang ingin punya identitas). Fallback stack: `"Plus Jakarta Sans", system-ui, -apple-system, sans-serif`.

**Skala tipografi:**

| Level | Ukuran | Bobot | Pemakaian |
|---|---|---|---|
| Display | 48–56px | 700 (Bold) | Hero headline landing page |
| H1 | 36px | 700 | Judul halaman |
| H2 | 28px | 600 | Judul section |
| H3 | 20px | 600 | Judul card/subsection |
| Body | 16px | 400 | Teks paragraf utama |
| Small | 14px | 400 | Caption, label form, metadata |
| Micro | 12px | 500 | Badge, tag |

Line-height body: 1.6. Line length maksimal ±75 karakter untuk blok teks panjang (deskripsi, FAQ) supaya nyaman dibaca.

## 3. Spacing & Layout

- Basis skala spacing: kelipatan 4px (4, 8, 12, 16, 24, 32, 48, 64)
- Container max-width: 1280px, padding horizontal 16px (mobile) / 24px (tablet) / 32px (desktop)
- Grid: 12 kolom di desktop, 4 kolom di mobile

## 4. Breakpoints (Prioritas: HP & Desktop, Tablet sekunder)

| Nama | Lebar | Prioritas |
|---|---|---|
| `sm` (mobile) | 0–639px | **Utama** |
| `md` (tablet) | 640–1023px | Sekunder — pastikan tidak rusak, tidak perlu optimasi khusus berlebihan |
| `lg` (desktop) | 1024px+ | **Utama** |

## 5. Border Radius & Elevation

- Radius standar: `8px` untuk card/input, `9999px` (full) untuk badge/pill/tombol kecil — konsisten satu skala radius, hindari campur banyak nilai radius berbeda tanpa alasan (lihat catatan anti-pola di bawah)
- Shadow: gunakan tipis & jarang — 1 level shadow untuk elemen "mengambang" (dropdown, modal), hindari shadow abu-abu generik di semua card sekaligus

## 6. Komponen Kunci (via shadcn/ui, disesuaikan token di atas)

- **Button:** primary (`navy-800` bg, teks putih), secondary (outline `blue-600`), ghost (teks saja, dipakai untuk aksi sekunder). Hindari terlalu banyak varian warna tombol dalam satu layar.
- **Card:** background putih atau `blue-100`, border tipis `blue-400` opacity rendah, radius 8px
- **Badge status:** pakai warna semantik (success/warning/danger), bentuk pill, teks singkat sentence case (bukan ALL CAPS)
- **Form input:** border `neutral`, focus ring `blue-600`, error state pakai `danger` + pesan jelas di bawah field
- **Tooltip/Coach mark (tutorial):** muncul menempel ke elemen terkait, background `navy-800`, teks putih, tombol "Lewati" & indikator progres kalau multi-step
- **Navbar:** sticky top, background putih/blur tipis saat scroll, tombol Checkout & profil menonjol di kanan (sesuai keputusan produk)

## 7. Motion

Sesuai referensi Hostinger ("animasi smooth") tapi tetap disiplin:
- Satu momen animasi utama per halaman (misal hero reveal saat landing page load), bukan setiap section fade-in berturut-turut
- Transisi hover pada tombol/card: 150–200ms, easing halus (`ease-out`)
- Motion yang merespons aksi user (checkout sukses, tooltip muncul) lebih penting daripada motion dekoratif pasif
- Hormati `prefers-reduced-motion` — matikan animasi non-esensial kalau user mengaktifkan preferensi ini di OS mereka

## 8. Ikonografi

Gunakan **Lucide Icons** (bawaan ekosistem shadcn/ui) — outline style, konsisten stroke-width, selaras gaya logo (guratan sederhana).

## 9. Anti-pola yang Perlu Dihindari

Supaya hasilnya tidak terasa seperti template AI generik:
- Jangan pakai eyebrow label ALL CAPS di atas tiap heading
- Jangan tambahkan penomoran (01/02/03) kecuali kontennya memang berupa urutan/langkah
- Jangan pakai radius/shadow yang berbeda-beda tanpa sistem yang jelas
- Jangan taruh gradient dekoratif di background tanpa alasan fungsional
- Satu keluarga font saja — jangan campur serif+sans tanpa kebutuhan jelas
