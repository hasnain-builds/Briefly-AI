"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: () => Promise<void>;
}

export function DeleteAccountModal({
  isOpen,
  onClose,
  onConfirmDelete,
}: DeleteAccountModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await onConfirmDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200 selection:bg-red-600 selection:text-white">
      <div
        className="relative w-full max-w-lg rounded-[28px] border border-red-500/35 bg-[#0F0F13] text-white p-6 sm:p-8 shadow-[0_0_60px_rgba(239,68,68,0.22)] backdrop-blur-xl space-y-6 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Red Glow */}
        <div className="absolute -top-24 -left-24 size-48 rounded-full bg-red-600/15 blur-3xl pointer-events-none" />

        {/* Icon & Title Header */}
        <div className="flex items-start gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 shrink-0">
            <AlertTriangle className="size-6 text-red-400" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-tight">
              Delete your account?
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 font-normal leading-relaxed">
              This will permanently delete your Briefly AI account and associated data. This action cannot be undone.
            </p>
          </div>
        </div>

        {/* Warning Callout Box */}
        <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-xs sm:text-sm text-red-200 space-y-1.5 font-medium leading-relaxed">
          <div className="flex items-center gap-2 font-bold text-red-400">
            <Trash2 className="size-4 shrink-0" />
            <span>Permanent Data Loss</span>
          </div>
          <p className="text-red-300/90 text-xs">
            Your profile, saved summaries, history, favorites, and account data will be permanently deleted.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={isDeleting}
            onClick={onClose}
            className="w-full sm:w-auto h-11 px-5 rounded-xl border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
          >
            Cancel
          </Button>

          <Button
            type="button"
            disabled={isDeleting}
            onClick={handleConfirm}
            className="w-full sm:w-auto h-11 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-[0_4px_20px_rgba(220,38,38,0.35)] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="size-4 animate-spin text-white" />
                <span>Deleting account...</span>
              </>
            ) : (
              <>
                <Trash2 className="size-4" />
                <span>Delete Account</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
