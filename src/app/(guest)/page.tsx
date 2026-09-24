"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Clock,
  Zap,
  Terminal,
  CheckCircle2,
  ArrowRight,
  GraduationCap,
  Bot,
  Trophy,
  ShieldCheck,
  Server,
} from "lucide-react";
import { GithubIcon } from "@/components/shared/github-icon";
import { dataSource } from "@/lib/data";
import { Plan } from "@/lib/data/types";
import { formatRupiah } from "@/lib/utils";
import { SplitText } from "@/components/ui/split-text";
import { ScrollReveal, ScrollRevealItem } from "@/components/ui/scroll-reveal";
import { HeroTerminalMockup } from "@/components/ui/hero-terminal-mockup";
import { FaqAccordion } from "@/components/ui/faq-accordion";
import { useLanguage } from "@/lib/i18n/language-context";

export default function LandingPage() {
  const { lang, t } = useLanguage();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlans() {
      const data = await dataSource.getPlans();
      setPlans(data.filter((p) => p.tier === "Starter"));
      setLoading(false);
    }
    fetchPlans();
  }, []);

  const personas = [
    {
      icon: GraduationCap,
      title: t("Mahasiswa & Pelajar", "Students & Learners"),
      desc: t(
        "Uji coba tugas akhir, project kuliah, dan praktikum tanpa harus bayar berlangganan bulanan.",
        "Test final projects, college assignments, and labs without paying monthly subscriptions."
      ),
    },
    {
      icon: Bot,
      title: t("Bot Developer", "Bot Developers"),
      desc: t(
        "Jalankan bot Discord atau Telegram harian untuk event khusus atau uji coba kode bot baru.",
        "Run daily Discord or Telegram bots for special events or to test new bot code."
      ),
    },
    {
      icon: Trophy,
      title: t("Peserta Hackathon & CTF", "Hackathon & CTF Competitors"),
      desc: t(
        "Buka environment sandbox cepat saat perlombaan untuk demo aplikasi atau eksplorasi tantangan.",
        "Spin up fast sandbox environments during competitions for app demos or challenge solutions."
      ),
    },
    {
      icon: Server,
      title: t("Pengembang Pemula", "Aspiring Developers"),
      desc: t(
        "Lingkungan belajar Linux dan cloud container terisolasi yang aman dari risiko error fisik.",
        "An isolated Linux and cloud container learning environment safe from physical device risks."
      ),
    },
  ];

  const faqs = [
    {
      q: t(
        "Bagaimana cara kerja sewa VPS harian di RuPa Cloud?",
        "How does daily VPS rental work at RuPa Cloud?"
      ),
      a: t(
        "Kamu bisa memilih paket server dan durasi sewa (1 hari, 3 hari, atau 1 minggu). Server akan aktif seketika dan otomatis di-decommission saat masa sewa berakhir.",
        "You can choose a server package and rental duration (1 day, 3 days, or 1 week). The server activates instantly and automatically decommissions when expired."
      ),
    },
    {
      q: t(
        "Apakah saya perlu kartu kredit untuk mendaftar?",
        "Do I need a credit card to register?"
      ),
      a: t(
        "Tidak perlu sama sekali. Kamu bisa membayar sewa menggunakan saldo wallet RuPa Cloud atau bayar langsung via QRIS dan Virtual Account.",
        "Not at all. You can pay using your RuPa Cloud wallet balance or directly via QRIS and Virtual Accounts."
      ),
    },
    {
      q: t(
        "Apa yang terjadi jika masa sewa server saya habis?",
        "What happens when my server rental period ends?"
      ),
      a: t(
        "Kami akan mengirim notifikasi mendekati expired. Jika tidak diperpanjang, container akan direset untuk menjaga keamanan dan resource server.",
        "We send notifications near expiration. If not extended, the container will be reset to ensure security and resource efficiency."
      ),
    },
  ];

  const heroTitle = t("Sewa VPS Mikro Harian. Bayar Sesuai Kebutuhanmu.", "Daily Micro VPS Rental. Pay Only What You Need.");

  return (
    <div className="space-y-24 pb-16 overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center pt-8 pb-16 lg:py-24 bg-gradient-to-b from-blue-50/60 via-white to-white bg-tech-grid overflow-hidden">
        {/* Soft Ambient Background Glow Orbs */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-blue-300/25 via-cyan-200/20 to-indigo-300/20 rounded-full blur-3xl -z-10 pointer-events-none" />

        {/* Bottom Fade Mask to Section 2 */}
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none z-0" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 lg:space-y-10 w-full relative z-10">
          {/* Animated Hero Title */}
          <SplitText
            key={lang}
            text={heroTitle}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-navy-900 tracking-tight leading-[1.12] max-w-5xl mx-auto block"
            delay={60}
          />

          {/* Subtitle */}
          <ScrollReveal delay={0.3} direction="up" distance={20}>
            <p className="text-lg sm:text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed font-normal">
              {t(
                "Tidak ada komitmen bulanan. Bebas sewa server LXD/Incus cepat mulai 1 hari untuk belajar, tugas kuliah, bot, dan testing project.",
                "No monthly commitments. Rent fast LXD/Incus containers starting from 1 day for learning, coursework, bots, and project testing."
              )}
            </p>
          </ScrollReveal>

          {/* CTA Buttons */}
          <ScrollReveal delay={0.4} direction="up" distance={20}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-1">
              <Link
                href="/register"
                className="w-full sm:w-auto px-9 py-4 bg-navy-800 hover:bg-navy-900 text-white rounded-xl font-bold text-base sm:text-lg shadow-xl shadow-navy-900/15 hover:shadow-2xl transition-all flex items-center justify-center gap-2.5 hover:-translate-y-0.5"
              >
                <span>{t("Daftar Gratis", "Register Free")}</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/product"
                className="w-full sm:w-auto px-9 py-4 bg-white border border-slate-300 hover:bg-slate-50 text-navy-900 rounded-xl font-semibold text-base sm:text-lg transition-colors flex items-center justify-center hover:-translate-y-0.5 shadow-sm"
              >
                {t("Lihat Paket & Harga", "View Plans & Pricing")}
              </Link>
            </div>
          </ScrollReveal>

          {/* Glassmorphism Live Terminal & Container Mockup */}
          <ScrollReveal delay={0.5} direction="up" distance={30}>
            <HeroTerminalMockup />
          </ScrollReveal>

          {/* Micro badges */}
          <ScrollReveal delay={0.6} direction="up" distance={15}>
            <div className="pt-4 flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs sm:text-sm text-neutral-500 font-medium">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />{" "}
                {t("Mulai Rp3.500 / hari", "Starting from Rp3,500 / day")}
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />{" "}
                {t("Auto-deploy dari GitHub", "Auto-deploy from GitHub")}
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />{" "}
                {t("Akses Web CLI Browser", "Browser Web CLI Access")}
              </span>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Keunggulan Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal direction="up" distance={25}>
          <div className="text-center space-y-3 mb-12">
            <h2 className="text-3xl font-bold text-navy-900">
              {t("Mengapa Memilih RuPa Cloud?", "Why Choose RuPa Cloud?")}
            </h2>
            <p className="text-neutral-600 max-w-xl mx-auto text-sm sm:text-base">
              {t(
                "Dirancang khusus untuk ekosistem mahasiswa dan developer muda yang butuh fleksibilitas dan kecepatan.",
                "Designed specifically for students and young developers who need flexibility and speed."
              )}
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ScrollRevealItem delay={0.1} className="h-full">
            <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:border-blue-400 hover:shadow-md hover:-translate-y-1.5 transition-all duration-300 space-y-3 h-full">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-navy-900">
                {t("Sewa Durasi Pendek", "Short-Term Rental")}
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                {t(
                  "Pilih masa sewa 1 hari, 3 hari, atau 1 minggu. Hemat biaya tanpa perlu membayar sewa sebulan penuh.",
                  "Choose a rental period of 1 day, 3 days, or 1 week. Save money without paying for a full month."
                )}
              </p>
            </div>
          </ScrollRevealItem>

          <ScrollRevealItem delay={0.2} className="h-full">
            <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:border-blue-400 hover:shadow-md hover:-translate-y-1.5 transition-all duration-300 space-y-3 h-full">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-navy-900">
                {t("Provisioning Cepat", "Instant Provisioning")}
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                {t(
                  "Server container LXD/Incus siap digunakan dalam hitungan detik setelah transaksi terkonfirmasi.",
                  "LXD/Incus container servers are ready to use in seconds after transaction confirmation."
                )}
              </p>
            </div>
          </ScrollRevealItem>

          <ScrollRevealItem delay={0.3} className="h-full">
            <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:border-blue-400 hover:shadow-md hover:-translate-y-1.5 transition-all duration-300 space-y-3 h-full">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                <GithubIcon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-navy-900">
                {t("Auto-deploy GitHub", "GitHub Auto-deploy")}
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                {t(
                  "Hubungkan repositori GitHub kamu untuk melakukan deployment aplikasi secara otomatis dan praktis.",
                  "Connect your GitHub repository to automatically and conveniently deploy your applications."
                )}
              </p>
            </div>
          </ScrollRevealItem>

          <ScrollRevealItem delay={0.4} className="h-full">
            <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:border-blue-400 hover:shadow-md hover:-translate-y-1.5 transition-all duration-300 space-y-3 h-full">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                <Terminal className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-navy-900">
                {t("Akses Web CLI", "Web CLI Access")}
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                {t(
                  "Kelola server langsung dari browser tanpa perlu install aplikasi terminal atau SSH di perangkat kamu.",
                  "Manage your server directly from the browser without installing terminal tools or SSH clients."
                )}
              </p>
            </div>
          </ScrollRevealItem>
        </div>
      </section>

      {/* Preview Tier Harga Section */}
      <section className="bg-slate-50 py-16 border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <ScrollReveal direction="up" distance={25}>
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-bold text-navy-900">
                {t("Pilihan Paket Terpopuler", "Popular Plan Choices")}
              </h2>
              <p className="text-neutral-600 max-w-xl mx-auto text-sm sm:text-base">
                {t(
                  "Transparan tanpa biaya tersembunyi. Bebas sesuaikan durasi sewa di halaman katalog.",
                  "Transparent with no hidden fees. Freely customize rental duration in the catalog."
                )}
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {loading
              ? [1, 2, 3].map((i) => (
                  <div key={i} className="h-80 bg-slate-200/60 animate-pulse rounded-2xl" />
                ))
              : plans.slice(0, 3).map((plan, idx) => (
                  <ScrollRevealItem key={plan.id} delay={idx * 0.15}>
                    <div
                      className={`p-6 bg-white rounded-2xl border transition-all duration-300 flex flex-col justify-between h-full ${
                        idx === 1
                          ? "border-blue-600 shadow-lg relative ring-2 ring-blue-600/20 animate-float"
                          : "border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-1"
                      }`}
                    >
                      {idx === 1 && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[11px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                          {t("Paling Laris", "Best Seller")}
                        </span>
                      )}
                      <div className="space-y-4">
                        <h3 className="text-xl font-bold text-navy-900">{plan.name}</h3>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-extrabold text-navy-900">
                            {formatRupiah(plan.price)}
                          </span>
                          <span className="text-xs text-neutral-500">
                            / {plan.durationDays} {t("hari", "days")}
                          </span>
                        </div>
                        <ul className="space-y-2 text-xs text-neutral-600 pt-2 border-t border-slate-100">
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-blue-600" /> RAM: {plan.ramMb} MB
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-blue-600" /> CPU: {plan.cpuAllowance}%
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-blue-600" /> Storage: {plan.storageGb} GB
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-blue-600" />{" "}
                            {t("Web CLI & Subdomain Publik", "Web CLI & Public Subdomain")}
                          </li>
                        </ul>
                      </div>
                      <div className="pt-6">
                        <Link
                          href="/product"
                          className={`w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center transition-all ${
                            idx === 1
                              ? "bg-navy-800 hover:bg-navy-900 text-white shadow"
                              : "bg-blue-100 hover:bg-blue-100/80 text-navy-900"
                          }`}
                        >
                          {t("Sewa Sekarang", "Rent Now")}
                        </Link>
                      </div>
                    </div>
                  </ScrollRevealItem>
                ))}
          </div>

          <ScrollReveal delay={0.4} direction="up" distance={15}>
            <div className="text-center pt-2">
              <Link
                href="/product"
                className="text-sm font-semibold text-blue-600 hover:text-navy-800 inline-flex items-center gap-1 hover:underline"
              >
                <span>
                  {t(
                    "Lihat semua kombinasi durasi & resource",
                    "View all duration & resource combinations"
                  )}
                </span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Target Personas Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <ScrollReveal direction="up" distance={25}>
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold text-navy-900">
              {t("Cocok Untuk Siapa RuPa Cloud?", "Who is RuPa Cloud For?")}
            </h2>
            <p className="text-neutral-600 max-w-xl mx-auto text-sm sm:text-base">
              {t(
                "Platform serba guna yang dirancang fleksibel untuk kebutuhan eksperimen teknologi kamu.",
                "A versatile platform designed to flexibly accommodate your tech experimentation."
              )}
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {personas.map((p, idx) => {
            const Icon = p.icon;
            return (
              <ScrollRevealItem key={idx} delay={idx * 0.1}>
                <div className="p-6 bg-blue-100/30 border border-blue-100 rounded-2xl space-y-3 hover:bg-blue-100/60 hover:-translate-y-1 transition-all duration-300 h-full">
                  <div className="w-10 h-10 bg-navy-800 text-white rounded-lg flex items-center justify-center shadow-sm">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-navy-900">{p.title}</h3>
                  <p className="text-xs text-neutral-600 leading-relaxed">{p.desc}</p>
                </div>
              </ScrollRevealItem>
            );
          })}
        </div>
      </section>

      {/* FAQ Ringkas Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <ScrollReveal direction="up" distance={25}>
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold text-navy-900">
              {t("Pertanyaan Sering Diajukan", "Frequently Asked Questions")}
            </h2>
            <p className="text-neutral-600 text-sm">
              {t(
                "Masih punya pertanyaan? Lihat jawaban umum di bawah ini.",
                "Still have questions? Check out the common answers below."
              )}
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.15} direction="up" distance={20}>
          <FaqAccordion items={faqs} />
        </ScrollReveal>

        <ScrollReveal delay={0.3} direction="up" distance={15}>
          <div className="text-center pt-2">
            <Link
              href="/faq"
              className="text-sm font-semibold text-blue-600 hover:text-navy-800 inline-flex items-center gap-1 hover:underline"
            >
              <span>
                {t("Buka halaman FAQ selengkapnya", "View full FAQ page")}
              </span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
