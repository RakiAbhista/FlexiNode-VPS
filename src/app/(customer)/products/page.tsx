"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Server, Clock, ArrowRight, Filter, ExternalLink, AlertTriangle, RotateCcw } from "lucide-react";
import { Order, OrderStatus } from "@/lib/data/types";
import { dataSource } from "@/lib/data";
import { cn } from "@/lib/utils";

export default function ActiveProductsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [powerFilter, setPowerFilter] = useState<"ALL" | "RUNNING" | "STOPPED">("ALL");
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
        return { label: "Sewa Aktif", bg: "bg-green-100 text-green-800 border-green-200" };
      case "EXPIRING_SOON":
        return { label: "Segera Berakhir", bg: "bg-amber-100 text-amber-800 border-amber-200" };
      case "EXPIRED":
        return { label: "Masa Tenggang", bg: "bg-red-100 text-red-800 border-red-200" };
      case "FAILED":
        return { label: "Dihapus Permanen", bg: "bg-red-950/10 text-red-700 border-red-300 font-bold" };
      case "PROVISIONING":
      case "PENDING":
        return { label: "Menyiapkan...", bg: "bg-blue-100 text-blue-800 border-blue-200" };
      default:
        return { label: "Tidak aktif", bg: "bg-slate-100 text-slate-800 border-slate-200" };
    }
  };

  const counts = {
    ALL: orders.length,
    ACTIVE: orders.filter((o) => o.status === "ACTIVE").length,
    EXPIRING_SOON: orders.filter((o) => o.status === "EXPIRING_SOON").length,
    EXPIRED: orders.filter((o) => o.status === "EXPIRED").length,
    FAILED: orders.filter((o) => o.status === "FAILED").length,
    PROVISIONING: orders.filter((o) => o.status === "PROVISIONING" || o.status === "PENDING").length,
  };

  const filterTabs = [
    { id: "ALL", label: "Semua Server", count: counts.ALL },
    { id: "ACTIVE", label: "Sewa Aktif", count: counts.ACTIVE },
    { id: "EXPIRING_SOON", label: "Segera Berakhir", count: counts.EXPIRING_SOON },
    { id: "EXPIRED", label: "Masa Tenggang", count: counts.EXPIRED },
    { id: "FAILED", label: "Dihapus Permanen", count: counts.FAILED },
    ...(counts.PROVISIONING > 0
      ? [{ id: "PROVISIONING", label: "Menyiapkan", count: counts.PROVISIONING }]
      : []),
  ];

  const filteredOrders = orders.filter((o) => {
    // 1. Status Sewa Filter
    if (filterStatus !== "ALL") {
      if (filterStatus === "PROVISIONING") {
        if (o.status !== "PROVISIONING" && o.status !== "PENDING") return false;
      } else if (o.status !== filterStatus) {
        return false;
      }
    }

    // 2. Status Mesin Filter
    if (powerFilter !== "ALL") {
      const isRunning = o.status !== "FAILED" && (o.serverStatus ?? "RUNNING") === "RUNNING";
      if (powerFilter === "RUNNING" && !isRunning) return false;
      if (powerFilter === "STOPPED" && isRunning) return false;
    }

    return true;
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

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        {/* Status Sewa Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <span className="text-xs font-semibold text-neutral-500 flex items-center gap-1 mr-1 flex-shrink-0">
            <Filter className="w-3.5 h-3.5" /> Sewa:
          </span>
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5",
                filterStatus === tab.id
                  ? "bg-navy-800 text-white shadow-sm"
                  : "bg-white text-navy-900 border border-slate-200 hover:bg-slate-100"
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none",
                  filterStatus === tab.id
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-neutral-600"
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Status Mesin Power Toggle */}
        <div className="flex items-center gap-1.5 flex-shrink-0 text-xs">
          <span className="text-neutral-500 font-semibold text-[11px] mr-1">Mesin:</span>
          {[
            { id: "ALL", label: "Semua" },
            { id: "RUNNING", label: "Berjalan" },
            { id: "STOPPED", label: "Berhenti" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPowerFilter(item.id as any)}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                powerFilter === item.id
                  ? "bg-slate-800 text-white font-semibold shadow-sm"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="h-44 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        orders.length === 0 ? (
          /* Empty State: No Orders at all */
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
              <span>Lihat Katalog Paket</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          /* Empty State: Filter mismatch */
          <div className="p-10 bg-white border border-slate-200 rounded-2xl text-center space-y-3">
            <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mx-auto">
              <Filter className="w-5 h-5" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-sm font-bold text-navy-900">Tidak ada server yang cocok</h3>
              <p className="text-xs text-neutral-500">
                Tidak ada server VPS mikro yang sesuai dengan kombinasi filter yang kamu pilih.
              </p>
            </div>
            <button
              onClick={() => {
                setFilterStatus("ALL");
                setPowerFilter("ALL");
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-navy-900 font-semibold text-xs rounded-xl inline-flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredOrders.map((order) => {
            const badge = getBadgeStyle(order.status);
            const isServerRunning =
              order.status !== "FAILED" && (order.serverStatus ?? "RUNNING") === "RUNNING";
            const daysLeft = order.expiresAt
              ? Math.ceil((new Date(order.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              : null;

            return (
              <div
                key={order.id}
                className={cn(
                  "p-6 bg-white border rounded-2xl shadow-sm transition-all space-y-4",
                  order.status === "FAILED"
                    ? "border-red-200/80 bg-red-50/20"
                    : order.status === "EXPIRED"
                    ? "border-amber-200/80"
                    : "border-slate-200 hover:border-blue-400"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5">
                    {/* Badges bar */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Status Sewa Badge */}
                      <span
                        className={cn(
                          "inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border",
                          badge.bg
                        )}
                      >
                        {badge.label}
                      </span>

                      {/* Status Mesin VPS Badge */}
                      {order.status === "FAILED" ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 bg-red-100/70 text-red-800 border border-red-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          <span>Container Musnah</span>
                        </span>
                      ) : (
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 border",
                            isServerRunning
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-100 text-slate-700 border border-slate-300"
                          )}
                        >
                          <span
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              isServerRunning ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                            )}
                          />
                          <span>{isServerRunning ? "Server Berjalan" : "Server Berhenti"}</span>
                        </span>
                      )}

                      {/* Addon Badges */}
                      {order.addon && !order.addonSuspended && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                          CI/CD
                        </span>
                      )}
                      {order.addon && order.addonSuspended && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          Add-on Ditangguhkan
                        </span>
                      )}
                    </div>

                    <h3 className="font-extrabold text-navy-900 text-lg">
                      {order.plan?.name || "Server LXD"}
                    </h3>
                    <p className="text-xs text-neutral-500 font-mono flex items-center gap-1">
                      <span>{order.subdomain || "Tanpa subdomain"}</span>
                      {order.subdomain && <ExternalLink className="w-3 h-3 text-neutral-400" />}
                    </p>
                  </div>

                  {/* Button Detail */}
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

                {/* Footer Info: Expiry / Grace / Deletion & IP */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-neutral-600">
                  {order.status === "FAILED" ? (
                    <div className="flex items-center gap-1.5 text-red-700">
                      <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                      <span className="font-semibold text-[11px]">Telah dihapus permanen (Lewat 7 hari)</span>
                    </div>
                  ) : order.status === "EXPIRED" ? (
                    <div className="flex items-center gap-1.5 text-red-700">
                      <Clock className="w-4 h-4 text-red-600 flex-shrink-0" />
                      <span className="font-semibold text-[11px]">Masa tenggang (Toleransi 7 hari)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span>
                        Sisa masa sewa:{" "}
                        <strong className="text-navy-900">
                          {daysLeft !== null
                            ? daysLeft <= 0
                              ? "< 1 hari"
                              : `${daysLeft} hari`
                            : "-"}
                        </strong>
                      </span>
                    </div>
                  )}

                  <span className="text-[11px] text-neutral-400 font-mono">
                    {order.status === "FAILED" ? "IP: Nonaktif" : `IP: ${order.ipAddress || "-"}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
