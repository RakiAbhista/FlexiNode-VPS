"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { History, Filter, FileText, ArrowUpRight, ArrowDownLeft, RefreshCcw } from "lucide-react";
import { Transaction, TransactionType } from "@/lib/data/types";
import { dataSource } from "@/lib/data";
import { formatRupiah, cn } from "@/lib/utils";

export default function UnifiedHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadHistory() {
      const u = await dataSource.getCurrentUser("CUSTOMER");
      if (u) {
        const data = await dataSource.getTransactionsByUser(u.id);
        setTransactions(data);
      }
      setLoading(false);
    }
    loadHistory();
  }, []);

  const filtered = transactions.filter((t) => {
    if (filterType === "ALL") return true;
    return t.type === filterType;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Riwayat Transaksi & Sewa</h1>
        <p className="text-xs text-neutral-600">
          Timeline gabungan aktivitas pengisian saldo (top-up), sewa server, dan perpanjangan.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 pb-2 border-b border-slate-200 overflow-x-auto">
        <span className="text-xs font-semibold text-neutral-500 flex items-center gap-1 mr-2">
          <Filter className="w-3.5 h-3.5" /> Filter Jenis:
        </span>
        {[
          { id: "ALL", label: "Semua Aktivitas" },
          { id: "TOPUP", label: "Top-up Saldo" },
          { id: "RENTAL", label: "Sewa Server Baru" },
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

      {/* Timeline List */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        /* Empty State as mandated by Copy Guide §3 */
        <div className="p-12 bg-white border border-slate-200 rounded-2xl text-center space-y-3">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
            <History className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-navy-900">Belum ada transaksi</h3>
          <p className="text-xs text-neutral-600">
            Aktivitas top-up dan sewa kamu akan muncul di sini.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const isTopUp = item.type === "TOPUP";
            const isExtend = item.type === "EXTEND";

            return (
              <div
                key={item.id}
                className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-between gap-4 hover:border-blue-300 transition-all"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                      isTopUp
                        ? "bg-green-100 text-green-700"
                        : isExtend
                        ? "bg-blue-100 text-blue-700"
                        : "bg-navy-800 text-white"
                    )}
                  >
                    {isTopUp ? (
                      <ArrowDownLeft className="w-5 h-5" />
                    ) : isExtend ? (
                      <RefreshCcw className="w-5 h-5" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5" />
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      {item.type}
                    </span>
                    <h3 className="font-bold text-navy-900 text-sm">
                      {isTopUp
                        ? "Pengisian Saldo Wallet"
                        : isExtend
                        ? `Perpanjangan ${item.order?.plan?.name || "Server"}`
                        : `Sewa ${item.order?.plan?.name || "Server VPS Mikro"}`}
                    </h3>
                    <p className="text-[11px] text-neutral-500">
                      {new Date(item.createdAt).toLocaleString("id-ID")} • Metode:{" "}
                      {item.method === "BALANCE" ? "Saldo" : "Gateway"}
                    </p>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <span
                    className={cn(
                      "text-base font-extrabold block",
                      isTopUp ? "text-green-600" : "text-navy-900"
                    )}
                  >
                    {isTopUp ? "+" : "-"} {formatRupiah(item.amount)}
                  </span>
                  <Link
                    href={`/invoices/${item.id}`}
                    className="text-[11px] font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    <FileText className="w-3 h-3" />
                    <span>Lihat Invoice</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
