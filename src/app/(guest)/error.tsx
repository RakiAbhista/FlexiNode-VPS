"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h2 className="text-2xl font-bold text-navy-900 mb-2">Terjadi Kendala Memuat Halaman</h2>
      <p className="text-sm text-neutral-600 max-w-md mb-6">
        Halaman tidak dapat dibuka saat ini. Silakan coba muat ulang atau periksa kembali koneksi internet kamu.
      </p>
      <button
        onClick={() => reset()}
        className="px-5 py-2.5 bg-navy-800 hover:bg-navy-900 text-white rounded-lg font-semibold text-sm inline-flex items-center gap-2 shadow transition-all"
      >
        <RefreshCw className="w-4 h-4" />
        <span>Coba Lagi</span>
      </button>
    </div>
  );
}
