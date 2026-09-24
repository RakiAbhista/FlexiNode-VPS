"use client";

import React, { useState } from "react";
import { HelpCircle, CreditCard, Cpu, UserCheck, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { FaqAccordion, FaqItemData } from "@/components/ui/faq-accordion";
import { useLanguage } from "@/lib/i18n/language-context";

export default function FAQPage() {
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const faqs: (FaqItemData & { category: "pembayaran" | "teknis" | "akun" | "data" })[] = [
    {
      category: "pembayaran",
      q: t("Bagaimana cara kerja sistem saldo (closed-loop wallet)?", "How does the closed-loop wallet system work?"),
      a: t(
        "Saldo di RuPa Cloud digunakan khusus untuk menyewa atau memperpanjang server di platform ini. Kamu bisa mengisi saldo (minimum Rp10.000) via QRIS atau Virtual Account. Menggunakan saldo mempercepat checkout tanpa biaya transaksi tambahan per sewa.",
        "RuPa Cloud wallet balance is used exclusively to rent or extend servers on this platform. You can top up balance (minimum Rp10,000) via QRIS or Virtual Accounts. Using wallet balance speeds up checkout without extra per-transaction fees."
      ),
    },
    {
      category: "pembayaran",
      q: t("Apakah bisa bayar langsung tanpa top-up saldo?", "Can I pay directly without topping up balance?"),
      a: t(
        "Bisa! Di halaman Checkout, kamu bisa memilih opsi bayar via Payment Gateway langsung untuk melakukan pembayaran per transaksi.",
        "Yes! On the Checkout page, you can choose to pay directly via Payment Gateway for per-transaction billing."
      ),
    },
    {
      category: "teknis",
      q: t("Aplikasi apa saja yang boleh di-install di server?", "What applications can I install on the server?"),
      a: t(
        "Kamu bebas meng-install web server (Nginx, Node.js, Python), bot Discord/Telegram, database ringan, atau aplikasi testing. Namun, tindakan berisiko seperti crypto mining, DDoS attack, atau aktivitas ilegal lainnya dilarang dan akan berakibat suspend otomatis.",
        "You can freely install web servers (Nginx, Node.js, Python), Discord/Telegram bots, lightweight databases, or testing apps. However, high-risk activities like crypto mining, DDoS attacks, or illegal actions are strictly prohibited and result in auto-suspension."
      ),
    },
    {
      category: "teknis",
      q: t("Bagaimana cara mengakses Web CLI?", "How do I access the Web CLI?"),
      a: t(
        "Setelah server aktif, masuk ke halaman Detail Container dan buka tab Web CLI. Kamu bisa langsung mengoperasikan terminal Linux berbasis browser tanpa install SSH.",
        "Once your server is active, navigate to Container Details and open the Web CLI tab. You can operate a browser-based Linux terminal without SSH software."
      ),
    },
    {
      category: "data",
      q: t("Apa yang terjadi dengan data saya saat masa sewa expired?", "What happens to my data when the rental expires?"),
      a: t(
        "Ketika masa sewa habis dan tidak diperpanjang, container akan di-reset (delete & recreate dari base image). Semua data di dalam server akan terhapus permanen. Kami menyediakan fitur Export/Backup di tab Detail untuk mengamankan data sebelum expired.",
        "When rental expires without extension, the container is reset (deleted and recreated from base image). All server data is permanently deleted. We provide Export/Backup features in Container Details to secure data before expiration."
      ),
    },
    {
      category: "akun",
      q: t("Bagaimana jika saya lupa password?", "What if I forget my password?"),
      a: t(
        "Gunakan fitur Lupa Password di halaman Login. Masukkan email kamu, lalu ikuti instruksi link reset password yang dikirimkan.",
        "Use the Forgot Password feature on the Login page. Enter your email and follow the password reset link instructions sent to you."
      ),
    },
  ];

  const filteredFaqs =
    activeCategory === "all" ? faqs : faqs.filter((f) => f.category === activeCategory);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <ScrollReveal direction="up" distance={25} className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-navy-900">
          {t("Pusat Bantuan & FAQ", "Help Center & FAQ")}
        </h1>
        <p className="text-neutral-600 text-sm sm:text-base">
          {t(
            "Temukan jawaban cepat mengenai pembayaran, teknis server, akun, dan kebijakan data.",
            "Find quick answers regarding payments, server specs, account management, and data policy."
          )}
        </p>
      </ScrollReveal>

      {/* Category Filter Tabs */}
      <ScrollReveal delay={0.15} direction="up" distance={15} className="flex flex-wrap items-center justify-center gap-2">
        {[
          { id: "all", label: t("Semua FAQ", "All FAQs"), icon: HelpCircle },
          { id: "pembayaran", label: t("Pembayaran & Saldo", "Payment & Balance"), icon: CreditCard },
          { id: "teknis", label: t("Teknis Server & CLI", "Technical & CLI"), icon: Cpu },
          { id: "data", label: t("Kebijakan Data", "Data Policy"), icon: ShieldAlert },
          { id: "akun", label: t("Akun", "Account"), icon: UserCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={cn(
                "px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer",
                isActive
                  ? "bg-navy-800 text-white shadow-sm scale-[1.02]"
                  : "bg-slate-100 text-navy-900 hover:bg-slate-200"
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </ScrollReveal>

      {/* Accordion List with Framer Motion */}
      <FaqAccordion items={filteredFaqs} />
    </div>
  );
}
