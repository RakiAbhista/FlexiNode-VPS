"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, Cpu, HardDrive, Zap, CheckCircle2, ArrowRight, Server } from "lucide-react";
import { Plan, Role } from "@/lib/data/types";
import { dataSource } from "@/lib/data";
import { formatRupiah, cn } from "@/lib/utils";
import { ScrollReveal, ScrollRevealItem } from "@/components/ui/scroll-reveal";
import { useLanguage } from "@/lib/i18n/language-context";

export default function ProductCatalogPage() {
  const { t } = useLanguage();
  const [selectedDuration, setSelectedDuration] = useState<number>(1);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<Role>("GUEST");

  useEffect(() => {
    async function loadData() {
      const data = await dataSource.getPlans();
      setPlans(data);
      setLoading(false);

      const activeRole = (document.cookie
        .split("; ")
        .find((row) => row.startsWith("rc_mock_role="))
        ?.split("=")[1] as Role) || "GUEST";
      setRole(activeRole);
    }
    loadData();
  }, []);

  const filteredPlans = plans.filter((p) => p.durationDays === selectedDuration);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <ScrollReveal direction="up" distance={25} className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-600 text-xs font-semibold">
          <Server className="w-3.5 h-3.5" />
          <span>{t("Katalog Matriks Paket VPS", "VPS Package Matrix Catalog")}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-navy-900">
          {t("Pilih Durasi & Spesifikasi Server", "Choose Duration & Server Specs")}
        </h1>
        <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
          {t(
            "Kombinasikan durasi sewa eceran dengan spesifikasi resource yang kamu butuhkan. Semua harga ditampilkan transparan per hari.",
            "Combine flexible rental durations with the resource specs you need. All prices displayed transparently per day."
          )}
        </p>
      </ScrollReveal>

      {/* Matriks Step 1: Filter Toggle Durasi */}
      <ScrollReveal delay={0.15} direction="up" distance={20} className="space-y-3 text-center">
        <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
          {t("Langkah 1: Pilih Durasi Sewa", "Step 1: Choose Rental Duration")}
        </p>
        <div className="inline-flex p-1.5 bg-slate-100 rounded-2xl border border-slate-200 gap-1.5">
          {[
            { days: 1, label: t("1 Hari", "1 Day") },
            { days: 3, label: t("3 Hari", "3 Days") },
            { days: 7, label: t("1 Minggu (7 Hari)", "1 Week (7 Days)") },
          ].map((dur) => {
            const isSelected = selectedDuration === dur.days;
            return (
              <button
                key={dur.days}
                onClick={() => setSelectedDuration(dur.days)}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2",
                  isSelected
                    ? "bg-navy-800 text-white shadow-md scale-[1.02]"
                    : "text-navy-900 hover:bg-slate-200/70"
                )}
              >
                <Clock className="w-4 h-4" />
                <span>{dur.label}</span>
              </button>
            );
          })}
        </div>
      </ScrollReveal>

      {/* Matriks Step 2: Grid Choice of Resource Sizes */}
      <div className="space-y-4">
        <ScrollReveal delay={0.2} direction="up" distance={15} className="text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            {t(`Langkah 2: Pilih Ukuran Resource (${selectedDuration} Hari)`, `Step 2: Choose Resource Size (${selectedDuration} Days)`)}
          </p>
        </ScrollReveal>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 bg-slate-100 rounded-2xl"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {filteredPlans.map((plan, idx) => {
              const dailyEquivalent = Math.round(plan.price / plan.durationDays);
              const checkoutUrl = role === "GUEST" ? `/login?redirect=/checkout?planId=${plan.id}` : `/checkout?planId=${plan.id}`;

              return (
                <ScrollRevealItem key={plan.id} delay={idx * 0.15}>
                  <div
                    className={cn(
                      "p-7 bg-white rounded-2xl border transition-all duration-300 flex flex-col justify-between relative h-full",
                      plan.tier === "Basic"
                        ? "border-blue-600 shadow-xl ring-2 ring-blue-600/20 animate-float"
                        : "border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-md hover:-translate-y-1"
                    )}
                  >
                    {plan.tier === "Basic" && (
                      <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[11px] font-bold px-3.5 py-0.5 rounded-full uppercase tracking-wider shadow">
                        Rekomendasi
                      </span>
                    )}

                    <div className="space-y-6">
                      <div className="border-b border-slate-100 pb-4">
                        <span className="text-xs font-semibold text-blue-600 bg-blue-100/60 px-2.5 py-1 rounded-md">
                          Tier {plan.tier}
                        </span>
                        <h3 className="text-xl font-extrabold text-navy-900 mt-2">{plan.name}</h3>
                      </div>

                      {/* Pricing Display */}
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-extrabold text-navy-900">
                            {formatRupiah(plan.price)}
                          </span>
                          <span className="text-xs text-neutral-500 font-medium">
                            / {plan.durationDays} hari
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500">
                          Setara <span className="font-semibold text-navy-900">{formatRupiah(dailyEquivalent)}</span> / hari
                        </p>
                      </div>

                      {/* Specs List */}
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between text-xs text-neutral-700 py-1.5 border-b border-slate-100">
                          <span className="flex items-center gap-2 text-neutral-500">
                            <Cpu className="w-4 h-4 text-blue-600" /> RAM / Memory
                          </span>
                          <span className="font-bold text-navy-900">{plan.ramMb} MB</span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-neutral-700 py-1.5 border-b border-slate-100">
                          <span className="flex items-center gap-2 text-neutral-500">
                            <Zap className="w-4 h-4 text-blue-600" /> CPU Core
                          </span>
                          <span className="font-bold text-navy-900">{plan.cpuAllowance}% CPU</span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-neutral-700 py-1.5 border-b border-slate-100">
                          <span className="flex items-center gap-2 text-neutral-500">
                            <HardDrive className="w-4 h-4 text-blue-600" /> Disk Storage
                          </span>
                          <span className="font-bold text-navy-900">{plan.storageGb} GB NVMe</span>
                        </div>
                      </div>

                      {/* Features checklist */}
                      <ul className="space-y-2 text-xs text-neutral-600 pt-1">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> Web CLI Browser Direct Access
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> Subdomain & Public IPv4
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> Integration GitHub Auto-deploy
                        </li>
                      </ul>
                    </div>

                    <div className="pt-8">
                      <Link
                        href={checkoutUrl}
                        className={cn(
                          "w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm hover:-translate-y-0.5",
                          plan.tier === "Basic"
                            ? "bg-navy-800 hover:bg-navy-900 text-white shadow-md hover:shadow-lg"
                            : "bg-blue-100 hover:bg-blue-100/80 text-navy-900"
                        )}
                      >
                        <span>Sewa Sekarang</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </ScrollRevealItem>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
