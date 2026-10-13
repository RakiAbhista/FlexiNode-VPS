"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerSchema, RegisterInput } from "@/lib/validations";
import { Logo } from "@/components/shared/logo";
import { GithubIcon } from "@/components/shared/github-icon";
import { ArrowRight, AlertCircle, Eye, EyeOff } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error || "Gagal mendaftar. Silakan periksa formulir kamu.");
        setLoading(false);
        return;
      }

      router.push("/verify-otp?email=" + encodeURIComponent(formData.email));
    } catch (err: any) {
      setServerError("Terjadi kesalahan koneksi. Silakan coba lagi.");
      setLoading(false);
    }
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
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimal 6 karakter"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-3.5 pr-10 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  tabIndex={-1}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-[11px] text-red-600">{errors.password}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-navy-900">Konfirmasi Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Ulangi password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full pl-3.5 pr-10 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
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

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-neutral-400 font-medium">atau daftar dengan</span>
            </div>
          </div>

          <a
            href="/api/auth/github?redirect=/dashboard"
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-black text-white rounded-lg font-semibold text-xs flex items-center justify-center gap-2 shadow transition-all hover:-translate-y-0.5"
          >
            <GithubIcon className="w-4 h-4" />
            <span>Daftar Cepat dengan GitHub</span>
          </a>

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
