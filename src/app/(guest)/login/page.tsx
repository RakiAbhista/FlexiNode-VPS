"use client";

import React, { useState } from "react";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { loginSchema, LoginInput } from "@/lib/validations";
import { Logo } from "@/components/shared/logo";
import { GithubIcon } from "@/components/shared/github-icon";
import { ArrowRight, AlertCircle, ShieldAlert, Eye, EyeOff } from "lucide-react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { useLanguage } from "@/lib/i18n/language-context";

export default function LoginPage() {
  const { lang, t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/dashboard";

  const [formData, setFormData] = useState<LoginInput>({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [rateLimitWarning, setRateLimitWarning] = useState<boolean>(false);
  const [attemptCount, setAttemptCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerError(null);

    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    // Demo invalid password / rate limit state trigger
    if (formData.password === "wrongpassword") {
      const nextAttempt = attemptCount + 1;
      setAttemptCount(nextAttempt);
      if (nextAttempt >= 3) {
        setRateLimitWarning(true);
        setServerError("Terlalu banyak percobaan login gagal. Mohon tunggu 60 detik sebelum mencoba lagi.");
      } else {
        setServerError("Email atau password yang kamu masukkan salah.");
      }
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.requiresVerification && data.email) {
          router.push(`/verify-otp?email=${encodeURIComponent(data.email)}`);
          return;
        }
        setServerError(data.error || "Gagal login. Silakan periksa kredensial kamu.");
        setLoading(false);
        return;
      }

      const role = data.user?.role || "CUSTOMER";
      if (role === "ADMIN") {
        router.push("/admin/dashboard");
      } else {
        router.push(redirectUrl);
      }
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
            <h1 className="text-2xl font-bold text-navy-900">Masuk ke RuPa Cloud</h1>
            <p className="text-xs text-neutral-600">
              Kelola VPS mikro dan riwayat sewa kamu.
            </p>
          </div>

          {/* Error / Rate limit Alert Banner */}
          {serverError && (
            <div
              className={`p-3.5 border rounded-xl text-xs flex items-start gap-2 ${
                rateLimitWarning
                  ? "bg-amber-50 border-amber-300 text-amber-900"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              {rateLimitWarning ? (
                <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-navy-900">Alamat Email</label>
              <input
                type="email"
                disabled={rateLimitWarning}
                placeholder="nama@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-100"
              />
              {errors.email && <p className="text-[11px] text-red-600">{errors.email}</p>}
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-navy-900">Password</label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-semibold text-blue-600 hover:underline"
                >
                  Lupa Password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  disabled={rateLimitWarning}
                  placeholder="Masukkan password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-3.5 pr-10 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-100"
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

            <button
              type="submit"
              disabled={loading || rateLimitWarning}
              className="w-full py-2.5 bg-navy-800 hover:bg-navy-900 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 shadow transition-all disabled:opacity-50 hover:-translate-y-0.5"
            >
              <span>{loading ? "Memproses..." : "Masuk"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-neutral-400 font-medium">atau masuk dengan</span>
            </div>
          </div>

          <a
            href={`/api/auth/github?redirect=${encodeURIComponent(redirectUrl)}`}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-black text-white rounded-lg font-semibold text-xs flex items-center justify-center gap-2 shadow transition-all hover:-translate-y-0.5"
          >
            <GithubIcon className="w-4 h-4" />
            <span>Masuk dengan GitHub</span>
          </a>

          <div className="pt-4 border-t border-slate-100 text-center text-xs text-neutral-600 space-y-2">
            <p>
              Belum punya akun?{" "}
              <Link href="/register" className="text-blue-600 font-semibold hover:underline">
                Daftar Gratis
              </Link>
            </p>
            <p className="text-[11px] text-neutral-400">
              Demo Hint: Email dengan kata <code className="text-blue-600">admin</code> akan masuk sebagai Admin.
            </p>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}
