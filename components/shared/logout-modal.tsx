"use client";

import { useState } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmLogout: () => Promise<void>;
}

export function LogoutModal({
  isOpen,
  onClose,
  onConfirmLogout,
}: LogoutModalProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await onConfirmLogout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200 selection:bg-purple-600 selection:text-white">
      <div
        className="relative w-full max-w-md rounded-[28px] border border-purple-500/35 bg-[#0F0F13] text-white p-6 sm:p-8 shadow-[0_0_60px_rgba(124,58,237,0.22)] backdrop-blur-xl space-y-6 overflow-hidden animate-in zoom-in-95 duration-200 text-center sm:text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Purple Background Glow */}
        <div className="absolute -top-24 -left-24 size-48 rounded-full bg-[#7C3AED]/15 blur-3xl pointer-events-none" />

        {/* Icon Badge & Title Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl border border-purple-500/30 bg-purple-500/10 text-purple-400 shrink-0">
            <LogOut className="size-6 text-purple-400" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-tight">
              Are you sure you want to log out?
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 font-normal leading-relaxed">
              You will need to sign in again to access your Briefly AI account.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={isLoggingOut}
            onClick={onClose}
            className="w-full sm:w-auto h-11 px-5 rounded-xl border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
          >
            Cancel
          </Button>

          <Button
            type="button"
            disabled={isLoggingOut}
            onClick={handleConfirm}
            className="w-full sm:w-auto h-11 px-5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white font-bold text-xs sm:text-sm shadow-[0_4px_20px_rgba(124,58,237,0.35)] hover:shadow-[0_6px_28px_rgba(124,58,237,0.5)] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="size-4 animate-spin text-white" />
                <span>Logging out...</span>
              </>
            ) : (
              <>
                <LogOut className="size-4" />
                <span>Log Out</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
