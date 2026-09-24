import React from "react";

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 text-navy-900">
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-extrabold">Syarat & Ketentuan Layanan</h1>
        <p className="text-xs text-neutral-500 mt-2">Terakhir diperbarui: 24 September 2026</p>
      </div>

      <div className="space-y-6 text-sm text-neutral-700 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-navy-900">1. Ketentuan Umum</h2>
          <p>
            Dengan mendaftar dan menggunakan layanan RuPa Cloud, Anda menyetujui seluruh ketentuan yang tercantum dalam dokumen ini. RuPa Cloud berhak mengubah syarat dan ketentuan sewaktu-waktu sesuai perkembangan operasional.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-navy-900">2. Sewa Eceran & Masa Kedaluwarsa Server</h2>
          <p>
            RuPa Cloud menyediakan penyewaan VPS mikro dalam durasi pendek (1 hari, 3 hari, atau 1 minggu). Saat masa sewa berakhir (expired) dan tidak diperpanjang, sistem akan meng-reset container secara otomatis (menghapus seluruh isi data di dalamnya) untuk dikembalikan ke kapasitas semula.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-navy-900">3. Penggunaan Saldo (Closed-Loop Wallet)</h2>
          <p>
            Saldo akun RuPa Cloud bersifat *closed-loop*, yang berarti saldo hanya dapat digunakan untuk transaksi pembelian atau perpanjangan sewa di platform RuPa Cloud dan tidak dapat ditarik tunai atau ditransfer keluar dari platform.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-navy-900">4. Larangan Penggunaan (Abuse Policy)</h2>
          <p>
            Pengguna dilarang keras memanfaatkan container RuPa Cloud untuk kegiatan yang melanggar hukum, meliputi tetapi tidak terbatas pada: penambangan kripto (crypto mining), serangan DDoS, penyebaran malware, spamming, atau aktivitas pembobolan sistem. RuPa Cloud berhak membekukan (suspend) atau menghentikan akun yang melanggar tanpa pengembalian dana.
          </p>
        </section>
      </div>
    </div>
  );
}
