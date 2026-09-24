# Content & Copywriting Guide — RuPa Cloud

## 1. Prinsip Dasar

- **Bahasa Indonesia, sentence case** — bukan Title Case, bukan ALL CAPS (kecuali singkatan resmi seperti "CLI", "CPU")
- **Aktif, bukan pasif.** "Perpanjang server kamu" bukan "Server dapat diperpanjang"
- **Sesuai audiens: mahasiswa & developer pemula** — hindari jargon teknis berat tanpa penjelasan, tapi jangan juga terlalu childish. Target rasa: teman yang paham teknologi, bukan buku manual korporat, bukan juga terlalu santai/alay
- **Nama aksi konsisten di seluruh alur.** Kalau tombolnya "Sewa Sekarang", pesan sukses setelahnya jangan tiba-tiba bilang "Pesanan berhasil dibuat" — tetap pakai kata "sewa"/"disewa" supaya user tidak bingung apakah ini hal yang sama

## 2. Nada Bicara per Konteks

| Konteks | Nada |
|---|---|
| Landing/marketing | Percaya diri, jelas, tidak berlebihan (hindari superlatif kosong seperti "TERBAIK", "NO.1") |
| Dashboard/produk aktif | Informatif, tenang, langsung ke inti |
| Error/kegagalan | Jelas apa yang salah + langkah berikutnya, tidak menyalahkan user, tidak minta maaf berlebihan |
| Empty state | Ajakan bertindak, bukan sekadar "tidak ada data" |
| Tutorial/tooltip | Ringkas, 1 tooltip = 1 ide, tidak menggurui |

## 3. Contoh Microcopy Kunci

### Tombol (Call to Action)
Nama tombol = persis apa yang terjadi setelah diklik.
- "Sewa Sekarang" (bukan "Submit" atau "Order")
- "Perpanjang" (bukan "Extend" dicampur Bahasa Inggris)
- "Top-up Saldo"
- "Lihat Detail"
- "Hubungkan GitHub"

### Empty State
- Active Product kosong: *"Belum ada server yang aktif. Sewa server pertamamu dan mulai deploy dalam hitungan detik."* + tombol "Lihat Paket"
- Riwayat kosong: *"Belum ada transaksi. Aktivitas top-up dan sewa kamu akan muncul di sini."*

### Error
- Saldo tidak cukup di checkout: *"Saldo kamu belum cukup untuk paket ini. Top-up dulu, atau bayar langsung lewat metode lain."* + tombol aksi langsung ("Top-up" / "Bayar Langsung"), bukan cuma pesan mati
- Gagal provisioning: *"Server gagal disiapkan. Saldo kamu belum terpotong — coba lagi atau hubungi kami kalau masalah berlanjut."*
- OTP salah: *"Kode salah. Coba lagi atau kirim ulang kode."*
- Form register — email sudah terdaftar: *"Email ini sudah terdaftar. Masuk saja, atau pakai email lain."*

### Status Badge Container
- Aktif: **"Aktif"**
- Mendekati expired: **"Segera berakhir"** (bukan "Warning" atau istilah teknis)
- Expired: **"Berakhir"**
- Sedang disiapkan: **"Menyiapkan..."**

### Konfirmasi Aksi Destruktif
Reset manual container: *"Server ini akan direset dan semua data di dalamnya hilang. Yakin lanjutkan?"* — jelas konsekuensinya, tidak vague.

### Notifikasi Mendekati Expired
*"Server kamu akan berakhir dalam 1 hari. Perpanjang sekarang supaya tidak kehilangan akses, atau backup data kamu dulu."*

## 4. Tutorial/Coach Mark — Gaya Penulisan

- Maksimal 1-2 kalimat per tooltip
- Jelaskan **kegunaan**, bukan cuma nama elemen. Contoh baik: *"Di sini kamu bisa akses terminal server langsung dari browser, tanpa install apa pun."* — bukan sekadar *"Ini adalah fitur Web CLI."*
- Selalu ada tombol "Lewati" yang jelas terlihat, jangan disembunyikan

## 5. Hal yang Dihindari

- Eyebrow label ALL CAPS ("FITUR UNGGULAN") di atas heading
- Kata-kata generik seperti "Submit", "Klik di sini", "Learn More" tanpa konteks
- Emoji berlebihan di UI produk (boleh sedikit di marketing/landing kalau sesuai brand voice, tapi tidak di alur transaksional)
- Frasa maaf berlebihan di pesan error ("Mohon maaf sebesar-besarnya atas ketidaknyamanan ini...") — cukup jelas & solutif
