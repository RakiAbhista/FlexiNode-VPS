"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerSchema, RegisterInput } from "@/lib/validations";
import { Logo } from "@/components/shared/logo";
import { ArrowRight, AlertCircle } from "lucide-react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<RegisterInput>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerError(null);

    const result = registerSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    // Demo check for existing email
    if (formData.email === "budi@mahasiswa.ac.id") {
      setServerError("Email ini sudah terdaftar. Masuk saja, atau pakai email lain.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      document.cookie = "rc_mock_role=CUSTOMER; path=/; max-age=86400";
      router.push("/verify-otp");
    }, 600);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <ScrollReveal direction="up" distance={25} className="w-full max-w-md">
        <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-sm p-8 space-y-6">
          <div className="text-center space-y-2">
            <Logo className="justify-center mb-2" />
            <h1 className="text-2xl font-bold text-navy-900">Buat Akun RuPa Cloud</h1>
            <p className="text-xs text-neutral-600">
              Mulai sewa VPS mikro harian dalam hitungan detik.
            </p>
          </div>

          {serverError && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-navy-900">Nama Lengkap</label>
              <input
                type="text"
                placeholder="Contoh: Budi Pratama"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              {errors.name && <p className="text-[11px] text-red-600">{errors.name}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-navy-900">Alamat Email</label>
              <input
                type="email"
                placeholder="nama@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              {errors.email && <p className="text-[11px] text-red-600">{errors.email}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-navy-900">Password</label>
              <input
                type="password"
                placeholder="Minimal 6 karakter"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              {errors.password && <p className="text-[11px] text-red-600">{errors.password}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-navy-900">Konfirmasi Password</label>
              <input
                type="password"
                placeholder="Ulangi password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              {errors.confirmPassword && (
                <p className="text-[11px] text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="agreeTerms"
                checked={formData.agreeTerms}
                onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked as true })}
                className="mt-1 rounded text-blue-600 focus:ring-blue-600"
              />
              <label htmlFor="agreeTerms" className="text-xs text-neutral-600 leading-tight">
                Saya menyetujui{" "}
                <Link href="/terms" className="text-blue-600 underline hover:text-navy-900">
                  Syarat & Ketentuan
                </Link>{" "}
                dan{" "}
                <Link href="/privacy" className="text-blue-600 underline hover:text-navy-900">
                  Kebijakan Privasi
                </Link>
              </label>
            </div>
            {errors.agreeTerms && <p className="text-[11px] text-red-600">{errors.agreeTerms}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-navy-800 hover:bg-navy-900 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 shadow transition-all disabled:opacity-50 hover:-translate-y-0.5"
            >
              <span>{loading ? "Membuat Akun..." : "Daftar Sekarang"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center text-xs text-neutral-600">
            Sudah punya akun?{" "}
            <Link href="/login" className="text-blue-600 font-semibold hover:underline">
              Masuk di sini
            </Link>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}
