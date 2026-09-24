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
    <div className="max-w-3xl mx-auto space-y-6">
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

      <div className="p-8 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-8 print:border-none print:shadow-none">
        {/* Header Invoice */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-6">
          <div className="space-y-1">
            <h1 className="text-xl font-extrabold text-navy-900">INVOICE PEMBAYARAN</h1>
            <p className="text-xs text-neutral-500 font-mono">No: {trx.id}</p>
          </div>

          <div className="text-right space-y-1">
            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-lg inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> LUNAS
            </span>
            <p className="text-xs text-neutral-500">
              {new Date(trx.createdAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Company & Customer Info */}
        <div className="grid grid-cols-2 gap-6 text-xs">
          <div className="space-y-1">
            <span className="font-bold text-neutral-400 uppercase tracking-wider block">Penerbit</span>
            <strong className="text-navy-900 block text-sm">RuPa Cloud Platform</strong>
            <p className="text-neutral-500">PT Maruta Alpa Teknologi</p>
            <p className="text-neutral-500">support@rupacloud.id</p>
          </div>

          <div className="space-y-1 text-right">
            <span className="font-bold text-neutral-400 uppercase tracking-wider block">Ditujukan Untuk</span>
            <strong className="text-navy-900 block text-sm">Pelanggan RuPa Cloud</strong>
            <p className="text-neutral-500">Metode: {trx.method === "BALANCE" ? "Saldo Wallet" : "Payment Gateway"}</p>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="border border-slate-200 rounded-xl overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-navy-900 font-bold">
              <tr>
                <th className="p-3">Deskripsi Item</th>
                <th className="p-3 text-center">Tipe</th>
                <th className="p-3 text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-neutral-700">
              <tr>
                <td className="p-3 font-semibold text-navy-900">
                  {trx.type === "TOPUP"
                    ? "Top-up Saldo Wallet RuPa Cloud"
                    : trx.type === "EXTEND"
                    ? "Perpanjangan Masa Sewa Server"
                    : `Sewa Server VPS Mikro — ${trx.order?.plan?.name || "Paket Harian"}`}
                </td>
                <td className="p-3 text-center uppercase font-mono">{trx.type}</td>
                <td className="p-3 text-right font-bold text-navy-900">{formatRupiah(trx.amount)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Total */}
        <div className="flex justify-end border-t border-slate-100 pt-4">
          <div className="space-y-1 text-right">
            <span className="text-xs text-neutral-500">Total Pembayaran:</span>
            <p className="text-2xl font-extrabold text-navy-900">{formatRupiah(trx.amount)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
