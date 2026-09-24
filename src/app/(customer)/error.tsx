"use client";

import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function CustomerError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-8 bg-white border border-slate-200 rounded-2xl">
      <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h2 className="text-xl font-bold text-navy-900 mb-2">Gagal Memuat Data Dashboard</h2>
      <p className="text-xs text-neutral-600 max-w-md mb-6">
        Terjadi kendala koneksi atau sinkronisasi data. Silakan muat ulang komponen ini.
      </p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-navy-800 hover:bg-navy-900 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow transition-all"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Coba Lagi</span>
      </button>
    </div>
  );
}
