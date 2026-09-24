import React from "react";
import { ShieldCheck, HeartHandshake, Code2, Users } from "lucide-react";
import { ScrollReveal, ScrollRevealItem } from "@/components/ui/scroll-reveal";

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Header */}
      <ScrollReveal direction="up" distance={25} className="text-center space-y-4 max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-navy-900">Tentang RuPa Cloud</h1>
        <p className="text-base text-neutral-600 leading-relaxed">
          Mendukung generasi developer muda Indonesia melalui akses infrastruktur cloud yang terjangkau, fleksibel, dan mudah digunakan.
        </p>
      </ScrollReveal>

      {/* Philosophy & Vision Mission */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ScrollRevealItem delay={0.1}>
          <div className="p-8 bg-blue-100/40 rounded-2xl border border-blue-200/60 space-y-4 h-full">
            <h2 className="text-xl font-bold text-navy-900 flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-blue-600" /> Filosofi Nama "RuPa"
            </h2>
            <p className="text-sm text-neutral-700 leading-relaxed">
              Nama <strong>RuPa</strong> diambil dari perpaduan dua kata Sansekerta: <br />
              1. <strong>Ru</strong> dari <em>Maruta</em> (मरुत) — melambangkan kecepatan, angin, dan fleksibilitas. <br />
              2. <strong>Pa</strong> dari <em>Alpa</em> (अल्प) — melambangkan ukuran yang ringan, eceran, dan ekonomis.
            </p>
            <p className="text-xs text-neutral-600">
              Kami percaya bahwa infrastruktur cloud tidak harus rumit atau mahal untuk sekadar uji coba project.
            </p>
          </div>
        </ScrollRevealItem>

        <ScrollRevealItem delay={0.25}>
          <div className="p-8 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 h-full">
            <h2 className="text-xl font-bold text-navy-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-navy-800" /> Visi & Misi Utama
            </h2>
            <ul className="space-y-2 text-sm text-neutral-700">
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">1.</span>
                <span>Akses cloud terjangkau tanpa komitmen berlangganan bulanan.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">2.</span>
                <span>Deployment otomatis dari GitHub yang ramah pemula.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">3.</span>
                <span>Sandbox terisolasi yang aman untuk bereksperimen.</span>
              </li>
            </ul>
          </div>
        </ScrollRevealItem>
      </div>

      {/* Simplified Tech Explanation */}
      <ScrollReveal direction="up" distance={25} className="space-y-6">
        <h2 className="text-2xl font-bold text-navy-900 text-center">Bagaimana Teknologi Kami Bekerja?</h2>
        <div className="p-8 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 max-w-3xl mx-auto text-sm text-neutral-600 leading-relaxed">
          <p>
            Di balik layar, server fisik RuPa Cloud dipecah menjadi unit-unit isolasi ringan (menggunakan teknologi container LXD/Incus). Berbeda dari VPS tradisional yang berat, container ini dapat menyala dan siap dalam hitungan detik.
          </p>
          <p>
            Kamu mendapatkan akses penuh ke lingkungan Linux milikmu tanpa khawatir mengganggu server fisik atau pengguna lain.
          </p>
        </div>
      </ScrollReveal>

      {/* Team Placeholder */}
      <div className="space-y-6 text-center">
        <ScrollReveal direction="up" distance={20}>
          <h2 className="text-2xl font-bold text-navy-900">Tim Di Balik RuPa Cloud</h2>
        </ScrollReveal>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            { role: "Infrastructure & Security", name: "Tim Infra RuPa" },
            { role: "Product & Engineering", name: "Tim Product RuPa" },
            { role: "Community Support", name: "Tim Support RuPa" },
          ].map((t, i) => (
            <ScrollRevealItem key={i} delay={i * 0.15}>
              <div className="p-6 border border-slate-200 rounded-xl bg-white space-y-2 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-100 text-navy-900 rounded-full flex items-center justify-center mx-auto">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-navy-900 text-sm">{t.name}</h3>
                <p className="text-xs text-neutral-500">{t.role}</p>
              </div>
            </ScrollRevealItem>
          ))}
        </div>
      </div>
    </div>
  );
}
