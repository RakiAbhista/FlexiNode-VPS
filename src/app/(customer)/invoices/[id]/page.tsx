"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { Printer, CheckCircle2, ArrowLeft, Building2 } from "lucide-react";
import { Transaction } from "@/lib/data/types";
import { dataSource } from "@/lib/data";
import { formatRupiah } from "@/lib/utils";

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const trxId = resolvedParams.id;

  const [trx, setTrx] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadInvoice() {
      const u = await dataSource.getCurrentUser("CUSTOMER");
      if (u) {
        const list = await dataSource.getTransactionsByUser(u.id);
        const found = list.find((t) => t.id === trxId) || list[0];
        setTrx(found || null);
      }
      setLoading(false);
    }
    loadInvoice();
  }, [trxId]);

  if (loading) {
    return <div className="h-64 bg-slate-200 rounded-2xl animate-pulse"></div>;
  }

  if (!trx) {
    return (
      <div className="p-8 text-center bg-white border rounded-2xl">
        <p className="text-xs text-neutral-600">Invoice tidak ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 print:m-0 print:max-w-none">
      <div className="flex items-center justify-between print:hidden">
        <Link
          href="/history"
          className="text-xs font-bold text-navy-900 hover:text-blue-600 inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Riwayat</span>
        </Link>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-navy-800 hover:bg-navy-900 text-white font-bold text-xs rounded-xl shadow inline-flex items-center gap-2"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak / Simpan PDF</span>
        </button>
      </div>

      <div className="p-8 sm:p-12 bg-white border border-slate-200 rounded-2xl shadow-sm print:border-none print:shadow-none print:p-12">
        {/* Header Invoice */}
        <div className="flex justify-between items-start border-b-2 border-navy-900 pb-6 mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-navy-900 font-extrabold text-2xl tracking-tight">
              <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
                <img src="/logo.png" alt="RuPa Cloud Logo" className="object-contain w-full h-full" />
              </div>
              <span className="text-2xl sm:text-3xl">RuPa<span className="text-blue-600">Cloud</span></span>
            </div>
            <div className="space-y-1 text-xs text-neutral-500">
              <strong className="text-navy-900 block text-sm">RuPa Cloud Platform</strong>
              <p>rupacloudarim@gmail.com</p>
            </div>
          </div>

          <div className="text-right space-y-2">
            <h1 className="text-3xl font-black text-navy-900 tracking-tight uppercase">Invoice</h1>
            <p className="text-xs text-neutral-500 font-mono">#{trx.id.split('-')[0].toUpperCase()}-{trx.id.split('-')[1]?.toUpperCase() || 'INV'}</p>
            <div className="pt-2">
              <span className="px-3 py-1 bg-green-100 border border-green-200 text-green-800 text-[10px] font-black uppercase rounded-lg inline-flex items-center gap-1 tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5" /> Lunas
              </span>
            </div>
          </div>
        </div>

        {/* Company & Customer Info */}
        <div className="grid grid-cols-2 gap-8 text-xs mb-8">
          <div className="space-y-2">
            <span className="font-bold text-neutral-400 uppercase tracking-widest text-[10px]">Ditagihkan Kepada</span>
            <strong className="text-navy-900 block text-sm font-extrabold">Pelanggan RuPa Cloud</strong>
            <p className="text-neutral-500">Metode Pembayaran: {trx.method === "BALANCE" ? "Saldo Wallet" : "Payment Gateway"}</p>
          </div>

          <div className="space-y-2 text-right">
            <span className="font-bold text-neutral-400 uppercase tracking-widest text-[10px]">Tanggal Pembayaran</span>
            <strong className="text-navy-900 block text-sm font-extrabold">
              {new Date(trx.createdAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </strong>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="mb-8 overflow-hidden rounded-xl border border-slate-200 text-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-navy-900 font-bold border-b border-slate-200">
              <tr>
                <th className="p-4 py-3 uppercase tracking-wider text-[10px]">Deskripsi Layanan</th>
                <th className="p-4 py-3 text-center uppercase tracking-wider text-[10px]">Tipe</th>
                <th className="p-4 py-3 text-right uppercase tracking-wider text-[10px]">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-neutral-700">
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 py-5 font-semibold text-navy-900">
                  {trx.type === "TOPUP"
                    ? "Top-up Saldo Wallet RuPa Cloud"
                    : trx.type === "EXTEND"
                    ? "Perpanjangan Masa Sewa Server"
                    : `Sewa Server VPS Mikro — ${trx.order?.plan?.name || "Paket Harian"}`}
                </td>
                <td className="p-4 py-5 text-center">
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase tracking-wider">
                    {trx.type}
                  </span>
                </td>
                <td className="p-4 py-5 text-right font-bold text-navy-900">{formatRupiah(trx.amount)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Total */}
        <div className="flex justify-end pt-4">
          <div className="w-1/2 space-y-3">
            <div className="flex justify-between text-sm font-bold text-neutral-500">
              <span>Subtotal</span>
              <span>{formatRupiah(trx.amount)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-neutral-500">
              <span>Pajak (0%)</span>
              <span>Rp0</span>
            </div>
            <div className="flex justify-between items-center border-t-2 border-navy-900 pt-3 mt-3">
              <span className="text-sm font-black uppercase tracking-wider text-navy-900">Total</span>
              <span className="text-3xl font-black text-blue-600">{formatRupiah(trx.amount)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-slate-100 text-center space-y-2">
          <p className="text-sm font-bold text-navy-900">Terima kasih atas kepercayaan Anda!</p>
          <p className="text-xs text-neutral-500">
            Jika Anda memiliki pertanyaan mengenai invoice ini, silakan hubungi kami di <strong>rupacloudarim@gmail.com</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
