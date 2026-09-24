"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Wallet,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  PlusCircle,
} from "lucide-react";
import { Plan, User, PaymentMethod } from "@/lib/data/types";
import { dataSource } from "@/lib/data";
import { formatRupiah, cn } from "@/lib/utils";

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planIdFromQuery = searchParams.get("planId") || "plan_1d_starter";

  const [user, setUser] = useState<User | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(planIdFromQuery);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("BALANCE");
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const u = await dataSource.getCurrentUser("CUSTOMER");
      const pList = await dataSource.getPlans();
      setUser(u);
      setPlans(pList);
      setLoading(false);
    }
    loadData();
  }, []);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];
  const balanceInsufficient =
    paymentMethod === "BALANCE" && user && selectedPlan
      ? user.balance < selectedPlan.price
      : false;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user || !selectedPlan) return;

    if (balanceInsufficient) {
      setError("Saldo kamu belum cukup untuk paket ini. Top-up dulu, atau bayar langsung lewat metode lain.");
      return;
    }

    setSubmitting(true);

    try {
      const result = await dataSource.createOrder(user.id, selectedPlan.id, paymentMethod);
      setTimeout(() => {
        router.push(`/products/${result.order.id}`);
      }, 800);
    } catch (err: any) {
      setError(err.message || "Gagal memproses pesanan.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
        <div className="h-44 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-navy-900">Checkout Sewa Server</h1>
        <p className="text-xs text-neutral-600">
          Konfirmasi pesanan dan pilih metode pembayaran di bawah ini.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="md:col-span-2 space-y-6">
          {/* Plan Picker if not selected */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4">
            <h2 className="text-sm font-bold text-navy-900 border-b border-slate-100 pb-3">
              1. Pilihan Paket Server
            </h2>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-navy-900 focus:outline-none"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {formatRupiah(p.price)} ({p.ramMb}MB RAM, {p.cpuAllowance}% CPU)
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method Toggle (PRD Decision #4) */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4">
            <h2 className="text-sm font-bold text-navy-900 border-b border-slate-100 pb-3">
              2. Metode Pembayaran
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option Saldo */}
              <button
                type="button"
                onClick={() => setPaymentMethod("BALANCE")}
                className={cn(
                  "p-4 rounded-xl border text-left flex flex-col justify-between space-y-3 transition-all",
                  paymentMethod === "BALANCE"
                    ? "border-blue-600 bg-blue-100/30 ring-2 ring-blue-600/20"
                    : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-navy-900">Saldo Wallet</span>
                  </div>
                  {paymentMethod === "BALANCE" && (
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  )}
                </div>

                <div className="text-[11px] text-neutral-600">
                  Sisa Saldo:{" "}
                  <strong className="text-navy-900">{user ? formatRupiah(user.balance) : "Rp0"}</strong>
                </div>
              </button>

              {/* Option Gateway */}
              <button
                type="button"
                onClick={() => setPaymentMethod("GATEWAY")}
                className={cn(
                  "p-4 rounded-xl border text-left flex flex-col justify-between space-y-3 transition-all",
                  paymentMethod === "GATEWAY"
                    ? "border-blue-600 bg-blue-100/30 ring-2 ring-blue-600/20"
                    : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-navy-800" />
                    <span className="text-xs font-bold text-navy-900">Payment Gateway</span>
                  </div>
                  {paymentMethod === "GATEWAY" && (
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  )}
                </div>

                <div className="text-[11px] text-neutral-500">QRIS / Virtual Account</div>
              </button>
            </div>

            {/* Error Banner with Immediate Action (Copy Guide §3) */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-3">
                <div className="flex items-start gap-2 text-xs text-red-800">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>

                {balanceInsufficient && (
                  <div className="flex gap-2 pt-1">
                    <Link
                      href={`/topup?redirect=/checkout?planId=${selectedPlanId}`}
                      className="px-3 py-1.5 bg-navy-800 hover:bg-navy-900 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-sm"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Top-up Saldo Sekarang</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod("GATEWAY");
                        setError(null);
                      }}
                      className="px-3 py-1.5 bg-white border border-slate-300 text-navy-900 text-xs font-semibold rounded-lg hover:bg-slate-50"
                    >
                      Bayar Langsung via Gateway
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Order Summary Card */}
        <div className="space-y-4">
          <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-navy-900 border-b border-slate-100 pb-3">
              Ringkasan Pesanan
            </h2>

            <div className="space-y-2 text-xs text-neutral-600">
              <div className="flex justify-between">
                <span>Paket:</span>
                <span className="font-bold text-navy-900">{selectedPlan?.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Durasi:</span>
                <span className="font-bold text-navy-900">{selectedPlan?.durationDays} Hari</span>
              </div>
              <div className="flex justify-between">
                <span>RAM:</span>
                <span className="font-bold text-navy-900">{selectedPlan?.ramMb} MB</span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 flex justify-between items-baseline">
              <span className="text-xs font-bold text-navy-900">Total Bayar:</span>
              <span className="text-xl font-extrabold text-blue-600">
                {selectedPlan ? formatRupiah(selectedPlan.price) : "Rp0"}
              </span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={submitting}
              className="w-full py-3 bg-navy-800 hover:bg-navy-900 text-white rounded-xl font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <span>{submitting ? "Memproses Provisioning..." : "Konfirmasi & Bayar"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 bg-blue-100/40 rounded-xl text-[11px] text-neutral-600 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>Garansi refund jika gagal provisioning server.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
