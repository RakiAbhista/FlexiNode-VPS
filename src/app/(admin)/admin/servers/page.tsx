"use client";

import React, { useState, useEffect } from "react";
import { Server, AlertTriangle, RefreshCcw, Power } from "lucide-react";
import { Order } from "@/lib/data/types";
import { dataSource } from "@/lib/data";

export default function AdminServersPage() {
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

  const handleForceReset = (orderId: string) => {
    alert(`Force reset dikirim ke API orchestrator infra untuk container order ${orderId}.`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Manajemen Container & Server Real-time</h1>
        <p className="text-xs text-neutral-600">
          Monitoring operasional teknis real-time lintas pelanggan dan aksi darurat pencegahan abuse.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-navy-900 font-bold">
            <tr>
              <th className="p-4">Container ID</th>
              <th className="p-4">Pemilik (Customer)</th>
              <th className="p-4">Subdomain / IP</th>
              <th className="p-4">Status Operational</th>
              <th className="p-4">CPU Usage</th>
              <th className="p-4">RAM Usage</th>
              <th className="p-4 text-center">Aksi Darurat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-neutral-700">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-slate-50">
                <td className="p-4 font-mono font-bold text-navy-900">{o.containerId || "cnt_lxd_9921"}</td>
                <td className="p-4 font-semibold">{o.user?.name}</td>
                <td className="p-4 font-mono">{o.subdomain}</td>
                <td className="p-4">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                    RUNNING
                  </span>
                </td>
                <td className="p-4 font-mono">18%</td>
                <td className="p-4 font-mono">245MB / {o.plan?.ramMb}MB</td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleForceReset(o.id)}
                      className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg border border-amber-200 text-[11px] font-bold flex items-center gap-1"
                      title="Force Reset Container"
                    >
                      <RefreshCcw className="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </button>

                    <button
                      onClick={() => alert(`Suspend dikirim untuk ${o.id}`)}
                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg border border-red-200 text-[11px] font-bold flex items-center gap-1"
                      title="Suspend Emergency"
                    >
                      <Power className="w-3.5 h-3.5 text-red-600" />
                      <span>Suspend</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
