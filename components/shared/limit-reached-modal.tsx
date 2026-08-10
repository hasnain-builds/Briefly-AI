"use client";

import { useMemo } from "react";
import { Sparkles, X, Lock, Calendar } from "lucide-react";
import { FeatureKey, FEATURE_QUOTAS } from "@/config/quotas";

interface LimitReachedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgradeToPro: () => void;
  featureKey: FeatureKey | null;
  resetDate: string | null;
  usedCount?: number;
  limitCount?: number;
}

export function LimitReachedModal({
  isOpen,
  onClose,
  onUpgradeToPro,
  featureKey,
  resetDate,
  usedCount,
  limitCount,
}: LimitReachedModalProps) {
  const formattedResetDate = useMemo(() => {
    if (!resetDate) return "next month";
    try {
      const d = new Date(resetDate);
      return d.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return resetDate;
    }
  }, [resetDate]);

  const featureInfo = useMemo(() => {
    if (!featureKey) {
      return {
        label: "this feature",
        limit: limitCount ?? 2,
      };
    }
    const quota = FEATURE_QUOTAS[featureKey];
    return {
      label: quota?.label || featureKey,
      limit: limitCount ?? quota?.freeLimit ?? 2,
    };
  }, [featureKey, limitCount]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0B0B0F]/80 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[540px] rounded-[24px] border border-purple-500/30 bg-[#0F0F13] text-white shadow-[0_0_50px_rgba(124,58,237,0.2)] animate-in zoom-in-95 duration-200 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Effects */}
        <div className="absolute -top-24 -left-24 size-48 rounded-full bg-[#7C3AED]/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 size-48 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 p-6 sm:p-7 space-y-5">
          {/* Header Bar */}
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300 tracking-wider">
              <Lock className="size-3 text-amber-400" />
              <span>LIMIT REACHED</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-xl bg-[#18181F] border border-white/10 text-zinc-400 hover:bg-[#22222B] hover:text-white transition-all duration-200 cursor-pointer"
              title="Close"
              aria-label="Close modal"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Body Info */}
          <div className="space-y-2">
            <h3 className="text-2xl sm:text-[26px] font-extrabold tracking-tight text-white leading-tight">
              You've used your free credits
            </h3>
            <p className="text-sm text-zinc-300 leading-relaxed">
              You've used your {featureInfo.limit} free {featureInfo.label} for this month.
            </p>
          </div>

          {/* Reset Date Banner */}
          <div className="rounded-xl border border-purple-500/25 bg-purple-500/10 p-3.5 flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-2 text-purple-200 font-medium">
              <Calendar className="size-4 text-purple-400 shrink-0" />
              <span>Your free credits will reset next month.</span>
            </div>
            <span className="font-bold text-white bg-purple-950/80 px-2.5 py-1 rounded-md border border-purple-500/30 text-xs shrink-0">
              {formattedResetDate}
            </span>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-1/2 h-11 rounded-xl border border-zinc-800 bg-[#18181F] text-zinc-300 hover:bg-[#22222B] hover:text-white text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer"
            >
              Maybe Later
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onUpgradeToPro();
              }}
              className="w-full sm:w-1/2 h-11 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(124,58,237,0.3)] hover:shadow-[0_6px_28px_rgba(124,58,237,0.45)] transition-all duration-200 hover:-translate-y-[1px] active:translate-y-0 cursor-pointer"
            >
              <Sparkles className="size-4" />
              <span>Upgrade to Pro</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
