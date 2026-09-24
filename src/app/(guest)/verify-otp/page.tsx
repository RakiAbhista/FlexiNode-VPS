"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/shared/logo";
import { CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

import { ScrollReveal } from "@/components/ui/scroll-reveal";

export default function VerifyOtpPage() {
  const router = useRouter();
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [countdown, setCountdown] = useState<number>(60);
  const [canResend, setCanResend] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Masukkan 6 digit kode OTP secara lengkap.");
      return;
    }

    if (code === "000000") {
      setError("Kode salah atau telah kedaluwarsa. Coba lagi atau kirim ulang kode.");
      return;
    }

    setLoading(true);
    setError(null);
    setTimeout(() => {
      document.cookie = "rc_mock_role=CUSTOMER; path=/; max-age=86400";
      router.push("/dashboard");
    }, 600);
  };

  const handleResend = () => {
    setCountdown(60);
    setCanResend(false);
    setError(null);
    setOtp(Array(6).fill(""));
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <ScrollReveal direction="up" distance={25} className="w-full max-w-md">
        <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6 text-center">
          <Logo className="justify-center mb-2" />
          <h1 className="text-xl sm:text-2xl font-bold text-navy-900">Verifikasi Kode OTP</h1>
          <p className="text-xs text-neutral-600">
            Masukkan 6 digit kode yang kami kirimkan ke alamat email kamu.
          </p>

          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2 text-left">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-6">
            <div className="flex justify-center gap-1.5 sm:gap-2">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-input-${idx}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(e.target.value, idx)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  className="w-9 h-11 sm:w-11 sm:h-12 text-center text-base sm:text-lg font-bold border border-slate-300 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-navy-800 hover:bg-navy-900 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 shadow transition-all disabled:opacity-50 hover:-translate-y-0.5 cursor-pointer"
            >
              <span>{loading ? "Memverifikasi..." : "Verifikasi & Lanjutkan"}</span>
            </button>
          </form>

        <div className="pt-4 border-t border-slate-100 text-xs text-neutral-600 space-y-2">
          {canResend ? (
            <button
              onClick={handleResend}
              className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Kirim Ulang Kode OTP</span>
            </button>
          ) : (
            <p>
              Kirim ulang kode dalam <span className="font-bold text-navy-900">{countdown} detik</span>
            </p>
          )}
          <p className="text-[11px] text-neutral-400">
            Demo Hint: Masukkan digit bebas (selain 000000) untuk memverifikasi.
          </p>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}
