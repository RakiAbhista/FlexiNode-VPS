"use client";

import React, { useState, useEffect } from "react";
import { Order } from "@/lib/data/types";
import { dataSource } from "@/lib/data";
import { formatRupiah } from "@/lib/utils";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await dataSource.getAllOrders();
      setOrders(data);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Manajemen Order & Siklus Sewa</h1>
        <p className="text-xs text-neutral-600">
          Monitoring siklus pemesanan (Order Baru, Tanggal Kedaluwarsa, Perpanjangan Masa Sewa).
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-navy-900 font-bold">
            <tr>
              <th className="p-4">ID Order</th>
              <th className="p-4">Pelanggan</th>
              <th className="p-4">Paket Matriks</th>
              <th className="p-4">Status</th>
              <th className="p-4">Mulai</th>
              <th className="p-4">Expired On</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-neutral-700">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-slate-50">
                <td className="p-4 font-mono font-bold text-navy-900">{o.id}</td>
                <td className="p-4">{o.user?.name || "Customer"}</td>
                <td className="p-4 font-semibold">{o.plan?.name}</td>
                <td className="p-4 font-bold text-blue-600">{o.status}</td>
                <td className="p-4">{o.startedAt ? new Date(o.startedAt).toLocaleDateString("id-ID") : "-"}</td>
                <td className="p-4 font-bold text-navy-900">
                  {o.expiresAt ? new Date(o.expiresAt).toLocaleDateString("id-ID") : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
