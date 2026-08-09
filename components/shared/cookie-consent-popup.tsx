import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CookieConsentPopupProps {
  onAccept: () => void;
  onDecline: () => void;
}

export function CookieConsentPopup({ onAccept, onDecline }: CookieConsentPopupProps) {
  const [isChecked, setIsChecked] = useState(false);

  return (
    <div
      className="fixed bottom-4 left-4 z-[99] w-[calc(100vw-32px)] sm:w-[380px] rounded-[24px] border border-purple-500/35 bg-[#0F0F13]/95 text-white shadow-[0_0_50px_rgba(124,58,237,0.22)] backdrop-blur-xl p-5 sm:p-6 overflow-hidden flex flex-col space-y-4 animate-in slide-in-from-bottom-6 fade-in duration-250"
    >
      {/* Ambient Purple Background Glow */}
      <div className="absolute -top-24 -left-24 size-48 rounded-full bg-[#7C3AED]/15 blur-3xl pointer-events-none" />

      {/* Header Top Row */}
      <div className="flex items-center gap-2.5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-md shadow-indigo-500/20 shrink-0">
          <Sparkles className="size-4.5 text-white" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white tracking-tight leading-none">
            Welcome to Briefly AI 👋
          </h3>
          <p className="text-[11px] text-purple-300 font-medium mt-1">
            Privacy & Terms Agreement
          </p>
        </div>
      </div>

      {/* Description Body */}
      <div className="text-xs text-zinc-300 leading-relaxed space-y-2 font-normal">
        <p>
          Before using Briefly AI, please review and accept our{" "}
          <Link
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-purple-400 hover:text-purple-300 underline underline-offset-2 font-medium"
          >
            Terms of Service <ExternalLink className="size-2.5 ml-0.5" />
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-purple-400 hover:text-purple-300 underline underline-offset-2 font-medium"
          >
            Privacy Policy <ExternalLink className="size-2.5 ml-0.5" />
          </Link>.
        </p>
        <p className="text-zinc-400 text-[11px]">
          We use essential cookies only for authentication, security and improving your experience.
        </p>
        <p className="text-[11px] text-zinc-400 font-medium pt-1 border-t border-white/10">
          By continuing, you confirm that you are at least 18 years old and agree to our Terms of Service and Privacy Policy.
        </p>
      </div>

      {/* Checkbox Section */}
      <label className="flex items-start gap-2.5 cursor-pointer pt-1 group select-none">
        <input
          type="checkbox"
          checked={isChecked}
          onChange={(e) => setIsChecked(e.target.checked)}
          className="size-4 rounded border-zinc-700 bg-zinc-900 text-purple-600 focus:ring-purple-500/50 mt-0.5 cursor-pointer accent-purple-600"
        />
        <span className="text-[11px] text-zinc-300 group-hover:text-white leading-normal font-medium">
          I have read and agree to the Terms of Service and Privacy Policy.
        </span>
      </label>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 pt-1">
        <Button
          type="button"
          disabled={!isChecked}
          onClick={onAccept}
          className="w-full h-11 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white font-bold text-xs sm:text-sm shadow-[0_4px_20px_rgba(124,58,237,0.35)] hover:shadow-[0_6px_28px_rgba(124,58,237,0.5)] transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Accept & Continue
        </Button>

        <button
          type="button"
          onClick={onDecline}
          className="w-full py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors duration-200 text-center font-medium cursor-pointer"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
