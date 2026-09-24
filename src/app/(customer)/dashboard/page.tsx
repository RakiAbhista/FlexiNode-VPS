import React from "react";
import Link from "next/link";
import {
  Wallet,
  Server,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  Clock,
  ChevronRight,
  Zap,
} from "lucide-react";
import { dataSource } from "@/lib/data";
import { formatRupiah, cn } from "@/lib/utils";

export default async function CustomerDashboard() {
  const user = await dataSource.getCurrentUser("CUSTOMER");
  const userId = user?.id || "usr_cust_1";
  const orders = await dataSource.getOrdersByUser(userId);

  const activeOrders = orders.filter((o) => o.status === "ACTIVE" || o.status === "EXPIRING_SOON");
  const expiringSoonOrders = orders.filter((o) => o.status === "EXPIRING_SOON");

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-navy-900 to-navy-800 text-white rounded-2xl p-6 sm:p-8 shadow-lg relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 z-10">
          <span className="text-xs text-blue-300 font-semibold uppercase tracking-wider">
            RuPa Cloud Dashboard
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold">
            Selamat Datang Kembali, {user?.name || "Developer"}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-neutral-300 max-w-xl">
            Kelola VPS mikro harian kamu, cek status jam operasional, dan lakukan perpanjangan dalam satu tempat.
          </p>
        </div>

        <Link
          href="/product"
          className="z-10 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all inline-flex items-center gap-2 flex-shrink-0"
        >
          <Zap className="w-4 h-4 fill-white" />
          <span>Sewa Server Baru</span>
        </Link>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Saldo Card */}
        <div id="tour-saldo-card" className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500">Saldo Akun Saat Ini</span>
            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-3xl font-extrabold text-navy-900">
              {user ? formatRupiah(user.balance) : "Rp0"}
            </h2>
            <p className="text-[11px] text-neutral-500">Bisa dipakai langsung untuk sewa harian</p>
          </div>
          <div className="pt-2">
            <Link
              href="/topup"
              className="w-full py-2 bg-slate-100 hover:bg-blue-100 text-navy-900 hover:text-blue-600 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Top-up Saldo</span>
            </Link>
          </div>
        </div>

        {/* Server Aktif Card */}
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500">Server Aktif</span>
            <div className="p-2 bg-green-100 text-green-600 rounded-xl">
              <Server className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-3xl font-extrabold text-navy-900">{activeOrders.length}</h2>
            <p className="text-[11px] text-neutral-500">Container LXD/Incus beroperasi</p>
          </div>
          <div className="pt-2">
            <Link
              href="/products"
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-navy-900 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <span>Lihat Semua Server</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Expiring Soon Alert Card */}
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500">Segera Berakhir</span>
            <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-3xl font-extrabold text-navy-900">
              {expiringSoonOrders.length}
            </h2>
            <p className="text-[11px] text-amber-700 font-medium">
              {expiringSoonOrders.length > 0
                ? "Perpanjang sebelum data ter-reset"
                : "Tidak ada server mendekati expired"}
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/products"
              className="w-full py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <span>Cek Status Masa Sewa</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Active Containers Overview Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-navy-900">Ringkasan Server Aktif</h2>
          <Link
            href="/products"
            className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
          >
            <span>Semua Produk</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {activeOrders.length === 0 ? (
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
              <span>Lihat Paket Server</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeOrders.map((order) => {
              const isExpiring = order.status === "EXPIRING_SOON";
              return (
                <div
                  key={order.id}
                  className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-blue-400 transition-all space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <span
                        className={cn(
                          "inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider",
                          isExpiring
                            ? "bg-amber-100 text-amber-800"
                            : "bg-green-100 text-green-800"
                        )}
                      >
                        {isExpiring ? "Segera Berakhir" : "Aktif"}
                      </span>
                      <h3 className="font-bold text-navy-900 text-base">
                        {order.plan?.name || "Server LXD"}
                      </h3>
                      <p className="text-xs text-neutral-500 font-mono">{order.subdomain}</p>
                    </div>

                    <Link
                      href={`/products/${order.id}`}
                      className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-navy-900 font-bold text-xs rounded-lg transition-colors"
                    >
                      Lihat Detail
                    </Link>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-neutral-600">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span>
                        Sisa waktu:{" "}
                        <strong className="text-navy-900">
                          {order.expiresAt
                            ? `${Math.max(
                                1,
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
    </div>
  );
}
