"use client";

import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center space-y-4">
      <AlertCircle className="w-10 h-10 text-red-600 mx-auto" />
      <h2 className="text-xl font-bold text-navy-900">Gagal Memuat Data Admin</h2>
      <p className="text-xs text-neutral-600">Terjadi kesalahan teknis saat mengambil data manajemen.</p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-navy-800 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2"
      >
        <RefreshCw className="w-4 h-4" />
        <span>Coba Muat Ulang</span>
      </button>
    </div>
  );
}
