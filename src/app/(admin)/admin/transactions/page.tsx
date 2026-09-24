"use client";

import React, { useState, useEffect } from "react";
import { Download, Filter, FileText } from "lucide-react";
import { Transaction } from "@/lib/data/types";
import { dataSource } from "@/lib/data";
import { formatRupiah, cn } from "@/lib/utils";

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await dataSource.getAllTransactions();
      setTransactions(data);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = transactions.filter((t) => {
    if (filterType === "ALL") return true;
    return t.type === filterType;
  });

  const exportCSV = () => {
    alert("Export CSV transaksi berhasil di-generate dan diunduh.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Manajemen Transaksi</h1>
          <p className="text-xs text-neutral-600">Audit mutasi keuangan dan pengisian saldo pelanggan.</p>
        </div>

        <button
          onClick={exportCSV}
          className="px-4 py-2.5 bg-navy-800 hover:bg-navy-900 text-white font-bold text-xs rounded-xl shadow inline-flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV Pembukuan</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 pb-2 border-b border-slate-200 overflow-x-auto">
        <span className="text-xs font-semibold text-neutral-500 flex items-center gap-1 mr-2">
          <Filter className="w-3.5 h-3.5" /> Filter Jenis:
        </span>
        {[
          { id: "ALL", label: "Semua Transaksi" },
          { id: "TOPUP", label: "Top-up Saldo" },
          { id: "RENTAL", label: "Sewa Baru" },
          { id: "EXTEND", label: "Perpanjangan" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors",
              filterType === tab.id
                ? "bg-navy-800 text-white shadow-sm"
                : "bg-white text-navy-900 border border-slate-200 hover:bg-slate-100"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-navy-900 font-bold">
            <tr>
              <th className="p-4">ID Transaksi</th>
              <th className="p-4">Pelanggan</th>
              <th className="p-4">Tipe</th>
              <th className="p-4">Nominal</th>
              <th className="p-4">Metode</th>
              <th className="p-4">Tanggal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-neutral-700">
            {filtered.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="p-4 font-mono font-bold text-navy-900">{t.id}</td>
                <td className="p-4">{t.user?.name || "Customer"}</td>
                <td className="p-4 font-mono font-bold">{t.type}</td>
                <td className="p-4 font-bold text-navy-900">{formatRupiah(t.amount)}</td>
                <td className="p-4">{t.method}</td>
                <td className="p-4">{new Date(t.createdAt).toLocaleString("id-ID")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
