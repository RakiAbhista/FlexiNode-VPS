"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, ChevronRight, ChevronLeft, Check, Sparkles } from "lucide-react";
import { dataSource } from "@/lib/data";

interface StepConfig {
  targetId: string;
  title: string;
  content: string;
  position: "bottom" | "top" | "left" | "right";
}

interface OnboardingTourProps {
  userId: string;
}

export function OnboardingTour({ userId }: OnboardingTourProps) {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const steps: StepConfig[] = [
    {
      targetId: "tour-saldo-card",
      title: "1. Penjelasan Saldo & Top-up",
      content:
        "Di sini kamu dapat memantau saldo wallet aktif dan melakukan pengisian saldo (top-up) dengan cepat untuk sewa VPS harian tanpa biaya transaksi berulang.",
      position: "bottom",
    },
    {
      targetId: "tour-produk-saya",
      title: "2. Penjelasan Halaman Produk Saya",
      content:
        "Semua server container LXD yang kamu sewa akan muncul di sini. Kamu dapat mengecek sisa masa sewa, membuka Web CLI browser, dan kelola auto-deploy GitHub.",
      position: "right",
    },
    {
      targetId: "tour-riwayat-transaksi",
      title: "3. Penjelasan Riwayat Transaksi",
      content:
        "Seluruh catatan transaksi keuangan top-up, sewa server, dan perpanjangan tersimpan rapi di sini, lengkap dengan invoice yang dapat dicetak atau diunduh PDF.",
      position: "right",
    },
  ];

  const updatePositions = useCallback(() => {
    if (!isOpen) return;
    const currentTargetId = steps[activeStep]?.targetId;
    if (!currentTargetId) return;

    const el = document.getElementById(currentTargetId);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
    } else {
      setTargetRect(null);
    }
  }, [isOpen, activeStep]);

  useEffect(() => {
    async function checkPref() {
      const isDismissed = await dataSource.getTutorialPref(userId, "customer-tour-v2");
      if (!isDismissed) {
        setTimeout(() => {
          setIsOpen(true);
        }, 400);
      }
    }
    checkPref();
  }, [userId]);

  useEffect(() => {
    if (isOpen) {
      updatePositions();
      const timer = setTimeout(updatePositions, 50);
      window.addEventListener("resize", updatePositions);
      window.addEventListener("scroll", updatePositions);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("resize", updatePositions);
        window.removeEventListener("scroll", updatePositions);
      };
    }
  }, [isOpen, activeStep, updatePositions]);

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsOpen(false);
    await dataSource.dismissTutorial(userId, "customer-tour-v2");
  };

  if (!isOpen) return null;

  const currentStepData = steps[activeStep];

  // Synchronous Layout & Arrow Calculation from targetRect
  const getLayoutPositions = () => {
    if (!targetRect) {
      return {
        tooltipStyle: { top: "50%", left: "50%", transform: "translate(-50%, -50%)" },
        arrowD: null,
      };
    }

    const cardWidth = 320;
    const cardHeight = 210;
    const pos = currentStepData.position;

    // Increased gap distance (64px to 72px) so the SVG curved arrow is spacious & highly aesthetic
    const gapPadding = pos === "bottom" ? 64 : pos === "right" ? 72 : 64;

    let top = targetRect.bottom + gapPadding;
    let left = targetRect.left + targetRect.width / 2 - cardWidth / 2;

    if (pos === "right") {
      top = targetRect.top - 10;
      left = targetRect.right + gapPadding;
    } else if (pos === "top") {
      top = targetRect.top - cardHeight - gapPadding;
      left = targetRect.left + targetRect.width / 2 - cardWidth / 2;
    } else if (pos === "bottom") {
      top = targetRect.bottom + gapPadding;
      left = targetRect.left + targetRect.width / 2 - cardWidth / 2;
    }

    // Viewport bounds clamping
    if (left < 16) left = 16;
    if (left + cardWidth > window.innerWidth - 16) {
      left = window.innerWidth - cardWidth - 16;
    }
    if (top < 16) top = 16;
    if (top + cardHeight > window.innerHeight - 16) {
      top = window.innerHeight - cardHeight - 16;
    }

    // Arrow Connector calculation based on exact computed card coordinates
    let startX = 0;
    let startY = 0;
    let endX = 0;
    let endY = 0;
    let cpX = 0;
    let cpY = 0;

    const targetCenterX = targetRect.left + targetRect.width / 2;
    const targetCenterY = targetRect.top + targetRect.height / 2;

    if (pos === "bottom") {
      // Tooltip is below target (e.g. Saldo Topbar)
      // Anchor arrow start to left side of card header (left + 50) for a stylish swooping arc
      startX = left + 50;
      startY = top - 6;

      endX = targetCenterX;
      endY = targetRect.bottom + 10;

      // Swooping arc out to the left and up to target center
      cpX = Math.min(startX, endX) - 40;
      cpY = (startY + endY) / 2;
    } else if (pos === "right") {
      // Tooltip is to the right of target (e.g. Sidebar links)
      startX = left - 6;
      startY = top + 32;

      endX = targetRect.right + 10;
      endY = targetCenterY;

      // Arc swooping upwards nicely over the 72px gap
      cpX = (startX + endX) / 2;
      cpY = Math.min(startY, endY) - 30;
    } else if (pos === "top") {
      // Tooltip is above target
      startX = left + 50;
      startY = top + cardHeight + 6;

      endX = targetCenterX;
      endY = targetRect.top - 10;

      cpX = Math.min(startX, endX) - 40;
      cpY = (startY + endY) / 2;
    } else {
      // Tooltip is to the left of target
      startX = left + cardWidth + 6;
      startY = top + 32;

      endX = targetRect.left - 10;
      endY = targetCenterY;

      cpX = (startX + endX) / 2;
      cpY = Math.min(startY, endY) - 30;
    }

    const arrowD = `M ${startX} ${startY} Q ${cpX} ${cpY} ${endX} ${endY}`;

    return {
      tooltipStyle: { top: `${top}px`, left: `${left}px` },
      arrowD,
    };
  };

  const { tooltipStyle, arrowD } = getLayoutPositions();

  // Dimensions of spotlight cutout with 6px padding
  const pad = 6;
  const cutTop = targetRect ? Math.max(0, targetRect.top - pad) : 0;
  const cutLeft = targetRect ? Math.max(0, targetRect.left - pad) : 0;
  const cutWidth = targetRect ? targetRect.width + pad * 2 : 0;
  const cutHeight = targetRect ? targetRect.height + pad * 2 : 0;
  const cutRight = cutLeft + cutWidth;
  const cutBottom = cutTop + cutHeight;

  return (
    <>
      {/* 1. Four Dark Blurred Panels around Target (Leaves Target 100% Unblurred and Uncovered) */}
      {targetRect ? (
        <>
          {/* Top Panel */}
          <div
            style={{ top: 0, left: 0, right: 0, height: `${cutTop}px` }}
            className="fixed z-50 bg-black/80 backdrop-blur-md transition-all duration-200 pointer-events-auto"
          />
          {/* Bottom Panel */}
          <div
            style={{ top: `${cutBottom}px`, left: 0, right: 0, bottom: 0 }}
            className="fixed z-50 bg-black/80 backdrop-blur-md transition-all duration-200 pointer-events-auto"
          />
          {/* Left Panel */}
          <div
            style={{ top: `${cutTop}px`, height: `${cutHeight}px`, left: 0, width: `${cutLeft}px` }}
            className="fixed z-50 bg-black/80 backdrop-blur-md transition-all duration-200 pointer-events-auto"
          />
          {/* Right Panel */}
          <div
            style={{
              top: `${cutTop}px`,
              height: `${cutHeight}px`,
              left: `${cutRight}px`,
              right: 0,
            }}
            className="fixed z-50 bg-black/80 backdrop-blur-md transition-all duration-200 pointer-events-auto"
          />
        </>
      ) : (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md pointer-events-auto transition-all duration-200" />
      )}

      {/* 2. Elevated Highlight Frame Ring around Unblurred Target */}
      {targetRect && (
        <div
          style={{
            top: `${cutTop}px`,
            left: `${cutLeft}px`,
            width: `${cutWidth}px`,
            height: `${cutHeight}px`,
          }}
          className="fixed z-[51] rounded-xl ring-4 ring-blue-500 shadow-[0_0_50px_rgba(59,130,246,0.9)] pointer-events-none transition-all duration-200 animate-pulse"
        />
      )}

      {/* 3. Curved SVG Arrow Connector */}
      {arrowD && (
        <svg
          className="fixed inset-0 z-[53] pointer-events-none w-full h-full overflow-visible"
          style={{ position: "fixed", top: 0, left: 0 }}
        >
          <defs>
            <filter id="arrowGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#38BDF8" floodOpacity="0.8" />
            </filter>
            <marker
              id="arrowhead-cyan"
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="3"
              orient="auto"
            >
              <path d="M 0 0 L 7 3 L 0 6 L 2 3 Z" fill="#38BDF8" />
            </marker>
          </defs>
          {/* Glow / Contrast Outline */}
          <path
            d={arrowD}
            stroke="#0369A1"
            strokeWidth="6"
            strokeDasharray="8 5"
            fill="none"
            opacity="0.5"
          />
          {/* Main Sleek Cyan Dashed Curved Path */}
          <path
            d={arrowD}
            stroke="#38BDF8"
            strokeWidth="2.8"
            strokeDasharray="8 5"
            fill="none"
            markerEnd="url(#arrowhead-cyan)"
            filter="url(#arrowGlow)"
          />
        </svg>
      )}

      {/* 4. Onboarding Tooltip Card */}
      <div
        style={tooltipStyle}
        className="fixed z-[54] w-80 bg-navy-900 text-white rounded-2xl shadow-2xl p-5 border border-blue-500/50 select-none animate-in fade-in zoom-in-95 transition-all duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-navy-800 mb-3">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>{currentStepData.title}</span>
          </div>
          <button
            onClick={handleComplete}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-navy-800 transition-colors"
            title="Lewati Tutorial"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <p className="text-xs text-neutral-200 leading-relaxed mb-4">
          {currentStepData.content}
        </p>

        {/* Footer Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-navy-800">
          <span className="text-[10px] font-bold text-neutral-400">
            Langkah {activeStep + 1} dari {steps.length}
          </span>

          <div className="flex items-center gap-2">
            {activeStep > 0 && (
              <button
                onClick={handlePrev}
                className="px-2.5 py-1.5 bg-navy-800 hover:bg-navy-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Sebelumnya</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-md transition-all"
            >
              <span>{activeStep === steps.length - 1 ? "Selesai" : "Lanjut"}</span>
              {activeStep < steps.length - 1 ? (
                <ChevronRight className="w-3.5 h-3.5" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}


