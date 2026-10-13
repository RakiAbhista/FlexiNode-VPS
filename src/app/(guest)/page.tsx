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
  Server,
} from "lucide-react";
import { GithubIcon } from "@/components/shared/github-icon";
import { dataSource } from "@/lib/data";
import { Plan } from "@/lib/data/types";
import { formatRupiah, cn } from "@/lib/utils";
import { SplitText } from "@/components/ui/split-text";
import { ScrollReveal, ScrollRevealItem } from "@/components/ui/scroll-reveal";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { ShineBorder } from "@/components/ui/shine-border";
import { SparklesText } from "@/components/ui/sparkles-text";
import { VideoShowcaseCarousel } from "@/components/ui/video-showcase-carousel";
import { FaqAccordion } from "@/components/ui/faq-accordion";
import { useLanguage } from "@/lib/i18n/language-context";
import { CloudValuesSection } from "@/components/shared/cloud-values-section";

export default function LandingPage() {
  const { lang, t } = useLanguage();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlans() {
      const data = await dataSource.getPlans();
      // Urutkan berdasarkan durasi (1 hari, 3 hari, 7 hari)
      const sorted = [...data].sort((a, b) => a.durationDays - b.durationDays);
      setPlans(sorted);
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

  const heroTitle = t(
    "Sewa VPS Mikro Harian. Bayar Sesuai Kebutuhanmu.",
    "Daily Micro VPS Rental. Pay Only What You Need."
  );

  return (
    <div className="space-y-24 pb-16">
      {/* Hero Section */}
      <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center pt-8 pb-16 lg:py-24 bg-gradient-to-b from-blue-100/30 via-white to-white bg-tech-grid overflow-hidden">
        {/* Soft Ambient Background Glow (Static - No Looping Animation) */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-blue-100/40 rounded-full blur-3xl -z-10 pointer-events-none" />

        {/* Bottom Fade Mask */}
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none z-0" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 lg:space-y-10 w-full relative z-10">
          {/* Animated Hero Title with SplitText */}
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

          {/* Video Showcase Carousel (Replaces HeroTerminalMockup & TiltedCard) */}
          <ScrollReveal delay={0.5} direction="up" distance={30}>
            <VideoShowcaseCarousel />
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

      {/* Value Bisnis (CLOUD) Section */}
      <CloudValuesSection />

      {/* Keunggulan Section (SpotlightCard on Hover Only) */}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 auto-rows-[minmax(280px,auto)]">
          {/* Card 1: Wide (2 columns) */}
          <ScrollRevealItem delay={0.1} className="lg:col-span-2 h-full">
            <SpotlightCard className="h-full p-0 overflow-hidden border border-slate-200/60 bg-gradient-to-br from-white to-slate-50/80">
              <div className="h-full flex flex-col sm:flex-row items-start sm:items-center gap-6 p-8 relative">
                <div className="flex-1 space-y-4 relative z-10">
                  <div className="w-14 h-14 bg-blue-100/80 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-200/50">
                    <Clock className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-navy-900 tracking-tight">
                    {t("Sewa Durasi Pendek", "Short-Term Rental")}
                  </h3>
                  <p className="text-sm text-neutral-600 leading-relaxed max-w-md">
                    {t(
                      "Pilih masa sewa 1 hari, 3 hari, atau 1 minggu. Hemat biaya tanpa perlu membayar sewa sebulan penuh. Cocok untuk tugas kuliah, eksperimen, atau event singkat.",
                      "Choose a rental period of 1 day, 3 days, or 1 week. Save money without paying for a full month. Perfect for college assignments, experiments, or short events."
                    )}
                  </p>
                </div>
                <div className="hidden sm:flex flex-1 justify-end absolute -right-6 top-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
                  <Clock className="w-64 h-64 text-navy-900" />
                </div>
              </div>
            </SpotlightCard>
          </ScrollRevealItem>

          {/* Card 2: Narrow (1 column) */}
          <ScrollRevealItem delay={0.2} className="lg:col-span-1 h-full">
            <SpotlightCard className="h-full p-0 overflow-hidden border border-slate-200/60 bg-gradient-to-bl from-white to-blue-50/40">
              <div className="h-full flex flex-col p-8 relative">
                <div className="w-14 h-14 bg-blue-100/80 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-200/50 mb-6 relative z-10">
                  <Zap className="w-7 h-7" />
                </div>
                <div className="space-y-3 relative z-10">
                  <h3 className="text-2xl font-extrabold text-navy-900 tracking-tight">
                    {t("Provisioning Cepat", "Instant Provisioning")}
                  </h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    {t(
                      "Server container LXD/Incus siap digunakan dalam hitungan detik setelah transaksi terkonfirmasi.",
                      "LXD/Incus container servers are ready to use in seconds after transaction confirmation."
                    )}
                  </p>
                </div>
                <div className="absolute -bottom-10 -right-10 opacity-[0.03] pointer-events-none">
                  <Zap className="w-56 h-56 text-navy-900" />
                </div>
              </div>
            </SpotlightCard>
          </ScrollRevealItem>

          {/* Card 3: Narrow (1 column) */}
          <ScrollRevealItem delay={0.3} className="lg:col-span-1 h-full">
            <SpotlightCard className="h-full p-0 overflow-hidden border border-slate-200/60 bg-gradient-to-tr from-white to-blue-50/40">
              <div className="h-full flex flex-col p-8 relative">
                <div className="w-14 h-14 bg-blue-100/80 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-200/50 mb-6 relative z-10">
                  <GithubIcon className="w-7 h-7" />
                </div>
                <div className="space-y-3 relative z-10">
                  <h3 className="text-2xl font-extrabold text-navy-900 tracking-tight">
                    {t("Auto-deploy GitHub", "GitHub Auto-deploy")}
                  </h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    {t(
                      "Hubungkan repositori GitHub kamu untuk melakukan deployment aplikasi secara otomatis dan praktis.",
                      "Connect your GitHub repository to automatically and conveniently deploy your applications."
                    )}
                  </p>
                </div>
                <div className="absolute -bottom-10 -right-6 opacity-[0.03] pointer-events-none">
                  <GithubIcon className="w-56 h-56 text-navy-900" />
                </div>
              </div>
            </SpotlightCard>
          </ScrollRevealItem>

          {/* Card 4: Wide (2 columns) */}
          <ScrollRevealItem delay={0.4} className="lg:col-span-2 h-full">
            <SpotlightCard className="h-full p-0 overflow-hidden border border-slate-200/60 bg-gradient-to-tl from-white to-slate-50/80">
              <div className="h-full flex flex-col sm:flex-row items-start sm:items-center gap-6 p-8 relative">
                <div className="flex-1 space-y-4 relative z-10">
                  <div className="w-14 h-14 bg-blue-100/80 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-200/50">
                    <Terminal className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-navy-900 tracking-tight">
                    {t("Akses Web CLI", "Web CLI Access")}
                  </h3>
                  <p className="text-sm text-neutral-600 leading-relaxed max-w-md">
                    {t(
                      "Kelola server langsung dari browser tanpa perlu install aplikasi terminal atau SSH di perangkat kamu. Proses aman dan terenkripsi penuh.",
                      "Manage your server directly from the browser without installing terminal tools or SSH clients. Fully encrypted and secure process."
                    )}
                  </p>
                </div>
                <div className="hidden sm:flex flex-1 justify-end absolute -right-4 -bottom-12 opacity-[0.03] pointer-events-none">
                  <Terminal className="w-72 h-72 text-navy-900" />
                </div>
              </div>
            </SpotlightCard>
          </ScrollRevealItem>
        </div>
      </section>

      {/* Preview Tier Harga Section (Fokus Konversi - Featured Card with ShineBorder & SparklesText) */}
      <section className="bg-blue-50 py-16 border-y border-slate-200/60">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 xl:gap-10 max-w-[1300px] mx-auto items-stretch py-8">
            {loading
              ? [1, 2, 3].map((i) => (
                  <div key={i} className="h-[600px] bg-slate-200/60 animate-pulse rounded-3xl" />
                ))
              : plans.slice(0, 3).map((plan, idx) => {
                  const isFeatured = plan.durationDays === 3;
                  // Reveal order: 1 Day (idx 0) -> 7 Days (idx 2) -> 3 Days (Featured, idx 1)
                  let revealDelay = 0;
                  if (plan.durationDays === 1) revealDelay = 0;
                  else if (plan.durationDays === 7) revealDelay = 0.3;
                  else if (plan.durationDays === 3) revealDelay = 0.6;

                  let planSubtitle = "";
                  let planDesc = "";
                  let planTarget = "";

                  if (plan.durationDays === 1) {
                    planSubtitle = t("Uji Coba & Eksperimen", "Trial & Experiment");
                    planDesc = t(
                      "Sangat cocok untuk kalian yang butuh server sementara untuk testing aplikasi, deploy tugas akhir, atau sekadar mencoba environment Linux.",
                      "Perfect for those who need a temporary server for app testing, final project deployment, or just trying out a Linux environment."
                    );
                    planTarget = t("Target: Mahasiswa saat presentasi tugas atau demo project.", "Target: Students during assignment presentations or project demos.");
                  } else if (plan.durationDays === 3) {
                    planSubtitle = t("Paling Populer & Fleksibel", "Most Popular & Flexible");
                    planDesc = t(
                      "Paket terfavorit untuk pengerjaan project, hackathon, atau tugas akhir. Mendukung add-on Subdomain & GitHub CI/CD otomatis.",
                      "Top favorite plan for projects, hackathons, or final assignments. Supports automated Subdomain & GitHub CI/CD add-on."
                    );
                    planTarget = t("Target: Mahasiswa tugas akhir, peserta hackathon, atau freelance.", "Target: Final-year students, hackathon participants, or freelancers.");
                  } else {
                    planSubtitle = t("Hosting Seminggu Penuh", "Full Week Hosting");
                    planDesc = t(
                      "Pilihan tepat untuk menjalankan server nonstop selama seminggu penuh. Cocok untuk demo panjang, testing komprehensif, atau event kampus.",
                      "The right choice for running a server nonstop for a full week. Suitable for extended demos, comprehensive testing, or campus events."
                    );
                    planTarget = t("Target: Panitia event kampus, ujian praktikum, atau project jangka menengah.", "Target: Campus event committees, practical exams, or medium-term projects.");
                  }

                  return (
                    <ScrollRevealItem key={plan.id} delay={revealDelay}>
                      <div
                        className={cn(
                          "bg-white rounded-[2rem] flex flex-col justify-between relative transition-all duration-300 border",
                          isFeatured
                            ? "border-blue-600 shadow-2xl ring-4 ring-blue-600/10 scale-105 p-8 lg:p-10 z-10"
                            : "border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-blue-400 p-8 lg:p-10"
                        )}
                      >
                        {isFeatured && (
                          <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                            <span className="bg-navy-800 text-white text-[11px] font-bold px-5 py-2 rounded-full uppercase tracking-wider shadow-lg inline-flex items-center justify-center">
                              <SparklesText text={t("Paling Populer", "Most Popular")} />
                            </span>
                          </div>
                        )}
                        <div className="flex flex-col flex-grow">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-extrabold text-blue-600 uppercase tracking-widest">{plan.name}</span>
                              {plan.durationDays >= 3 && (
                                <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">
                                  + CI/CD Ready
                                </span>
                              )}
                            </div>
                            <h3 className="text-xl font-bold text-navy-900 leading-tight">{planSubtitle}</h3>
                          </div>
                          
                          <div className="flex items-baseline gap-1 mt-6">
                            <span className="text-4xl lg:text-5xl font-black text-navy-900 tracking-tight">
                              {formatRupiah(plan.price)}
                            </span>
                            <span className="text-sm text-neutral-500 font-medium">
                              / {plan.durationDays} {t("hari", "days")}
                            </span>
                          </div>

                          <div className="space-y-4 mt-6">
                            <p className="text-[15px] text-neutral-600 leading-relaxed">
                              {planDesc}
                            </p>
                            <p className="text-[13px] italic text-neutral-500 font-medium">
                              {planTarget}
                            </p>
                          </div>

                          <hr className="border-slate-100 my-8" />

                          <ul className="space-y-4 text-[15px] text-neutral-700 mb-8">
                            <li className="flex items-start gap-3">
                              <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                              <span><strong className="text-navy-900 font-bold">{plan.ramMb} MB</strong> RAM / Memory</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                              <span><strong className="text-navy-900 font-bold">{plan.cpuAllowance}%</strong> CPU Core</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                              <span><strong className="text-navy-900 font-bold">{plan.storageGb} GB</strong> Disk Storage</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                              <span>
                                {plan.durationDays >= 3
                                  ? t("Support Add-on Subdomain & GitHub CI/CD", "Supports Subdomain & GitHub CI/CD Add-on")
                                  : t("Akses Web CLI & Dedicated IP", "Web CLI Access & Dedicated IP")}
                              </span>
                            </li>
                          </ul>
                        </div>
                        <div className="mt-auto">
                          <Link
                            href={`/checkout?planId=${plan.id}`}
                            className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center transition-all ${
                              isFeatured
                                ? "bg-navy-800 hover:bg-navy-900 text-white shadow-lg hover:shadow-xl"
                                : "bg-blue-50 hover:bg-blue-100 text-navy-900"
                            }`}
                          >
                            {t("Sewa Sekarang", "Rent Now")}
                          </Link>
                        </div>
                      </div>
                    </ScrollRevealItem>
                  );
                })}
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

      {/* Target Personas Section (Split Entrance & Solid Color Token Transition) */}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {personas.map((p, idx) => {
            const Icon = p.icon;
            return (
              <ScrollRevealItem
                key={idx}
                delay={idx * 0.15}
                direction={idx % 2 === 0 ? "right" : "left"}
              >
                <div className="group p-8 bg-white border border-slate-200 rounded-[2rem] hover:border-blue-400 hover:shadow-lg transition-all duration-300 flex flex-col sm:flex-row items-start gap-6 h-full">
                  <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white group-hover:rotate-3 group-hover:scale-110 transition-all duration-300 shadow-sm border border-blue-100">
                    <Icon className="w-7 h-7" />
                  </div>
                  <div className="space-y-2 mt-1">
                    <h3 className="text-xl font-bold text-navy-900">{p.title}</h3>
                    <p className="text-[15px] text-neutral-600 leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              </ScrollRevealItem>
            );
          })}
        </div>
      </section>

      {/* FAQ Ringkas Section (Spring Accordion) */}
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
