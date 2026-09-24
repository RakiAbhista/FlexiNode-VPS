"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage, Language } from "@/lib/i18n/language-context";
import { motion, AnimatePresence } from "framer-motion";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSelect = (newLang: Language) => {
    setLang(newLang);
    setMenuOpen(false);
  };

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100/90 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors cursor-pointer border border-slate-200/60 shadow-xs"
        title="Ganti Bahasa / Change Language"
      >
        <span>{lang === "ID" ? "🇮🇩" : "🇬🇧"}</span>
        <span>{lang}</span>
        <ChevronDown className={cn("w-3 h-3 text-slate-400 transition-transform duration-200", menuOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-36 bg-white border border-slate-200/90 rounded-xl shadow-xl py-1 z-50 overflow-hidden"
          >
            <button
              type="button"
              onClick={() => handleSelect("ID")}
              className={cn(
                "w-full px-3 py-2 text-left text-xs font-semibold flex items-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer",
                lang === "ID" ? "text-blue-600 font-bold bg-blue-50/60" : "text-slate-700"
              )}
            >
              <span>🇮🇩</span>
              <span>Indonesia (ID)</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelect("EN")}
              className={cn(
                "w-full px-3 py-2 text-left text-xs font-semibold flex items-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer",
                lang === "EN" ? "text-blue-600 font-bold bg-blue-50/60" : "text-slate-700"
              )}
            >
              <span>🇬🇧</span>
              <span>English (EN)</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
