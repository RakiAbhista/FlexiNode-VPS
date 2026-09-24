"use client";

import React, { useState, useEffect } from "react";
import { Sliders, Plus, Edit2, CheckCircle2, Save } from "lucide-react";
import { Plan } from "@/lib/data/types";
import { dataSource } from "@/lib/data";
import { formatRupiah } from "@/lib/utils";

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [minTopup, setMinTopup] = useState<string>("10000");
  const [savedConfig, setSavedConfig] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const pList = await dataSource.getPlans();
      const minVal = await dataSource.getAppConfig("min_topup");
      setPlans(pList);
      setMinTopup(minVal);
      setLoading(false);
    }
    load();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    await dataSource.updateAppConfig("min_topup", minTopup);
    setSavedConfig(true);
    setTimeout(() => setSavedConfig(false), 3000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Manajemen Harga & Paket Matriks</h1>
        <p className="text-xs text-neutral-600">
          Atur kombinasi durasi x resource dan ubah konfigurasi minimum top-up platform secara dinamis.
        </p>
      </div>

      {/* AppConfig Setting: Minimum Top-up */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-sm">
        <h2 className="text-base font-bold text-navy-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-600" /> Konfigurasi Sistem (AppConfig)
        </h2>

        {savedConfig && (
          <div className="p-3 bg-green-50 text-green-800 border border-green-200 rounded-xl text-xs font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span>Minimum top-up berhasil diperbarui!</span>
          </div>
        )}

        <form onSubmit={handleSaveConfig} className="flex flex-col sm:flex-row items-end gap-4 max-w-md">
          <div className="space-y-1 flex-1">
            <label className="text-xs font-semibold text-navy-900">Minimum Top-up Saldo (Rp)</label>
            <input
              type="number"
              value={minTopup}
              onChange={(e) => setMinTopup(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-bold text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-navy-800 hover:bg-navy-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow"
          >
            <Save className="w-4 h-4" />
            <span>Simpan</span>
          </button>
        </form>
      </div>

      {/* Plan Matrix Table */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold text-navy-900">Daftar Paket Aktif</h2>
          <button
            onClick={() => alert("Form Tambah Paket Baru dibuka.")}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Paket Baru</span>
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-navy-900 font-bold">
              <tr>
                <th className="p-4">Nama Paket</th>
                <th className="p-4">Durasi</th>
                <th className="p-4">RAM</th>
                <th className="p-4">CPU</th>
                <th className="p-4">Storage</th>
                <th className="p-4">Harga Final</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-neutral-700">
              {plans.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-navy-900">{p.name}</td>
                  <td className="p-4 font-semibold">{p.durationDays} Hari</td>
                  <td className="p-4">{p.ramMb} MB</td>
                  <td className="p-4">{p.cpuAllowance}%</td>
                  <td className="p-4">{p.storageGb} GB</td>
                  <td className="p-4 font-bold text-blue-600">{formatRupiah(p.price)}</td>
                  <td className="p-4 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                      Aktif
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button className="p-1.5 hover:bg-slate-100 rounded-lg text-neutral-600">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
