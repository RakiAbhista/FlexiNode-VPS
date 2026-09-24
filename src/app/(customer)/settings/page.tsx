"use client";

import React, { useState, useEffect } from "react";
import { User, CheckCircle2, Save, Bell, Lock } from "lucide-react";
import { GithubIcon } from "@/components/shared/github-icon";
import { dataSource } from "@/lib/data";
import { User as UserType } from "@/lib/data/types";
import { profileSchema } from "@/lib/validations";

export default function ProfileSettingsPage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [githubHandle, setGithubHandle] = useState("");
  const [githubConnected, setGithubConnected] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const u = await dataSource.getCurrentUser("CUSTOMER");
      if (u) {
        setUser(u);
        setName(u.name);
        setEmail(u.email);
        setGithubHandle(u.githubHandle || "");
        setGithubConnected(!!u.githubHandle);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const toggleGithub = () => {
    if (githubConnected) {
      setGithubConnected(false);
      setGithubHandle("");
    } else {
      setGithubConnected(true);
      setGithubHandle("budipratama");
    }
  };

  if (loading) {
    return <div className="h-64 bg-slate-200 rounded-2xl animate-pulse"></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Pengaturan Akun & Integrasi</h1>
        <p className="text-xs text-neutral-600">
          Kelola profil identitas, tautan GitHub, dan preferensi notifikasi.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <span>Pengaturan profil berhasil diperbarui!</span>
        </div>
      )}

      {/* Profile Info Section */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6">
        <h2 className="text-base font-bold text-navy-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <User className="w-4 h-4 text-blue-600" /> Profil Pengguna
        </h2>

        <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-navy-900">Nama Lengkap</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-navy-900">Alamat Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-navy-800 hover:bg-navy-900 text-white rounded-xl font-bold text-xs shadow inline-flex items-center gap-2 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Perubahan</span>
          </button>
        </form>
      </div>

      {/* GitHub Integration Section */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
        <h2 className="text-base font-bold text-navy-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <GithubIcon className="w-4 h-4 text-navy-900" /> Integrasi GitHub Auto-deploy
        </h2>

        <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="space-y-1">
            <span className="text-xs font-bold text-navy-900 block">
              {githubConnected ? `Terhubung sebagai @${githubHandle}` : "Belum terhubung ke GitHub"}
            </span>
            <p className="text-[11px] text-neutral-500">
              Diperlukan untuk otomatisasi build repositori ke container server.
            </p>
          </div>

          <button
            onClick={toggleGithub}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              githubConnected
                ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                : "bg-navy-800 text-white hover:bg-navy-900 shadow"
            }`}
          >
            {githubConnected ? "Putuskan GitHub" : "Hubungkan GitHub"}
          </button>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
        <h2 className="text-base font-bold text-navy-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Bell className="w-4 h-4 text-blue-600" /> Preferensi Notifikasi Masa Sewa
        </h2>

        <div className="space-y-3 text-xs text-neutral-700">
          <label className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="rounded text-blue-600 focus:ring-blue-600" />
            <span>Kirim email peringatan 24 jam sebelum server expired</span>
          </label>

          <label className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="rounded text-blue-600 focus:ring-blue-600" />
            <span>Notifikasi notifikasi sukses pengisian saldo</span>
          </label>
        </div>
      </div>
    </div>
  );
}
