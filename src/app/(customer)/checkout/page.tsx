"use client";

import React, { useState, useEffect } from "react";
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
  Globe,
  Sparkles,
  Check,
  RefreshCcw,
  GitBranch,
  Zap,
  Lock,
} from "lucide-react";
import { Plan, User, PaymentMethod } from "@/lib/data/types";
import { dataSource } from "@/lib/data";
import { formatRupiah, cn } from "@/lib/utils";
import { AVAILABLE_SETUP_PACKAGES, SETUP_PRESETS } from "@/lib/setup-packages";

const ADDON_PRICE = 3000;
const ADDON_ALLOWED_DAYS = [3, 7];

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planIdFromQuery = searchParams.get("planId") || "";

  const [user, setUser] = useState<User | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(planIdFromQuery);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("BALANCE");
  const [withAddon, setWithAddon] = useState<boolean>(false);
  const [customSubdomain, setCustomSubdomain] = useState<string>("");
  const [selectedPackages, setSelectedPackages] = useState<string[]>(["nodejs", "git_tools"]);
  const [activePreset, setActivePreset] = useState<string>("node_fullstack");
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const [u, pList] = await Promise.all([
        dataSource.getCurrentUser("CUSTOMER"),
        dataSource.getPlans(),
      ]);
      setUser(u);
      setPlans(pList);
      if (!planIdFromQuery && pList.length > 0) {
        setSelectedPlanId(pList[0].id);
      }
      setLoading(false);
    }
    loadData();
  }, [planIdFromQuery]);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];
  const addonEligible = selectedPlan ? ADDON_ALLOWED_DAYS.includes(selectedPlan.durationDays) : false;
  // Reset addon jika plan tidak eligible
  const effectiveAddon = addonEligible && withAddon;
  const totalPrice = (selectedPlan?.price ?? 0) + (effectiveAddon ? ADDON_PRICE : 0);
  const balanceInsufficient =
    paymentMethod === "BALANCE" && user ? user.balance < totalPrice : false;

  const togglePackage = (pkgId: string) => {
    setActivePreset("custom");
    setSelectedPackages((prev) =>
      prev.includes(pkgId) ? prev.filter((id) => id !== pkgId) : [...prev, pkgId]
    );
  };

  const applyPreset = (presetId: string, packages: string[]) => {
    setActivePreset(presetId);
    setSelectedPackages(packages);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!user || !selectedPlan) return;
    if (balanceInsufficient) {
      setError("Saldo kamu belum cukup untuk paket ini. Silakan top-up terlebih dahulu.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await dataSource.createOrder(
        user.id,
        selectedPlan.id,
        paymentMethod,
        effectiveAddon,
        customSubdomain,
        selectedPackages
      );

      // Update saldo di header seketika
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("rupacloud:balance-updated"));
      }

      router.refresh();
      router.push(`/products/${result.order.id}`);
    } catch (err: any) {
      setError(err.message || "Gagal memproses pesanan.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="h-6 w-48 bg-slate-200 rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-4">
            <div className="h-40 bg-slate-200 rounded-2xl" />
            <div className="h-32 bg-slate-200 rounded-2xl" />
            <div className="h-28 bg-slate-200 rounded-2xl" />
          </div>
          <div className="lg:col-span-4 h-64 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Konfigurasi & Sewa Server</h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          Pilih durasi paket, setup software otomatis, dan konfirmasi pembayaran.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Configuration Forms */}
        <div className="lg:col-span-8 space-y-4">
          {/* 1. Plan & Duration Picker */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-navy-900 text-white text-[11px] font-bold flex items-center justify-center">
                  1
                </span>
                <h2 className="text-sm font-bold text-navy-900">Pilihan Durasi Sewa</h2>
              </div>
              <span className="text-[11px] text-neutral-500 font-mono">Micro VPS · 768MB RAM</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {plans.map((p) => {
                const isSelected = selectedPlanId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedPlanId(p.id);
                      if (!ADDON_ALLOWED_DAYS.includes(p.durationDays)) setWithAddon(false);
                    }}
                    className={cn(
                      "p-3.5 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between",
                      isSelected
                        ? "border-blue-600 bg-blue-50/40 ring-2 ring-blue-600/20 shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-xs font-bold text-navy-900">{p.durationDays} Hari</span>
                      {p.durationDays === 3 ? (
                        <span className="text-[9px] px-1.5 py-0.2 bg-blue-100 text-blue-800 font-extrabold rounded-full">
                          POPULER
                        </span>
                      ) : p.durationDays === 7 ? (
                        <span className="text-[9px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 font-extrabold rounded-full">
                          HEMAT
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-3">
                      <div className="text-base font-extrabold text-navy-900">
                        {formatRupiah(p.price)}
                      </div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">
                        {p.ramMb}MB RAM · {p.storageGb}GB NVMe
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Setup Software Otomatis (Tech Stack) */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-navy-900 text-white text-[11px] font-bold flex items-center justify-center">
                  2
                </span>
                <h2 className="text-sm font-bold text-navy-900">Setup Software Otomatis</h2>
              </div>
              <span className="text-[11px] font-medium text-neutral-500">
                {selectedPackages.length === 0
                  ? "Clean Ubuntu (Tanpa Paket)"
                  : `${selectedPackages.length} paket terpilih`}
              </span>
            </div>

            {/* Presets Bar */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[11px] text-neutral-400 mr-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> Preset Cepat:
              </span>
              {SETUP_PRESETS.map((preset) => {
                const isActive = activePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset.id, preset.packages)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer font-medium",
                      isActive
                        ? "bg-slate-900 text-white shadow-xs font-semibold"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    )}
                  >
                    {preset.name}
                  </button>
                );
              })}
            </div>

            {/* Interactive Package Pills */}
            <div className="flex flex-wrap gap-2 pt-1">
              {AVAILABLE_SETUP_PACKAGES.map((pkg) => {
                const isChecked = selectedPackages.includes(pkg.id);
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => togglePackage(pkg.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer flex items-center gap-2",
                      isChecked
                        ? "border-blue-600 bg-blue-50/70 text-blue-900 ring-1 ring-blue-600/30 font-semibold shadow-xs"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <div
                      className={cn(
                        "w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 border transition-colors",
                        isChecked
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "border-slate-300 bg-white"
                      )}
                    >
                      {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                    <span>{pkg.name}</span>
                    {pkg.badge && (
                      <span
                        className={cn(
                          "text-[9px] px-1.5 py-0.2 rounded font-bold uppercase",
                          pkg.badge === "Populer"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-200 text-slate-700"
                        )}
                      >
                        {pkg.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <p className="text-[11px] text-neutral-400 pt-0.5">
              💡 Paket terpilih dipasang otomatis oleh Incus engine saat provisioning. Siap digunakan via Web CLI.
            </p>
          </div>

          {/* 3. Add-on Subdomain + CI/CD */}
          {addonEligible ? (
            <div
              className={cn(
                "p-5 rounded-2xl border transition-all space-y-4",
                withAddon
                  ? "bg-gradient-to-b from-indigo-50/50 to-white border-indigo-200 shadow-xs ring-1 ring-indigo-500/20"
                  : "bg-white border-slate-200 shadow-xs"
              )}
            >
              {/* Header & Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-navy-900 text-white text-[11px] font-bold flex items-center justify-center">
                      3
                    </span>
                    <h2 className="text-sm font-bold text-navy-900 flex items-center gap-2">
                      Add-on Subdomain & CI/CD GitHub
                      <span className="text-[10px] px-2 py-0.5 bg-indigo-100 text-indigo-800 font-extrabold rounded-full tracking-wide">
                        DIREKOMENDASIKAN
                      </span>
                    </h2>
                  </div>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Nikmati kemudahan deploy ala <strong>Vercel & Railway</strong>, tetapi dengan kebebasan penuh <strong>Root VPS</strong>.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setWithAddon(!withAddon)}
                  className={cn(
                    "px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 border shrink-0",
                    withAddon
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                  )}
                >
                  {withAddon ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Aktif (+{formatRupiah(ADDON_PRICE)})</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>+ Pasang Add-on (+{formatRupiah(ADDON_PRICE)})</span>
                    </>
                  )}
                </button>
              </div>

              {/* 3 Keunggulan Utama (Value Highlights) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700 shrink-0">
                    <Globe className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-navy-900">Domain Publik & SSL</p>
                    <p className="text-[11px] text-neutral-500 leading-snug">
                      Gratis domain publik <code>*.rupacloud.id</code> dengan HTTPS resmi tanpa perlu beli domain luar.
                    </p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                    <GitBranch className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-navy-900">Push-to-Deploy CI/CD</p>
                    <p className="text-[11px] text-neutral-500 leading-snug">
                      Cukup <code>git push</code> dari VS Code, VPS otomatis pull & rebuild tanpa buka terminal SSH.
                    </p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700 shrink-0">
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-navy-900">Siap Pamer Portofolio</p>
                    <p className="text-[11px] text-neutral-500 leading-snug">
                      Link publik instan untuk presentasi tugas kuliah, seminar, atau demo ke klien freelance.
                    </p>
                  </div>
                </div>
              </div>

              {/* Subdomain Customization (When Active) */}
              {withAddon && (
                <div className="pt-3 border-t border-indigo-100 space-y-2 bg-indigo-50/40 p-3.5 rounded-xl border border-indigo-200/60">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <label className="text-xs font-bold text-navy-900 flex items-center gap-1.5">
                      <span>Kustomisasi Nama Subdomain</span>
                      <span className="text-[10px] text-neutral-400 font-normal">(Opsional)</span>
                    </label>
                    <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                      <Lock className="w-3 h-3 text-emerald-600" />
                      <span>SSL HTTPS Terpasang Otomatis</span>
                    </div>
                  </div>

                  <div className="flex items-center max-w-md shadow-xs">
                    <input
                      type="text"
                      placeholder="proyek-kamu"
                      value={customSubdomain}
                      onChange={(e) =>
                        setCustomSubdomain(
                          e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
                        )
                      }
                      maxLength={30}
                      className="flex-1 px-3 py-2 bg-white border border-indigo-200 rounded-l-xl text-xs font-mono text-navy-900 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <span className="px-3 py-2 bg-indigo-100/70 border border-l-0 border-indigo-200 rounded-r-xl text-xs font-mono font-bold text-indigo-900 select-none">
                      .rupacloud.id
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-indigo-800/80 pt-0.5">
                    <span>Preview URL:</span>
                    <code className="px-1.5 py-0.5 bg-white border border-indigo-200 rounded text-[11px] font-mono text-indigo-900 font-semibold">
                      https://{customSubdomain || "proyek-kamu"}.rupacloud.id
                    </code>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-slate-50 border border-slate-200/80 border-dashed rounded-2xl flex items-center justify-between text-xs text-neutral-500">
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 text-[11px] font-bold flex items-center justify-center shrink-0">
                  3
                </span>
                <span>
                  Add-on Subdomain & CI/CD otomatis tersedia khusus untuk paket <strong>3 Hari</strong> dan <strong>7 Hari</strong>.
                </span>
              </div>
            </div>
          )}

          {/* 4. Metode Pembayaran */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-navy-900 text-white text-[11px] font-bold flex items-center justify-center">
                {addonEligible ? "4" : "3"}
              </span>
              <h2 className="text-sm font-bold text-navy-900">Metode Pembayaran</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Saldo Wallet */}
              <button
                type="button"
                onClick={() => setPaymentMethod("BALANCE")}
                className={cn(
                  "p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer relative",
                  paymentMethod === "BALANCE"
                    ? "border-blue-600 bg-blue-50/40 ring-2 ring-blue-600/20 shadow-xs"
                    : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600 shrink-0">
                  <Wallet className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-navy-900">Saldo RuPa Wallet</span>
                    {paymentMethod === "BALANCE" && (
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <p className="text-xs font-extrabold text-navy-900 mt-0.5">
                    {formatRupiah(user?.balance ?? 0)}
                  </p>
                  {user && user.balance < totalPrice ? (
                    <span className="text-[10px] text-amber-600 font-semibold block mt-0.5">
                      Saldo belum cukup
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                      Saldo mencukupi
                    </span>
                  )}
                </div>
              </button>

              {/* Payment Gateway */}
              <button
                type="button"
                onClick={() => setPaymentMethod("GATEWAY")}
                className={cn(
                  "p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer relative",
                  paymentMethod === "GATEWAY"
                    ? "border-blue-600 bg-blue-50/40 ring-2 ring-blue-600/20 shadow-xs"
                    : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <div className="p-2 rounded-lg bg-slate-100 text-slate-700 shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-navy-900">Payment Gateway</span>
                    {paymentMethod === "GATEWAY" && (
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    QRIS, Virtual Account, & E-Wallet
                  </p>
                  <span className="text-[10px] text-blue-600 font-semibold block mt-0.5">
                    Auto-verifikasi instan
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Summary & Checkout Action */}
        <div className="lg:col-span-4 sticky top-6 space-y-4">
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-navy-900 border-b border-slate-100 pb-2.5">
              Ringkasan Pesanan
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Paket:</span>
                <span className="font-bold text-navy-900">{selectedPlan?.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Durasi:</span>
                <span className="font-bold text-navy-900">{selectedPlan?.durationDays} Hari</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Spesifikasi:</span>
                <span className="font-mono text-[11px] text-neutral-600">
                  {selectedPlan?.ramMb}MB · {selectedPlan?.storageGb}GB
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Setup Stack:</span>
                <span className="font-semibold text-navy-900 text-right truncate max-w-[150px]">
                  {selectedPackages.length === 0
                    ? "Clean Ubuntu"
                    : `${selectedPackages.length} Paket Dipilih`}
                </span>
              </div>
              {effectiveAddon && (
                <div className="flex justify-between items-center text-indigo-700">
                  <span className="flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5" /> Add-on CI/CD:
                  </span>
                  <span className="font-bold">+{formatRupiah(ADDON_PRICE)}</span>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-3 flex justify-between items-baseline">
              <span className="text-xs font-bold text-navy-900">Total Tagihan:</span>
              <span className="text-xl font-extrabold text-blue-600">
                {formatRupiah(totalPrice)}
              </span>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2 text-xs text-red-800">
                <div className="flex items-start gap-1.5">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
                {balanceInsufficient && (
                  <Link
                    href={`/topup?redirect=/checkout?planId=${selectedPlanId}`}
                    className="px-3 py-1.5 bg-navy-800 hover:bg-navy-900 text-white text-[11px] font-bold rounded-lg inline-flex items-center gap-1 shadow-xs"
                  >
                    <PlusCircle className="w-3 h-3" />
                    <span>Top-up Saldo</span>
                  </Link>
                )}
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={submitting}
              className="w-full py-3 bg-navy-800 hover:bg-navy-900 text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RefreshCcw className="w-4 h-4 animate-spin" />
                  <span>Membuat Server VPS...</span>
                </>
              ) : (
                <>
                  <span>Bayar & Buat Server Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl text-[11px] text-blue-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Garansi refund otomatis jika pembuatan container gagal.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
