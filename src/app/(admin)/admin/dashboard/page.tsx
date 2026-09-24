"use client";

import React, { useState, useEffect } from "react";
import { Users, DollarSign, Server, AlertTriangle, TrendingUp } from "lucide-react";
import { dataSource } from "@/lib/data";
import { formatRupiah } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { ScrollReveal, ScrollRevealItem } from "@/components/ui/scroll-reveal";

export default function AdminDashboardPage() {
  const [totalCustomers, setTotalCustomers] = useState<number>(0);
  const [totalOrders, setTotalOrders] = useState<number>(0);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const capacityRatio = 78; // 78% server nodes used (triggering alert at 75%+)

  const revenueData = [
    { day: "Senin", revenue: 120000 },
    { day: "Selasa", revenue: 210000 },
    { day: "Rabu", revenue: 185000 },
    { day: "Kamis", revenue: 340000 },
    { day: "Jumat", revenue: 290000 },
    { day: "Sabtu", revenue: 450000 },
    { day: "Minggu", revenue: 520000 },
  ];

  useEffect(() => {
    async function loadAdminStats() {
      const users = await dataSource.getAllUsers();
      const orders = await dataSource.getAllOrders();
      const trxs = await dataSource.getAllTransactions();

      setTotalCustomers(users.filter((u) => u.role === "CUSTOMER").length);
      setTotalOrders(orders.length);

      const rev = trxs
        .filter((t) => t.status === "SUCCESS")
        .reduce((sum, t) => sum + t.amount, 0);
      setTotalRevenue(rev);

      setLoading(false);
    }
    loadAdminStats();
  }, []);

  if (loading) {
    return <div className="h-64 bg-slate-200 rounded-2xl animate-pulse"></div>;
  }

  return (
    <div className="space-y-8">
      <ScrollReveal direction="up" distance={25} className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-extrabold text-navy-900">Dashboard Operasional Admin</h1>
        <p className="text-xs text-neutral-600">
          Ringkasan pendapatan, kapasitas server fisik node LXD, dan jumlah pelanggan aktif.
        </p>
      </ScrollReveal>

      {/* Capacity Alert Banner if ratio > 75% */}
      {capacityRatio >= 75 && (
        <ScrollReveal delay={0.1} direction="up" distance={15}>
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-center gap-3 text-amber-900 text-xs shadow-xs">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <strong className="font-bold">Peringatan Kapasitas Node Server ({capacityRatio}% Terpakai)!</strong>
              <p className="text-[11px] text-amber-800">
                Kapasitas container mendekati penuh. Pertimbangkan menambah host LXD/Incus baru dengan tim infra.
              </p>
            </div>
          </div>
        </ScrollReveal>
      )}

      {/* Stat Cards (2 columns on mobile, 4 columns on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <ScrollRevealItem delay={0.15}>
          <div className="p-4 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-2 hover:border-blue-300 hover:shadow-md transition-all">
            <div className="flex justify-between items-center text-neutral-500">
              <span className="text-[11px] sm:text-xs font-semibold">Total Pelanggan</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-navy-900">{totalCustomers}</p>
            <span className="text-[10px] sm:text-[11px] text-green-600 font-semibold">+12% minggu ini</span>
          </div>
        </ScrollRevealItem>

        <ScrollRevealItem delay={0.25}>
          <div className="p-4 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-2 hover:border-blue-300 hover:shadow-md transition-all">
            <div className="flex justify-between items-center text-neutral-500">
              <span className="text-[11px] sm:text-xs font-semibold">Pendapatan Total</span>
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-navy-900">{formatRupiah(totalRevenue)}</p>
            <span className="text-[10px] sm:text-[11px] text-neutral-400">Ledger transaksi lunas</span>
          </div>
        </ScrollRevealItem>

        <ScrollRevealItem delay={0.35}>
          <div className="p-4 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-2 hover:border-blue-300 hover:shadow-md transition-all">
            <div className="flex justify-between items-center text-neutral-500">
              <span className="text-[11px] sm:text-xs font-semibold">Total Container Order</span>
              <Server className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-navy-900">{totalOrders}</p>
            <span className="text-[10px] sm:text-[11px] text-neutral-400">Order harian & mingguan</span>
          </div>
        </ScrollRevealItem>

        <ScrollRevealItem delay={0.45}>
          <div className="p-4 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-2 hover:border-blue-300 hover:shadow-md transition-all">
            <div className="flex justify-between items-center text-neutral-500">
              <span className="text-[11px] sm:text-xs font-semibold">Node Capacity Ratio</span>
              <TrendingUp className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-navy-900">{capacityRatio}%</p>
            <span className="text-[10px] sm:text-[11px] text-amber-600 font-semibold">Mendekati limit</span>
          </div>
        </ScrollRevealItem>
      </div>

      {/* Revenue Chart */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
        <h2 className="text-base font-bold text-navy-900">Grafik Pendapatan Mingguan (Rp)</h2>
        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip formatter={(value) => formatRupiah(Number(value))} />
              <Bar dataKey="revenue" fill="#052659" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
