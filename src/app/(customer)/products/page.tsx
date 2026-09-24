"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Server, Clock, ArrowRight, Filter, ExternalLink } from "lucide-react";
import { Order, OrderStatus } from "@/lib/data/types";
import { dataSource } from "@/lib/data";
import { cn } from "@/lib/utils";

export default function ActiveProductsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadOrders() {
      const u = await dataSource.getCurrentUser("CUSTOMER");
      if (u) {
        const data = await dataSource.getOrdersByUser(u.id);
        setOrders(data);
      }
      setLoading(false);
    }
    loadOrders();
  }, []);

  const getBadgeStyle = (status: OrderStatus) => {
    switch (status) {
      case "ACTIVE":
        return { label: "Aktif", bg: "bg-green-100 text-green-800 border-green-200" };
      case "EXPIRING_SOON":
        return { label: "Segera berakhir", bg: "bg-amber-100 text-amber-800 border-amber-200" };
      case "EXPIRED":
        return { label: "Berakhir", bg: "bg-red-100 text-red-800 border-red-200" };
      case "PROVISIONING":
      case "PENDING":
        return { label: "Menyiapkan...", bg: "bg-blue-100 text-blue-800 border-blue-200" };
      default:
        return { label: "Tidak aktif", bg: "bg-slate-100 text-slate-800 border-slate-200" };
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filterStatus === "ALL") return true;
    return o.status === filterStatus;
  });

  return (
    <div className="space-y-8">
      {/* Header & Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Server Saya</h1>
          <p className="text-xs text-neutral-600">
            Daftar container VPS mikro yang kamu sewa. Klik "Detail" untuk membuka Web CLI & konfigurasi.
          </p>
        </div>

        <Link
          href="/product"
          className="px-4 py-2.5 bg-navy-800 hover:bg-navy-900 text-white font-bold text-xs rounded-xl shadow inline-flex items-center gap-2 transition-all"
        >
          <Server className="w-4 h-4" />
          <span>Sewa Server Baru</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 pb-2 border-b border-slate-200 overflow-x-auto">
        <span className="text-xs font-semibold text-neutral-500 flex items-center gap-1 mr-2">
          <Filter className="w-3.5 h-3.5" /> Filter:
        </span>
        {[
          { id: "ALL", label: "Semua Server" },
          { id: "ACTIVE", label: "Aktif" },
          { id: "EXPIRING_SOON", label: "Segera Berakhir" },
          { id: "EXPIRED", label: "Berakhir" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors",
              filterStatus === tab.id
                ? "bg-navy-800 text-white shadow-sm"
                : "bg-white text-navy-900 border border-slate-200 hover:bg-slate-100"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Product List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="h-44 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        /* Empty State as mandated by Copy Guide §3 */
        <div className="p-12 bg-white border border-slate-200 rounded-2xl text-center space-y-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
            <Server className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold text-navy-900">Belum ada server yang aktif</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Sewa server pertamamu dan mulai deploy dalam hitungan detik.
            </p>
          </div>
          <Link
            href="/product"
            className="px-5 py-2.5 bg-navy-800 hover:bg-navy-900 text-white font-bold text-xs rounded-xl shadow inline-flex items-center gap-1.5 transition-all"
          >
            <span>Lihat Paket</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredOrders.map((order) => {
            const badge = getBadgeStyle(order.status);
            return (
              <div
                key={order.id}
                className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-blue-400 transition-all space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span
                      className={cn(
                        "inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border",
                        badge.bg
                      )}
                    >
                      {badge.label}
                    </span>
                    <h3 className="font-extrabold text-navy-900 text-lg">
                      {order.plan?.name || "Server LXD"}
                    </h3>
                    <p className="text-xs text-neutral-500 font-mono flex items-center gap-1">
                      <span>{order.subdomain}</span>
                      <ExternalLink className="w-3 h-3 text-neutral-400" />
                    </p>
                  </div>

                  {/* Button Detail (PRD Decision #1) */}
                  <Link
                    href={`/products/${order.id}`}
                    className="px-4 py-2 bg-navy-800 hover:bg-navy-900 text-white font-bold text-xs rounded-xl shadow transition-all flex-shrink-0"
                  >
                    Detail
                  </Link>
                </div>

                {/* Container specs summary */}
                <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-slate-50 rounded-xl text-center text-xs">
                  <div>
                    <span className="text-[10px] text-neutral-400 block">RAM</span>
                    <span className="font-bold text-navy-900">{order.plan?.ramMb}MB</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 block">CPU</span>
                    <span className="font-bold text-navy-900">{order.plan?.cpuAllowance}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 block">Storage</span>
                    <span className="font-bold text-navy-900">{order.plan?.storageGb}GB</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-neutral-600">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>
                      Sisa masa sewa:{" "}
                      <strong className="text-navy-900">
                        {order.expiresAt
                          ? `${Math.max(
                              0,
                              Math.ceil(
                                (new Date(order.expiresAt).getTime() - Date.now()) /
                                  (1000 * 60 * 60 * 24)
                              )
                            )} hari`
                          : "-"}
                      </strong>
                    </span>
                  </div>
                  <span className="text-[11px] text-neutral-400">IP: {order.ipAddress}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
