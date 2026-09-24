"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Wallet, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { topUpSchema } from "@/lib/validations";
import { dataSource } from "@/lib/data";
import { User } from "@/lib/data/types";
import { formatRupiah, cn } from "@/lib/utils";

export default function TopupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectAfter = searchParams.get("redirect") || "/dashboard";

  const [user, setUser] = useState<User | null>(null);
  const [minTopup, setMinTopup] = useState<number>(10000);
  const [amount, setAmount] = useState<number>(20000);
  const [customInput, setCustomInput] = useState<string>("20000");
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const presets = [10000, 20000, 50000, 100000];

  useEffect(() => {
    async function init() {
      const u = await dataSource.getCurrentUser("CUSTOMER");
      const minVal = await dataSource.getAppConfig("min_topup");
      setUser(u);
      setMinTopup(parseInt(minVal, 10) || 10000);
      setLoading(false);
    }
    init();
  }, []);

  const handlePresetSelect = (val: number) => {
    setAmount(val);
    setCustomInput(val.toString());
    setError(null);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10) || 0;
    setCustomInput(e.target.value);
    setAmount(val);
    setError(null);
  };

  const handleTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (amount < minTopup) {
      setError(`Minimum top-up adalah ${formatRupiah(minTopup)}`);
      return;
    }

    if (!user) return;

    setSubmitting(true);
    try {
      await dataSource.topUpBalance(user.id, amount, "GATEWAY");
      setSubmitting(false);
      setSuccess(true);
      setTimeout(() => {
        router.push(redirectAfter);
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Gagal memproses top-up.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="h-64 bg-slate-200 rounded-2xl animate-pulse"></div>;
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Top-up Saldo Wallet</h1>
        <p className="text-xs text-neutral-600">
          Isi saldo wallet kamu untuk transaksi cepat tanpa biaya admin tambahan per sewa.
        </p>
      </div>

      {success ? (
        <div className="p-8 bg-green-50 border border-green-200 rounded-2xl text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
          <h2 className="text-lg font-bold text-green-900">Top-up Saldo Berhasil!</h2>
          <p className="text-xs text-green-700">
            Saldo sebesar <strong className="text-green-900">{formatRupiah(amount)}</strong> telah ditambahkan ke wallet kamu.
          </p>
        </div>
      ) : (
        <div className="p-8 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6">
          {/* Current Balance Display */}
          <div className="p-4 bg-blue-100/40 border border-blue-200/60 rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] text-neutral-500 font-semibold">Saldo Wallet Saat Ini</span>
              <p className="text-xl font-extrabold text-navy-900">
                {user ? formatRupiah(user.balance) : "Rp0"}
              </p>
            </div>
            <Wallet className="w-6 h-6 text-blue-600" />
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleTopup} className="space-y-6">
            {/* Preset Nominal Grid */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-navy-900">Pilih Nominal Preset</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {presets.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handlePresetSelect(val)}
                    className={cn(
                      "py-2.5 px-3 rounded-xl border text-xs font-bold transition-all",
                      amount === val
                        ? "border-blue-600 bg-blue-100/60 text-blue-700 ring-2 ring-blue-600/20"
                        : "border-slate-200 bg-white text-navy-900 hover:bg-slate-50"
                    )}
                  >
                    {formatRupiah(val)}
                  </button>
                ))}
              </div>
            </div>

            {/* Free Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-navy-900">Atau Input Nominal Bebas (Rp)</label>
              <input
                type="number"
                min={minTopup}
                step={1000}
                value={customInput}
                onChange={handleCustomChange}
                placeholder={`Minimum ${formatRupiah(minTopup)}`}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-bold text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <p className="text-[11px] text-neutral-400">
                Minimum pengisian: <span className="font-semibold text-navy-900">{formatRupiah(minTopup)}</span>
              </p>
            </div>

            {/* Gateway Info */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-neutral-600 flex items-center justify-between">
              <span>Metode Pembayaran:</span>
              <strong className="text-navy-900">QRIS / Instant VA Gateway</strong>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-navy-800 hover:bg-navy-900 text-white rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <span>{submitting ? "Memproses..." : `Top-up Sekarang (${formatRupiah(amount)})`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
