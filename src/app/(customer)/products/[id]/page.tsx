"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Server,
  Clock,
  Terminal as TerminalIcon,
  Activity,
  Download,
  AlertTriangle,
  RefreshCcw,
  CheckCircle2,
  Copy,
  ArrowLeft,
} from "lucide-react";
import { GithubIcon } from "@/components/shared/github-icon";
import { Order } from "@/lib/data/types";
import { dataSource } from "@/lib/data";
import { formatRupiah, cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

type TabType = "overview" | "cli" | "deploy" | "monitoring" | "backup" | "danger";

export default function ContainerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [copied, setCopied] = useState<boolean>(false);

  // Danger zone modal state
  const [resetModalOpen, setResetModalOpen] = useState<boolean>(false);
  const [resetting, setResetting] = useState<boolean>(false);
  const [resetSuccess, setResetSuccess] = useState<boolean>(false);

  // Mock monitoring data for Recharts
  const monitoringData = [
    { time: "10:00", cpu: 12, ram: 35 },
    { time: "10:15", cpu: 25, ram: 42 },
    { time: "10:30", cpu: 45, ram: 58 },
    { time: "10:45", cpu: 30, ram: 50 },
    { time: "11:00", cpu: 65, ram: 72 },
    { time: "11:15", cpu: 40, ram: 60 },
  ];

  useEffect(() => {
    async function loadDetail() {
      const data = await dataSource.getOrderDetail(orderId);
      setOrder(data);
      setLoading(false);
    }
    loadDetail();
  }, [orderId]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetContainer = () => {
    setResetting(true);
    setTimeout(() => {
      setResetting(false);
      setResetSuccess(true);
      setResetModalOpen(false);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-slate-200 rounded-2xl"></div>
        <div className="h-64 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl space-y-4">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-navy-900">Server Tidak Ditemukan</h2>
        <p className="text-xs text-neutral-600">ID container tidak terdaftar di sistem kamu.</p>
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-navy-800 text-white font-bold text-xs rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Server</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/products"
          className="text-xs font-bold text-navy-900 hover:text-blue-600 inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Server Saya</span>
        </Link>
        <span className="text-xs font-mono text-neutral-400">ID: {order.id}</span>
      </div>

      {/* Container Identity Banner */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-green-100 text-green-800 border border-green-200">
              {order.status === "ACTIVE" ? "Aktif" : order.status}
            </span>
            <span className="text-xs text-neutral-500 font-mono">Container LXD</span>
          </div>
          <h1 className="text-2xl font-extrabold text-navy-900">
            {order.plan?.name || "Server LXD"}
          </h1>
          <p className="text-xs text-neutral-500 font-mono">{order.subdomain}</p>
        </div>

        <Link
          href={`/checkout?planId=${order.planId}`}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition-colors inline-flex items-center gap-1.5"
        >
          <Clock className="w-4 h-4" />
          <span>Perpanjang Masa Sewa</span>
        </Link>
      </div>

      {/* Detail Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: "overview", label: "Overview", icon: Server },
          { id: "cli", label: "Web CLI", icon: TerminalIcon },
          { id: "deploy", label: "Deploy (GitHub)", icon: GithubIcon },
          { id: "monitoring", label: "Monitoring", icon: Activity },
          { id: "backup", label: "Backup / Export", icon: Download },
          { id: "danger", label: "Danger Zone", icon: AlertTriangle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-colors",
                isActive
                  ? "bg-navy-800 text-white shadow-sm"
                  : "bg-white text-navy-900 border border-slate-200 hover:bg-slate-100"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 p-6 bg-white border border-slate-200 rounded-2xl space-y-6">
            <h2 className="text-base font-bold text-navy-900 border-b border-slate-100 pb-3">
              Informasi Akses & Subdomain
            </h2>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-500">Subdomain Publik</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`https://${order.subdomain}`}
                    className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-navy-900"
                  />
                  <button
                    onClick={() => copyToClipboard(`https://${order.subdomain}`)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-navy-900 rounded-xl text-xs font-bold flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? "Tersalin!" : "Salin"}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-500">IP Address Container</label>
                <input
                  type="text"
                  readOnly
                  value={order.ipAddress}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-navy-900"
                />
              </div>
            </div>

            <h2 className="text-base font-bold text-navy-900 border-b border-slate-100 pb-3 pt-4">
              Spesifikasi Resource
            </h2>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-slate-50 rounded-xl">
                <span className="text-[11px] text-neutral-500 block">Memory RAM</span>
                <span className="text-base font-extrabold text-navy-900">
                  {order.plan?.ramMb} MB
                </span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <span className="text-[11px] text-neutral-500 block">CPU Core</span>
                <span className="text-base font-extrabold text-navy-900">
                  {order.plan?.cpuAllowance}% CPU
                </span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <span className="text-[11px] text-neutral-500 block">Storage</span>
                <span className="text-base font-extrabold text-navy-900">
                  {order.plan?.storageGb} GB
                </span>
              </div>
            </div>
          </div>

          {/* Right Status Sidebar */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-6">
            <h2 className="text-base font-bold text-navy-900 border-b border-slate-100 pb-3">
              Masa Aktivasi
            </h2>

            <div className="space-y-3 text-xs text-neutral-600">
              <div className="flex justify-between">
                <span>Tanggal Aktif:</span>
                <span className="font-bold text-navy-900">
                  {order.startedAt ? new Date(order.startedAt).toLocaleDateString("id-ID") : "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Berakhir Pada:</span>
                <span className="font-bold text-navy-900">
                  {order.expiresAt ? new Date(order.expiresAt).toLocaleDateString("id-ID") : "-"}
                </span>
              </div>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Ketentuan Expired</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Saat masa sewa habis, container akan otomatis direset. Backup data kamu atau lakukan perpanjangan sebelum waktu habis.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Web CLI */}
      {activeTab === "cli" && (
        <div className="p-6 bg-navy-900 text-green-400 rounded-2xl font-mono text-xs shadow-2xl space-y-4 border border-navy-800">
          <div className="flex items-center justify-between border-b border-navy-800 pb-3 text-neutral-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="ml-2 text-[11px]">web-cli@{order.subdomain}</span>
            </div>
            <span>Session: Active (Restricted Shell)</span>
          </div>

          <div className="space-y-2 min-h-[280px]">
            <p className="text-neutral-400">RuPa Cloud LXD Interactive Web CLI v2.0</p>
            <p className="text-neutral-400">Type 'help' for system info or start typing commands...</p>
            <p className="pt-2">root@{order.subdomain}:~# uname -a</p>
            <p className="text-neutral-300">Linux container-lxd-node42 6.1.0-18-amd64 #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux</p>
            <p className="pt-2">root@{order.subdomain}:~# systemctl status nginx</p>
            <p className="text-green-400">● nginx.service - High performance web server</p>
            <p className="text-green-400">   Loaded: loaded (/lib/systemd/system/nginx.service; enabled)</p>
            <p className="text-green-400">   Active: active (running) since Thu 2026-09-24 10:00:00 UTC</p>
            <p className="pt-4 flex items-center gap-1 text-white">
              <span>root@{order.subdomain}:~#</span>
              <span className="w-2 h-4 bg-green-400 animate-pulse inline-block"></span>
            </p>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Deploy (GitHub) */}
      {activeTab === "deploy" && (
        <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-navy-900">Auto-deploy dari GitHub</h2>
              <p className="text-xs text-neutral-600">
                Hubungkan repositori GitHub kamu untuk memicu otomatisasi build ke container.
              </p>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-lg flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Connected
            </span>
          </div>

          <div className="space-y-4 max-w-lg">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-navy-900">Repositori GitHub</label>
              <select className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs text-navy-900">
                <option>budipratama/node-express-api (Branch: main)</option>
                <option>budipratama/python-bot-discord (Branch: main)</option>
              </select>
            </div>

            <button className="px-4 py-2.5 bg-navy-800 hover:bg-navy-900 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-2">
              <RefreshCcw className="w-4 h-4" />
              <span>Trigger Manual Redeploy</span>
            </button>
          </div>

          <div className="pt-4">
            <h3 className="text-xs font-bold text-navy-900 mb-2">Build Log Terakhir</h3>
            <div className="p-4 bg-navy-900 text-neutral-300 font-mono text-[11px] rounded-xl space-y-1">
              <p className="text-blue-400">[INFO] Triggering GitHub Webhook commit e81a92f...</p>
              <p>[BUILD] Fetching repository budipratama/node-express-api...</p>
              <p>[BUILD] Running npm install && npm run build...</p>
              <p className="text-green-400">[SUCCESS] Container restarted cleanly on port 8080.</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Monitoring */}
      {activeTab === "monitoring" && (
        <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-navy-900">Grafik Monitoring Resource</h2>
              <p className="text-xs text-neutral-600">Penggunaan CPU & RAM dalam 2 jam terakhir.</p>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monitoringData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <RechartsTooltip />
                <Area type="monotone" dataKey="cpu" name="CPU (%)" stroke="#5483B3" fill="#C1E8FF" />
                <Area type="monotone" dataKey="ram" name="RAM (%)" stroke="#052659" fill="#052659" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Backup / Export */}
      {activeTab === "backup" && (
        <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-navy-900">Export & Backup Server</h2>
            <p className="text-xs text-neutral-600">
              Unduh arsip data atau konfigurasi sebelum masa sewa server kamu berakhir.
            </p>
          </div>

          <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 max-w-lg">
            <h3 className="text-sm font-bold text-navy-900">Generate Full Data Backup (.tar.gz)</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Arsip mencakup direktori `/var/www`, file konfigurasi web server, dan dump database lokal jika ada.
            </p>
            <button className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition-colors inline-flex items-center gap-2">
              <Download className="w-4 h-4" />
              <span>Generate & Unduh Backup</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Danger Zone */}
      {activeTab === "danger" && (
        <div className="p-6 bg-white border border-red-200 rounded-2xl space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-red-600">Danger Zone (Aksi Destruktif)</h2>
            <p className="text-xs text-neutral-600">
              Tindakan di bawah ini tidak dapat dibatalkan setelah dikonfirmasi.
            </p>
          </div>

          {resetSuccess && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800 font-semibold">
              Server berhasil direset ke status pabrik.
            </div>
          )}

          <div className="p-6 bg-red-50/50 border border-red-200 rounded-2xl space-y-3 max-w-lg">
            <h3 className="text-sm font-bold text-navy-900">Reset Manual Container</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Server ini akan direset dan semua data di dalamnya hilang. Yakin lanjutkan?
            </p>
            <button
              onClick={() => setResetModalOpen(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow transition-colors"
            >
              Reset Manual Server
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal with Framer Motion */}
      <AnimatePresence>
        {resetModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setResetModalOpen(false)}
              className="fixed inset-0 bg-navy-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl z-10"
            >
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-bold text-navy-900">Konfirmasi Reset Server</h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Server ini akan direset dan semua data di dalamnya hilang. Yakin lanjutkan?
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setResetModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-navy-900 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleResetContainer}
                  disabled={resetting}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {resetting ? "Mereset..." : "Ya, Reset Sekarang"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
