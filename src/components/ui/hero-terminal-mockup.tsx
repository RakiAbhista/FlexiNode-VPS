"use client";

import React, { useState, useEffect } from "react";
import { Terminal, Shield, Check, Copy, ExternalLink, Zap, Cpu, HardDrive } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";

export function HeroTerminalMockup() {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"terminal" | "specs">("terminal");

  const commandText = "incus launch images:ubuntu/24.04 vps-mikro-01";

  const handleCopy = () => {
    navigator.clipboard.writeText(commandText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 relative">
      {/* Outer Glow Background */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-cyan-500/20 to-indigo-600/20 rounded-3xl blur-xl opacity-80 pointer-events-none" />

      {/* Terminal Window Card */}
      <div className="relative bg-slate-950/90 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl text-left">
        {/* Top Control Bar */}
        <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
            <span className="ml-2 text-xs font-mono text-slate-400 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              vps-mikro-01 — Incus/LXD Container
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[11px] font-mono text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Container Active (1.2s)</span>
            </div>

            <button
              onClick={handleCopy}
              className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded hover:bg-slate-800"
              title="Copy Command"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Terminal Content */}
        <div className="p-5 font-mono text-xs leading-relaxed space-y-2 text-slate-300">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="text-blue-400 font-bold">root@rupacloud-node-01:~#</span>
            <span className="text-slate-100">{commandText}</span>
          </div>
          <div className="text-slate-400">Creating vps-mikro-01... <span className="text-emerald-400">Done.</span></div>
          <div className="text-slate-400">Starting container vps-mikro-01... <span className="text-emerald-400">Ready in 1.2s</span></div>
          <div className="pt-1 text-slate-400 border-t border-slate-900 flex flex-wrap gap-4 text-[11px]">
            <span>IPv4: <span className="text-cyan-300">103.179.56.12</span></span>
            <span>Port: <span className="text-slate-200">22, 80, 443</span></span>
            <span>Domain: <span className="text-blue-400 underline cursor-pointer">vps-mikro-01.rupacloud.net</span></span>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <span className="text-emerald-400 font-bold">root@vps-mikro-01:~#</span>
            <span className="text-slate-100">systemctl status nginx</span>
            <span className="w-2 h-4 bg-blue-500 inline-block animate-pulse ml-0.5" />
          </div>
          <div className="text-emerald-400/90 pl-4">● nginx.service - High performance web server (Active: running)</div>
        </div>

        {/* Footer Quick Spec Bar */}
        <div className="px-5 py-3 bg-slate-900/60 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-6 text-slate-400">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              <strong className="text-slate-200">512 MB</strong> RAM
            </span>
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <strong className="text-slate-200">10%</strong> CPU Core
            </span>
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-blue-400" />
              <strong className="text-slate-200">10 GB</strong> NVMe
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <Shield className="w-3.5 h-3.5 text-green-400" />
            <span className="text-[11px]">{t("Terisolasi LXD Sandbox", "Isolated LXD Sandbox")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
