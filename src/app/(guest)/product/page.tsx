"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, Cpu, HardDrive, Zap, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { Plan, Role } from "@/lib/data/types";
import { dataSource } from "@/lib/data";
import { formatRupiah, cn } from "@/lib/utils";
import { ScrollReveal, ScrollRevealItem } from "@/components/ui/scroll-reveal";
import { SparklesText } from "@/components/ui/sparkles-text";
import { useLanguage } from "@/lib/i18n/language-context";

export default function ProductCatalogPage() {
  const { t } = useLanguage();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<Role>("GUEST");

  useEffect(() => {
    async function loadData() {
      const data = await dataSource.getPlans();
      // Urutkan berdasarkan durasi (1 hari, 3 hari, 7 hari)
      const sorted = [...data].sort((a, b) => a.durationDays - b.durationDays);
      setPlans(sorted);
      setLoading(false);

      try {
        const profileRes = await fetch("/api/user/profile");
        const profileData = await profileRes.json();
        if (profileData.success && profileData.user) {
          setRole(profileData.user.role || "CUSTOMER");
        } else {
          setRole("GUEST");
        }
      } catch {
        setRole("GUEST");
      }
    }
    loadData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <ScrollReveal direction="up" distance={25} className="text-center space-y-4 max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-navy-900">
          {t("Pilihan Paket Micro VPS RuPa Cloud", "RuPa Cloud Micro VPS Plans")}
        </h1>
        <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
          {t(
            "Layanan VPS mikro harian dengan spesifikasi optimal, isolasi container aman, dan harga transparan sesuai durasi kebutuhan kamu.",
            "Daily micro VPS services with optimal specs, secure container isolation, and transparent pricing tailored to your duration needs."
          )}
        </p>
      </ScrollReveal>

      {/* Grid of 3 Plans */}
      <div className="space-y-4">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 bg-slate-100 rounded-3xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            {plans.map((plan, idx) => {
              const isFeatured = plan.durationDays === 3;
              const dailyEquivalent = Math.round(plan.price / plan.durationDays);
              const checkoutUrl =
                role === "GUEST"
                  ? `/login?redirect=/checkout?planId=${plan.id}`
                  : `/checkout?planId=${plan.id}`;

              return (
                <ScrollRevealItem key={plan.id} delay={idx * 0.15}>
                  <div
                    className={cn(
                      "p-8 bg-white rounded-3xl border transition-all duration-300 flex flex-col justify-between relative h-full",
                      isFeatured
                        ? "border-blue-600 shadow-xl ring-4 ring-blue-600/10 scale-105 z-10"
                        : "border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-md hover:-translate-y-1"
                    )}
                  >
                    {isFeatured && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                        <span className="bg-navy-800 text-white text-[11px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg inline-flex items-center justify-center">
                          <SparklesText text={t("Paling Populer", "Most Popular")} />
                        </span>
                      </div>
                    )}

                    <div className="space-y-6">
                      <div className="border-b border-slate-100 pb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-blue-600 uppercase tracking-widest">
                            {plan.tier} VPS
                          </span>
                          {plan.durationDays >= 3 && (
                            <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">
                              + CI/CD Ready
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl font-extrabold text-navy-900 mt-2">{plan.name}</h3>
                      </div>

                      {/* Pricing Display */}
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-extrabold text-navy-900">
                            {formatRupiah(plan.price)}
                          </span>
                          <span className="text-xs text-neutral-500 font-medium">
                            / {plan.durationDays} {t("hari", "days")}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500">
                          {t("Setara", "Equivalent to")}{" "}
                          <span className="font-semibold text-navy-900">
                            {formatRupiah(dailyEquivalent)}
                          </span>{" "}
                          / {t("hari", "day")}
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

                        <div className="flex items-center justify-between text-xs text-neutral-700 py-1.5 border-b border-slate-100">
                          <span className="flex items-center gap-2 text-neutral-500">
                            <Clock className="w-4 h-4 text-blue-600" /> {t("Masa Aktif", "Duration")}
                          </span>
                          <span className="font-bold text-navy-900">
                            {plan.durationDays} {t("Hari", "Days")}
                          </span>
                        </div>
                      </div>

                      {/* Features checklist */}
                      <ul className="space-y-2 text-xs text-neutral-600 pt-1">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                          <span>{t("Akses Web CLI Browser Direct", "Web CLI Browser Direct Access")}</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                          <span>{t("Dedicated IP Container", "Dedicated Container IP")}</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                          <span>
                            {plan.durationDays >= 3
                              ? t("Support Add-on Subdomain & GitHub CI/CD", "Supports Subdomain & GitHub CI/CD Add-on")
                              : t("Siap digunakan dalam hitungan detik", "Ready to use in seconds")}
                          </span>
                        </li>
                      </ul>
                    </div>

                    <div className="pt-8 mt-auto">
                      <Link
                        href={checkoutUrl}
                        className={cn(
                          "w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm hover:-translate-y-0.5",
                          isFeatured
                            ? "bg-navy-800 hover:bg-navy-900 text-white shadow-md hover:shadow-lg"
                            : "bg-blue-50 hover:bg-blue-100 text-navy-900"
                        )}
                      >
                        <span>{t("Sewa Sekarang", "Rent Now")}</span>
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
