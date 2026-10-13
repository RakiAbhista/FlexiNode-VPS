"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/shared/logo";
import { CheckCircle2, AlertCircle, RefreshCw, Mail } from "lucide-react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";

  const [email, setEmail] = useState<string>(emailParam);
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [countdown, setCountdown] = useState<number>(60);
  const [canResend, setCanResend] = useState<boolean>(false);
  const [resending, setResending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

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

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain") || e.clipboardData.getData("text");
    const digitsOnly = pastedData.replace(/\D/g, "");
    if (!digitsOnly) return;

    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = digitsOnly[i] || "";
    }
    setOtp(newOtp);

    // Focus ke input terakhir yang terisi atau input ke-6
    const targetIdx = Math.min(digitsOnly.length - 1, 5);
    const targetInput = document.getElementById(`otp-input-${targetIdx}`);
    targetInput?.focus();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");

    if (!email.trim()) {
      setError("Alamat email tidak ditemukan. Masukkan email kamu.");
      return;
    }

    if (code.length !== 6) {
      setError("Masukkan 6 digit kode OTP secara lengkap.");
      return;
    }

    setLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Kode OTP salah atau telah kadaluwarsa.");
        setLoading(false);
        return;
      }

      setInfoMessage("Verifikasi berhasil! Mengalihkan ke dashboard...");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch {
      setError("Terjadi kesalahan koneksi. Silakan coba lagi.");
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      setError("Alamat email wajib diisi untuk mengirim ulang kode.");
      return;
    }

    setResending(true);
    setError(null);
    setInfoMessage(null);

    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Gagal mengirim ulang kode OTP.");
        setResending(false);
        return;
      }

      setCountdown(60);
      setCanResend(false);
      setOtp(Array(6).fill(""));
      setInfoMessage(data.message || "Kode OTP baru telah dikirim.");
    } catch {
      setError("Terjadi kesalahan koneksi saat meminta kode baru.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6 text-center">
      <Logo className="justify-center mb-2" />
      <h1 className="text-xl sm:text-2xl font-bold text-navy-900">Verifikasi Kode OTP</h1>
      <p className="text-xs text-neutral-600">
        Masukkan 6 digit kode verifikasi yang dikirimkan ke alamat email kamu.
      </p>

      {/* Input Email jika belum terisi dari URL */}
      {!emailParam && (
        <div className="text-left space-y-1 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <label className="text-xs font-semibold text-navy-900 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-blue-600" />
            <span>Alamat Email</span>
          </label>
          <input
            type="email"
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:border-blue-600 focus:outline-none"
          />
        </div>
      )}

      {emailParam && (
        <div className="px-3 py-1.5 bg-blue-50/70 border border-blue-200/60 rounded-xl text-xs font-medium text-navy-900 inline-flex items-center gap-1.5">
          <Mail className="w-3.5 h-3.5 text-blue-600" />
          <span>{emailParam}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2 text-left">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {infoMessage && (
        <div className="p-3.5 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700 flex items-start gap-2 text-left">
          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
          <span>{infoMessage}</span>
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-6">
        <div className="flex justify-center gap-1.5 sm:gap-2">
          {otp.map((digit, idx) => (
            <input
              key={idx}
              id={`otp-input-${idx}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(e.target.value, idx)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              onPaste={handlePaste}
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
            disabled={resending}
            className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
            <span>{resending ? "Mengirim Ulang..." : "Kirim Ulang Kode OTP"}</span>
          </button>
        ) : (
          <p>
            Kirim ulang kode dalam <span className="font-bold text-navy-900">{countdown} detik</span>
          </p>
        )}
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <ScrollReveal direction="up" distance={25} className="w-full max-w-md">
        <Suspense fallback={<div className="h-96 bg-white rounded-2xl animate-pulse" />}>
          <VerifyOtpContent />
        </Suspense>
      </ScrollReveal>
    </div>
  );
}
