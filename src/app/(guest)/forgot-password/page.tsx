"use client";

import React, { useState } from "react";
import Link from "next/link";
import { forgotPasswordSchema } from "@/lib/validations";
import { Logo } from "@/components/shared/logo";
import { Mail, CheckCircle2, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      setError("Masukkan format email yang valid.");
      return;
    }

    setSubmitted(true);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-8 space-y-6">
        <div className="text-center space-y-2">
          <Logo className="justify-center mb-2" />
          <h1 className="text-2xl font-bold text-navy-900">Lupa Password</h1>
          <p className="text-xs text-neutral-600">
            Masukkan email terdaftar untuk menerima instruksi pemulihan kata sandi.
          </p>
        </div>

        {submitted ? (
          <div className="p-6 bg-blue-100/50 border border-blue-200 rounded-2xl text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-blue-600 mx-auto" />
            <h2 className="font-bold text-navy-900 text-sm">Instruksi Dikirim</h2>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Jika email tersebut terdaftar di sistem kami, kamu akan menerima tautan pemulihan kata sandi beberapa saat lagi.
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali ke Halaman Login</span>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-navy-900">Alamat Email</label>
              <input
                type="email"
                required
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              {error && <p className="text-[11px] text-red-600">{error}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-navy-800 hover:bg-navy-900 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 shadow transition-all"
            >
              <Mail className="w-4 h-4" />
              <span>Kirim Link Reset</span>
            </button>

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="text-xs text-neutral-600 hover:text-navy-900 inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali ke Login</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
