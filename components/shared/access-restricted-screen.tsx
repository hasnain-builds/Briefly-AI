import Link from "next/link";
import { ShieldAlert, ExternalLink, ArrowRight, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AccessRestrictedScreenProps {
  onAccept: () => void;
}

export function AccessRestrictedScreen({ onAccept }: AccessRestrictedScreenProps) {
  const handleLeaveWebsite = () => {
    window.location.replace("https://www.google.com");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0B0B0F] p-4 sm:p-6 overflow-hidden selection:bg-purple-600 selection:text-white">
      {/* Ambient Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 size-80 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

      <div
        className="relative w-full max-w-lg rounded-[32px] border border-[#7C3AED]/35 bg-[#0F0F13]/90 text-white p-6 sm:p-10 shadow-[0_0_80px_rgba(124,58,237,0.2)] backdrop-blur-2xl text-center space-y-6 overflow-hidden animate-in zoom-in-95 fade-in duration-200"
      >
        {/* Shield Icon Badge */}
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-purple-500/30 bg-purple-500/10 text-purple-400 shadow-inner">
          <ShieldAlert className="size-8 text-purple-400" />
        </div>

        {/* Title & Description */}
        <div className="space-y-2.5">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
            Terms Acceptance Required
          </h2>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal">
            To continue using Briefly AI, you must accept our Terms of Service and Privacy Policy. Without accepting these terms, access to Briefly AI is unavailable.
          </p>
        </div>

        {/* Legal Links */}
        <div className="flex justify-center items-center gap-4 text-xs font-medium text-purple-400 border-y border-white/10 py-3.5">
          <Link
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center hover:text-purple-300 underline underline-offset-4 transition-colors"
          >
            Terms of Service <ExternalLink className="size-3 ml-1" />
          </Link>
          <span className="text-zinc-600">•</span>
          <Link
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center hover:text-purple-300 underline underline-offset-4 transition-colors"
          >
            Privacy Policy <ExternalLink className="size-3 ml-1" />
          </Link>
        </div>

        {/* Buttons */}
        <div className="space-y-3 pt-1">
          <Button
            type="button"
            onClick={onAccept}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white font-bold text-sm sm:text-base shadow-[0_4px_24px_rgba(124,58,237,0.35)] hover:shadow-[0_6px_32px_rgba(124,58,237,0.5)] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Accept & Continue</span>
            <ArrowRight className="size-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={handleLeaveWebsite}
            className="w-full py-2 text-xs sm:text-sm text-zinc-400 hover:text-red-400 hover:bg-red-950/20 font-medium transition-colors cursor-pointer flex items-center justify-center gap-2 rounded-xl border border-transparent hover:border-red-500/20"
          >
            <LogOut className="size-4" />
            <span>Leave Website</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
