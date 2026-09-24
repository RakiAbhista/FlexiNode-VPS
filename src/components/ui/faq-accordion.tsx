"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface FaqItemData {
  q: string;
  a: string;
  category?: string;
}

export function FaqAccordion({ items }: { items: FaqItemData[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <div className="space-y-3.5">
      {items.map((item, idx) => {
        const isOpen = openIdx === idx;
        return (
          <div
            key={idx}
            className={cn(
              "border rounded-2xl bg-white overflow-hidden transition-all duration-200 shadow-sm",
              isOpen
                ? "border-blue-400/80 shadow-md ring-1 ring-blue-500/10"
                : "border-slate-200/90 hover:border-slate-300 hover:shadow"
            )}
          >
            <button
              type="button"
              onClick={() => toggle(idx)}
              className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-navy-900 text-sm sm:text-base cursor-pointer select-none"
            >
              <span className="leading-snug">{item.q}</span>
              <div
                className={cn(
                  "p-1 rounded-full bg-slate-100 text-slate-500 transition-transform duration-300 shrink-0",
                  isOpen && "rotate-180 bg-blue-100 text-blue-600"
                )}
              >
                <ChevronDown className="w-4 h-4" />
              </div>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-5 pt-1 sm:px-5 sm:pb-6 text-xs sm:text-sm text-neutral-600 leading-relaxed border-t border-slate-100/80 mt-1">
                    {item.a}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
