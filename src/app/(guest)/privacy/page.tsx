import React from "react";

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 text-navy-900">
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-extrabold">Kebijakan Privasi</h1>
        <p className="text-xs text-neutral-500 mt-2">Terakhir diperbarui: 24 September 2026</p>
      </div>

      <div className="space-y-6 text-sm text-neutral-700 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-navy-900">1. Pengumpulan Informasi</h2>
          <p>
            Kami mengumpulkan informasi terbatas yang diperlukan untuk pengoperasian akun dan pembuatan invoice, seperti nama lengkap, alamat email, dan kredensial autentikasi.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-navy-900">2. Penggunaan Data & Integrasi GitHub</h2>
          <p>
            Informasi akun dan akses repositori GitHub (jika dihubungkan) hanya digunakan untuk memfasilitasi proses otomatisasi build dan deployment ke container milik pengguna. Kami tidak menjual data pengguna kepada pihak ketiga mana pun.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-navy-900">3. Keamanan Data</h2>
          <p>
            RuPa Cloud mengimplementasikan enkripsi standar industri untuk melindungi kredensial, transaksi saldo, dan aktivitas akun kamu.
          </p>
        </section>
      </div>
    </div>
  );
}
