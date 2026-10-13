"use client";

import React, { useState, useMemo } from "react";
import {
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Search,
  Copy,
  Check,
  Code2,
  ListTree,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionStep {
  id: string;
  name: string;
  duration: string;
  startTime?: number;
  endTime?: number;
  lines: Array<{
    num: number;
    text: string;
    type: "normal" | "error" | "warning" | "success" | "command";
  }>;
  status: "success" | "error" | "warning";
}

interface GithubLogViewerProps {
  logText: string;
  status?: string;
  className?: string;
}

export function GithubLogViewer({ logText, className }: GithubLogViewerProps) {
  const [viewMode, setViewMode] = useState<"interactive" | "raw">("interactive");
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});

  // Parse raw log text into true GitHub Actions Job Steps
  const parsedSteps = useMemo(() => {
    if (!logText) return [];

    const rawLines = logText.split("\n");
    const steps: ActionStep[] = [];

    let currentStep: ActionStep = {
      id: "step-1",
      name: "Set up job",
      duration: "2s",
      lines: [],
      status: "success",
    };

    let inCmdBlock = false;
    let pendingDuration = "";
    let lineCounter = 1;

    // Filter baris teknis bash internal agar murni menampilkan hasil program
    const isJunkBashLine = (line: string): boolean => {
      const t = line.trim();
      if (!t) return false;
      if (t.startsWith("::group::") || t.startsWith("::endgroup::")) return true;
      if (t.startsWith('echo "::group::') || t.startsWith('echo "::endgroup::') || t.startsWith("echo '::group::")) return true;
      if (t.startsWith("TARGET_REPO=") || t.startsWith("CURRENT_REPO=")) return true;
      if (t.startsWith("export GIT_TERMINAL_PROMPT") || t.startsWith("export NODE_OPTIONS")) return true;
      if (t.startsWith("if [") || t.startsWith("if !") || t === "fi" || t === "else" || t.startsWith("elif") || t === "then") return true;
      if (t.startsWith("git remote set-url") || t.startsWith("git fetch") || t.startsWith("git checkout") || t.startsWith("git reset") || t.startsWith("git clean")) return true;
      if (t.startsWith("cat <<") || t.startsWith("NGINX_EOF") || t.startsWith("server {") || t.startsWith("listen ") || t.startsWith("location ") || t.startsWith("proxy_") || t === "}") return true;
      if (
        t.endsWith("_EOF") ||
        t.includes("SUMMARY_EOF") ||
        t.startsWith("shell: /usr/bin/bash") ||
        t.startsWith("##[endgroup]") ||
        t.startsWith("## ☁️ RuPa Cloud") ||
        t.startsWith("### ✅ Deployment Berhasil!") ||
        t.startsWith("### ❌ Deployment Gagal!") ||
        t.startsWith("Terjadi kendala saat proses deployment") ||
        t.startsWith("Aplikasi **") ||
        t.startsWith("| Parameter |") ||
        t.startsWith("| :--- |") ||
        t.startsWith("| 📦 Framework") ||
        t.startsWith("| 🌿 Branch") ||
        t.startsWith("| 🔖 Commit") ||
        t.startsWith("| 👤 Dipicu") ||
        t.startsWith("| ⏱️ Waktu")
      ) return true;
      if (t.includes("then cp .env.example .env") || t.includes("touch database/database.sqlite")) return true;
      if (t.includes("log_step") || t.includes("log_success") || t.includes("log_err") || t.includes("log_warn")) return true;
      return false;
    };

    // Hitung durasi nyata dari selisih waktu timestamp pertama dan terakhir di step
    const formatDuration = (start?: number, end?: number, explicit = ""): string => {
      if (explicit) return explicit;
      if (!start || !end || end < start) return "1s";
      const diffMs = end - start;
      const totalSecs = Math.round(diffMs / 1000);
      if (totalSecs < 1) return "0s";
      if (totalSecs < 60) return `${totalSecs}s`;
      const mins = Math.floor(totalSecs / 60);
      const secs = totalSecs % 60;
      return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
    };

    // Deteksi apakah baris ini adalah nama step baru
    const detectStepHeader = (cleaned: string): string | null => {
      const trimmed = cleaned.trim();
      // Jangan jadikan perintah summary runner sebagai step konsol terpisah
      if (trimmed.includes("GITHUB_STEP_SUMMARY") || trimmed.includes("SUMMARY_EOF")) {
        return null;
      }
      if (trimmed.startsWith("##[group]")) {
        const raw = trimmed.replace(/^##\[group\]/, "").trim();
        if (raw.includes("GITHUB_STEP_SUMMARY") || raw.includes("SUMMARY_EOF")) return null;
        return raw.startsWith("Run ") ? raw : `Run ${raw}`;
      }
      if (trimmed.startsWith("Run actions/checkout")) return "Run actions/checkout@v4";
      if (trimmed.startsWith("Run appleboy/ssh-action")) return "Run appleboy/ssh-action@v1.0.0";
      if (trimmed.startsWith("Build container for action use")) return "Build container for action use";
      if (trimmed.startsWith("Post job cleanup") || trimmed.startsWith("Post actions/checkout")) return "Post job cleanup";
      if (trimmed.startsWith("Complete job") || trimmed.startsWith("Cleaning up orphan processes")) return "Complete job";
      return null;
    };

    for (let i = 0; i < rawLines.length; i++) {
      const raw = rawLines[i];
      if (!raw && i === rawLines.length - 1) continue;

      // Ekstrak timestamp ISO asli jika ada untuk menghitung durasi akurat
      const tsMatch = raw.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)/);
      const lineTime = tsMatch ? new Date(tsMatch[1]).getTime() : null;

      if (lineTime) {
        if (!currentStep.startTime) currentStep.startTime = lineTime;
        currentStep.endTime = lineTime;
      }

      // Bersihkan timestamp ISO dan prefix output runner
      const withoutTimestamp = raw
        .replace(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z\s+/, "")
        .replace(/^out:\s+/, "")
        .replace(/^err:\s+/, "");

      // Bersihkan escape code ANSI
      const cleaned = withoutTimestamp
        .replace(/\x1b\[[0-9;]*m/g, "")
        .replace(/\[\d+(?:;\d+)*m/g, "")
        .trimEnd();

      // Cek durasi step tersendiri (misal: "24s", "1s", "0s")
      const durationMatch = cleaned.trim().match(/^(\d+[smh])$/);
      if (durationMatch) {
        pendingDuration = durationMatch[1];
        continue;
      }

      // Deteksi blok debug ======CMD====== dari appleboy SSH dan buang sepenuhnya
      if (cleaned.includes("======CMD======")) {
        inCmdBlock = true;
        continue;
      }
      if (cleaned.includes("======END======")) {
        inCmdBlock = false;
        continue;
      }
      if (inCmdBlock) {
        continue; // Jangan masukkan script mentah ke log
      }

      // Cek header step baru
      const stepHeader = detectStepHeader(cleaned);
      if (stepHeader) {
        if (currentStep.lines.length > 0) {
          currentStep.duration = formatDuration(currentStep.startTime, currentStep.endTime, currentStep.duration);
          steps.push(currentStep);
        }
        currentStep = {
          id: `step-${steps.length + 1}`,
          name: stepHeader,
          duration: pendingDuration || "",
          startTime: lineTime || undefined,
          endTime: lineTime || undefined,
          lines: [],
          status: "success",
        };
        pendingDuration = "";
        lineCounter = 1;
        continue;
      }

      // Filter baris sintaks bash teknis
      if (isJunkBashLine(cleaned)) {
        continue;
      }

      // Deteksi tipe baris log
      let type: "normal" | "error" | "warning" | "success" | "command" = "normal";
      const lower = cleaned.toLowerCase();

      if (
        cleaned.startsWith("::error") ||
        cleaned.startsWith("##[error]") ||
        lower.includes("process exited with status") ||
        lower.includes("aborting") ||
        lower.includes("error: ") ||
        lower.includes("fatal: ") ||
        lower.includes("failed with exit code") ||
        lower.includes("fatal error") ||
        lower.includes("syntax error")
      ) {
        type = "error";
        currentStep.status = "error";
      } else if (
        cleaned.startsWith("::warning") ||
        cleaned.startsWith("##[warning]") ||
        lower.includes("deprecation notice")
      ) {
        type = "warning";
      } else if (
        cleaned.startsWith("✓ ") ||
        cleaned.startsWith("✔ ") ||
        lower.includes("successfully") ||
        lower.includes("berhasil") ||
        lower.includes("done.")
      ) {
        type = "success";
      } else if (cleaned.startsWith("##[command]") || cleaned.startsWith("[command]")) {
        type = "command";
      }

      // Format teks baris
      let displayText = cleaned;
      if (displayText.startsWith("::notice") || displayText.startsWith("::warning") || displayText.startsWith("::error")) {
        const msg = displayText.match(/::(?:notice|warning|error)(?:[^:]*)::(.*)$/);
        if (msg) displayText = msg[1];
      }

      currentStep.lines.push({
        num: lineCounter++,
        text: displayText,
        type,
      });
    }

    if (currentStep.lines.length > 0) {
      currentStep.duration = formatDuration(currentStep.startTime, currentStep.endTime, currentStep.duration);
      steps.push(currentStep);
    }

    return steps.filter((s) => s.lines.length > 0);
  }, [logText]);

  // Default: Buka step utama (SSH / Deploy) atau step yang memiliki pesan kesalahan
  const initialExpansion = useMemo(() => {
    const map: Record<string, boolean> = {};
    parsedSteps.forEach((s) => {
      if (s.name.includes("appleboy") || s.name.includes("ssh") || s.status === "error" || parsedSteps.length <= 1) {
        map[s.id] = true;
      } else {
        map[s.id] = false;
      }
    });
    return map;
  }, [parsedSteps]);

  const activeExpansion = { ...initialExpansion, ...expandedSteps };

  const toggleStep = (id: string) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [id]: !activeExpansion[id],
    }));
  };

  const handleExpandAll = (expand: boolean) => {
    const map: Record<string, boolean> = {};
    parsedSteps.forEach((s) => {
      map[s.id] = expand;
    });
    setExpandedSteps(map);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(logText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filter pencarian
  const filteredSteps = useMemo(() => {
    if (!searchQuery.trim()) return parsedSteps;
    const q = searchQuery.toLowerCase();
    return parsedSteps
      .map((s) => {
        const nameMatch = s.name.toLowerCase().includes(q);
        const matchingLines = s.lines.filter((l) => l.text.toLowerCase().includes(q));
        if (nameMatch || matchingLines.length > 0) {
          return {
            ...s,
            lines: nameMatch ? s.lines : matchingLines,
          };
        }
        return null;
      })
      .filter(Boolean) as ActionStep[];
  }, [parsedSteps, searchQuery]);

  return (
    <div className={cn("flex flex-col bg-[#0d1117] border border-[#30363d] rounded-xl overflow-hidden font-mono text-[11px]", className)}>
      {/* Top GitHub Style Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 bg-[#161b22] border-b border-[#30363d] text-slate-300">
        <div className="flex items-center gap-1.5 bg-[#0d1117] p-0.5 rounded-lg border border-[#30363d]">
          <button
            type="button"
            onClick={() => setViewMode("interactive")}
            className={cn(
              "px-2.5 py-1 rounded text-[11px] font-sans font-medium flex items-center gap-1.5 transition-colors cursor-pointer",
              viewMode === "interactive"
                ? "bg-[#238636] text-white shadow-sm font-semibold"
                : "text-slate-400 hover:text-white"
            )}
          >
            <ListTree className="w-3.5 h-3.5" />
            <span>GitHub Actions UI</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("raw")}
            className={cn(
              "px-2.5 py-1 rounded text-[11px] font-sans font-medium flex items-center gap-1.5 transition-colors cursor-pointer",
              viewMode === "raw"
                ? "bg-slate-800 text-white shadow-sm font-semibold"
                : "text-slate-400 hover:text-white"
            )}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Raw Log</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {viewMode === "interactive" && (
            <div className="relative">
              <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari dalam log..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 pr-2.5 py-1 bg-[#0d1117] border border-[#30363d] rounded text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 text-[11px] w-36 sm:w-48 transition-all"
              />
            </div>
          )}

          {viewMode === "interactive" && (
            <div className="hidden sm:flex items-center gap-1 border-l border-[#30363d] pl-2">
              <button
                type="button"
                onClick={() => handleExpandAll(true)}
                title="Buka Semua Step"
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleExpandAll(false)}
                title="Tutup Semua Step"
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded cursor-pointer"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="px-2 py-1 bg-[#21262d] hover:bg-[#30363d] text-slate-300 hover:text-white border border-[#30363d] rounded flex items-center gap-1.5 transition-colors cursor-pointer font-sans text-[11px]"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Salin</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Body: Raw Log */}
      {viewMode === "raw" && (
        <div className="p-4 max-h-[460px] overflow-y-auto text-slate-300 whitespace-pre-wrap leading-relaxed select-text scrollbar-thin">
          {logText}
        </div>
      )}

      {/* Body: Interactive GitHub Actions Accordion */}
      {viewMode === "interactive" && (
        <div className="max-h-[480px] overflow-y-auto divide-y divide-[#21262d] scrollbar-thin select-text bg-[#0d1117]">
          {filteredSteps.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-sans text-xs">
              Tidak ada log yang cocok dengan &quot;{searchQuery}&quot;.
            </div>
          ) : (
            filteredSteps.map((step) => {
              const isExpanded = activeExpansion[step.id];

              return (
                <div key={step.id} className="transition-colors">
                  {/* Step Header (Row) */}
                  <button
                    type="button"
                    onClick={() => toggleStep(step.id)}
                    className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-[#161b22] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                      )}

                      {/* Status Icon */}
                      {step.status === "error" ? (
                        <XCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[#238636]" />
                      )}

                      <span className="font-semibold text-slate-200 truncate text-[11px] font-mono">
                        {step.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 text-[11px] text-slate-400 font-mono">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{step.duration}</span>
                    </div>
                  </button>

                  {/* Step Body Lines */}
                  {isExpanded && (
                    <div className="bg-[#090d13] py-1 border-t border-[#21262d]/60 divide-y divide-transparent font-mono text-[11px]">
                      {step.lines.map((l) => (
                        <div
                          key={l.num}
                          className={cn(
                            "px-4 py-0.5 flex items-start gap-4 hover:bg-[#161b22]/50 transition-colors leading-relaxed",
                            l.type === "error" && "bg-rose-950/20 text-rose-300 font-medium",
                            l.type === "warning" && "text-amber-300",
                            l.type === "success" && "text-emerald-400",
                            l.type === "command" && "text-blue-400",
                            l.type === "normal" && "text-slate-300"
                          )}
                        >
                          <span className="text-slate-600 select-none text-[10px] w-8 text-right shrink-0">
                            {l.num}
                          </span>
                          <span className="break-all whitespace-pre-wrap flex-1">
                            {l.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
