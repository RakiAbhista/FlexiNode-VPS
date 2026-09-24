"use client";

import React, { useState, useEffect } from "react";
import { HelpCircle, X, Check } from "lucide-react";
import { dataSource } from "@/lib/data";

interface CoachMarkProps {
  userId: string;
  pageKey: string;
  title: string;
  content: string;
  children: React.ReactNode;
}

export function CoachMark({
  userId,
  pageKey,
  title,
  content,
  children,
}: CoachMarkProps) {
  const [dismissed, setDismissed] = useState<boolean>(true);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  useEffect(() => {
    async function checkPref() {
      const isDismissed = await dataSource.getTutorialPref(userId, pageKey);
      setDismissed(isDismissed);
      if (!isDismissed) setIsOpen(true);
    }
    checkPref();
  }, [userId, pageKey]);

  const handleDismiss = async () => {
    setIsOpen(false);
    setDismissed(true);
    await dataSource.dismissTutorial(userId, pageKey);
  };

  return (
    <div className="relative inline-block w-full">
      {children}

      {!dismissed && isOpen && (
        <div className="absolute z-30 bottom-full left-0 mb-2 w-72 bg-navy-900 text-white rounded-xl shadow-xl p-4 border border-navy-800 animate-in fade-in slide-in-from-bottom-2 text-xs font-sans">
          <div className="flex items-center justify-between pb-2 border-b border-navy-800 mb-2">
            <div className="flex items-center gap-1.5 font-bold text-blue-400">
              <HelpCircle className="w-4 h-4" />
              <span>{title}</span>
            </div>
            <button
              onClick={handleDismiss}
              className="text-neutral-400 hover:text-white p-0.5 rounded"
              title="Lewati"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-neutral-300 text-[11px] leading-relaxed mb-3">
            {content}
          </p>

          <div className="flex justify-end gap-2 pt-1 border-t border-navy-800/60">
            <button
              onClick={handleDismiss}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-[11px] flex items-center gap-1 shadow-sm"
            >
              <Check className="w-3 h-3" />
              <span>Paham, Lewati</span>
            </button>
          </div>

          {/* Pointer triangle */}
          <div className="absolute top-full left-6 -mt-[1px] border-4 border-transparent border-t-navy-900"></div>
        </div>
      )}
    </div>
  );
}
