"use client";

import { createContext, useContext, useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Sparkles, X, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { FeatureKey } from "@/config/quotas";
import { LimitReachedModal } from "@/components/shared/limit-reached-modal";

type PlanGateContextValue = {
  openUpgradeModal: (reason?: "limit_reached" | "pro_feature", resetDate?: string) => void;
  closeUpgradeModal: () => void;
  isUpgradeModalOpen: boolean;
  upgradeReason: "limit_reached" | "pro_feature";
  upgradeResetDate: string | null;
  plan: "free" | "pro";
  setPlan: (plan: "free" | "pro") => void;
  isLoadingPlan: boolean;
  upgradeToPro: () => Promise<void>;
  
  // Limit Reached Modal Integration
  openLimitReachedModal: (
    featureKey: FeatureKey,
    resetDate?: string,
    usedCount?: number,
    limitCount?: number
  ) => void;
  closeLimitReachedModal: () => void;
  isLimitReachedModalOpen: boolean;
  limitFeatureKey: FeatureKey | null;
  limitUsedCount?: number;
  limitMaxCount?: number;
};

const PlanGateContext = createContext<PlanGateContextValue>({
  openUpgradeModal: () => {},
  closeUpgradeModal: () => {},
  isUpgradeModalOpen: false,
  upgradeReason: "pro_feature",
  upgradeResetDate: null,
  plan: "free",
  setPlan: () => {},
  isLoadingPlan: true,
  upgradeToPro: async () => {},
  openLimitReachedModal: () => {},
  closeLimitReachedModal: () => {},
  isLimitReachedModalOpen: false,
  limitFeatureKey: null,
});

export const usePlanGate = () => useContext(PlanGateContext);

export function PlanGateProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<"limit_reached" | "pro_feature">("pro_feature");
  const [upgradeResetDate, setUpgradeResetDate] = useState<string | null>(null);
  const [plan, setPlanState] = useState<"free" | "pro">("free");
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);

  // Limit Reached Modal State
  const [isLimitReachedModalOpen, setIsLimitReachedModalOpen] = useState(false);
  const [limitFeatureKey, setLimitFeatureKey] = useState<FeatureKey | null>(null);
  const [limitUsedCount, setLimitUsedCount] = useState<number | undefined>(undefined);
  const [limitMaxCount, setLimitMaxCount] = useState<number | undefined>(undefined);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("plan, plan_expires_at, usage_reset_at")
            .eq("id", user.id)
            .single();

          if (profile?.usage_reset_at) {
            setUpgradeResetDate(profile.usage_reset_at);
          }

          if (profile?.plan === "pro") {
            if (profile.plan_expires_at) {
              const expires = new Date(profile.plan_expires_at);
              if (expires.getTime() > new Date().getTime()) {
                setPlanState("pro");
              } else {
                setPlanState("free");
              }
            } else {
              setPlanState("pro");
            }
          }
        }
      } catch (err) {
        console.error("Error fetching plan:", err);
      } finally {
        setIsLoadingPlan(false);
      }
    };
    fetchPlan();
  }, []);

  useEffect(() => {
    if (isUpgradeModalOpen || isLimitReachedModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isUpgradeModalOpen, isLimitReachedModalOpen]);

  const setPlan = (newPlan: "free" | "pro") => {
    setPlanState(newPlan);
  };

  const openUpgradeModal = (reason: "limit_reached" | "pro_feature" = "pro_feature", resetDate?: string) => {
    setUpgradeReason(reason);
    if (resetDate) {
      setUpgradeResetDate(resetDate);
    }
    setIsUpgradeModalOpen(true);
  };

  const closeUpgradeModal = () => {
    setIsUpgradeModalOpen(false);
  };

  const openLimitReachedModal = (
    featureKey: FeatureKey,
    resetDate?: string,
    usedCount?: number,
    limitCount?: number
  ) => {
    setLimitFeatureKey(featureKey);
    if (resetDate) {
      setUpgradeResetDate(resetDate);
    }
    setLimitUsedCount(usedCount);
    setLimitMaxCount(limitCount);
    setIsLimitReachedModalOpen(true);
  };

  const closeLimitReachedModal = () => {
    setIsLimitReachedModalOpen(false);
  };

  const upgradeToPro = async () => {
    setIsUpgradeModalOpen(true);
  };

  const value = useMemo(
    () => ({
      openUpgradeModal,
      closeUpgradeModal,
      isUpgradeModalOpen,
      upgradeReason,
      upgradeResetDate,
      plan,
      setPlan,
      isLoadingPlan,
      upgradeToPro,
      openLimitReachedModal,
      closeLimitReachedModal,
      isLimitReachedModalOpen,
      limitFeatureKey,
      limitUsedCount,
      limitMaxCount,
    }),
    [
      isUpgradeModalOpen,
      upgradeReason,
      upgradeResetDate,
      plan,
      isLoadingPlan,
      isLimitReachedModalOpen,
      limitFeatureKey,
      limitUsedCount,
      limitMaxCount,
    ]
  );

  const formattedResetDate = useMemo(() => {
    if (!upgradeResetDate) return "next month";
    try {
      const d = new Date(upgradeResetDate);
      return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    } catch {
      return upgradeResetDate;
    }
  }, [upgradeResetDate]);

  return (
    <PlanGateContext.Provider value={value}>
      {children}

      {/* Limit Reached Modal */}
      <LimitReachedModal
        isOpen={isLimitReachedModalOpen}
        onClose={closeLimitReachedModal}
        onUpgradeToPro={() => openUpgradeModal("limit_reached", upgradeResetDate || undefined)}
        featureKey={limitFeatureKey}
        resetDate={upgradeResetDate}
        usedCount={limitUsedCount}
        limitCount={limitMaxCount}
      />

      {/* Existing Pro Coming Soon Modal */}
      {isUpgradeModalOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0B0B0F]/80 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setIsUpgradeModalOpen(false)}
        >
          <div
            className="relative w-full max-w-[720px] max-h-[90vh] rounded-[28px] border border-[#7C3AED]/35 bg-[#0F0F13] text-white shadow-[0_0_60px_rgba(124,58,237,0.18)] animate-in zoom-in-95 duration-200 flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Purple Background Glow */}
            <div className="absolute -top-32 -left-32 size-64 rounded-full bg-[#7C3AED]/15 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 size-64 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

            {/* Scrollable Modal Content */}
            <div className="relative z-10 p-4 sm:p-8 overflow-y-auto max-h-[90vh] space-y-5 sm:space-y-6 scrollbar-thin scrollbar-thumb-purple-900/40">
              {/* Header Top Row */}
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-300 tracking-wider">
                  <Sparkles className="size-3 text-purple-400" />
                  <span>BRIEFLY AI PRO</span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsUpgradeModalOpen(false)}
                  className="flex size-9 items-center justify-center rounded-xl bg-[#18181F] border border-white/10 text-zinc-400 hover:bg-[#22222B] hover:border-white/20 hover:text-white transition-all duration-200 cursor-pointer"
                  title="Close"
                  aria-label="Close modal"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Title & Description */}
              <div>
                <h2 className="text-2xl sm:text-3xl md:text-[34px] font-extrabold tracking-tight text-white leading-tight">
                  {upgradeReason === "limit_reached" ? "Monthly Limit Reached" : "🚀 Briefly AI Pro is Coming Soon"}
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-zinc-400 font-normal leading-relaxed">
                  {upgradeReason === "limit_reached"
                    ? `You've reached the monthly limit for this feature. Your free quota will automatically reset on ${formattedResetDate}. Upgrade to Briefly AI Pro for unlimited access.`
                    : "We're currently integrating our secure payment system. Pro subscriptions will be available very soon. Once launched, you'll unlock:"}
                </p>
              </div>

              {upgradeReason === "limit_reached" && (
                <div className="rounded-xl border border-purple-500/25 bg-purple-500/10 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 text-purple-300 font-medium">
                    <Sparkles className="size-4 text-purple-400 shrink-0" />
                    <span>Your free quota will automatically reset on</span>
                  </div>
                  <span className="font-bold text-white bg-purple-950/70 px-3 py-1 rounded-lg border border-purple-500/30 self-start sm:self-auto">
                    {formattedResetDate}
                  </span>
                </div>
              )}

              {/* Feature List */}
              <div>
                <ul className="space-y-3">
                  {[
                    "Unlimited Text Summaries",
                    "PDF Summaries",
                    "URL Summaries",
                    "Ask AI",
                    "Export to PDF, TXT & Markdown",
                    "Share Summaries",
                    "Future Premium Features",
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-[#7C3AED]/50 bg-[#7C3AED]/10 text-purple-400">
                        <Check className="size-3 stroke-[2.5]" />
                      </span>
                      <span className="text-xs sm:text-sm font-medium text-zinc-200">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Info Card */}
              <div className="rounded-2xl border border-purple-500/25 bg-purple-500/10 p-4 sm:p-5 text-xs sm:text-sm leading-relaxed space-y-1.5">
                <p className="font-semibold text-white">
                  Payments are currently unavailable.
                </p>
                <p className="text-zinc-400">
                  We're working hard to launch Briefly AI Pro as soon as possible. Thank you for your patience and support.
                </p>
              </div>

              {/* Buttons */}
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setIsUpgradeModalOpen(false)}
                  className="group/cta relative w-full h-[52px] rounded-[18px] bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-[0_4px_24px_rgba(124,58,237,0.35)] hover:shadow-[0_6px_32px_rgba(124,58,237,0.5)] transition-all duration-200 ease-out hover:-translate-y-[2px] active:translate-y-0 active:scale-[0.99] cursor-pointer"
                >
                  <span>Got it</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsUpgradeModalOpen(false)}
                  className="w-full py-2 text-xs sm:text-sm text-zinc-400 hover:text-zinc-200 transition-colors duration-200 text-center cursor-pointer font-medium"
                >
                  Continue with Free Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PlanGateContext.Provider>
  );
}

type GatedButtonProps = React.ComponentProps<typeof Button> & {
  locked?: boolean;
  featureKey?: FeatureKey;
  badgeLabel?: string;
  tooltipText?: string;
  showLockIcon?: boolean;
};

export function GatedButton({
  locked = false,
  featureKey,
  badgeLabel,
  tooltipText,
  showLockIcon = true,
  className,
  onClick,
  children,
  disabled,
  ...props
}: GatedButtonProps) {
  const { plan, openUpgradeModal, openLimitReachedModal } = usePlanGate();
  const isLocked = locked && plan === "free";

  // If locked, we don't pass native disabled so the button remains clickable to trigger modal
  const isNativelyDisabled = !isLocked && disabled;

  return (
    <Button
      {...props}
      disabled={isNativelyDisabled}
      aria-disabled={isLocked || disabled}
      onClick={(event) => {
        if (isLocked) {
          event.preventDefault();
          event.stopPropagation();
          if (featureKey) {
            openLimitReachedModal(featureKey);
          } else {
            openUpgradeModal();
          }
          return;
        }

        onClick?.(event);
      }}
      className={cn(
        "group relative transition-all duration-200 ease-out select-none",
        isLocked && [
          "cursor-pointer opacity-90 hover:opacity-100",
          "hover:border-purple-500/40 dark:hover:border-purple-500/40",
          "hover:shadow-[0_0_12px_rgba(168,85,247,0.18)] dark:hover:shadow-[0_0_12px_rgba(168,85,247,0.25)]",
        ],
        className
      )}
    >
      <span className="inline-flex items-center gap-1.5">{children}</span>
      {isLocked && showLockIcon && (
        <Lock
          aria-hidden="true"
          className="size-3 text-zinc-400 dark:text-zinc-400 opacity-80 group-hover:opacity-100 group-hover:scale-110 group-hover:text-purple-400 dark:group-hover:text-purple-400 transition-all duration-200 ease-out ml-1 shrink-0"
        />
      )}
    </Button>
  );
}