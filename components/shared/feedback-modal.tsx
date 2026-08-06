"use client";

import { useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, feedbackText: string) => Promise<void>;
  onRemindLater: () => void;
  onSkip: () => void;
}

export function FeedbackModal({
  isOpen,
  onClose,
  onSubmit,
  onRemindLater,
  onSkip,
}: FeedbackModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(rating, feedbackText);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentDisplayRating = hoveredRating || rating;

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-[#0B0B0F]/80 backdrop-blur-md p-0 sm:p-6 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-[500px] rounded-t-[28px] sm:rounded-[28px] border border-[#7C3AED]/35 bg-[#0F0F13] text-white shadow-[0_0_60px_rgba(124,58,237,0.2)] animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 overflow-hidden flex flex-col p-6 sm:p-8 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Purple Background Glow */}
        <div className="absolute -top-32 -left-32 size-64 rounded-full bg-[#7C3AED]/15 blur-3xl pointer-events-none" />

        {/* Header Section */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center size-12 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-purple-500/20 border border-purple-500/30 text-amber-400 mb-1">
            <Star className="size-6 fill-amber-400 text-amber-400 animate-pulse" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight leading-tight">
            We&apos;d Love Your Feedback
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 font-normal leading-relaxed max-w-sm mx-auto">
            Your feedback helps us improve Briefly AI for everyone. It only takes a few seconds.
          </p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 5-Star Interactive Rating */}
          <div className="flex items-center justify-center gap-2 py-2">
            {[1, 2, 3, 4, 5].map((starIndex) => {
              const isFilled = starIndex <= currentDisplayRating;
              return (
                <button
                  key={starIndex}
                  type="button"
                  onClick={() => setRating(starIndex)}
                  onMouseEnter={() => setHoveredRating(starIndex)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setRating(starIndex);
                    }
                  }}
                  aria-label={`Rate ${starIndex} out of 5 stars`}
                  className="p-2 rounded-xl hover:bg-white/5 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 cursor-pointer group"
                >
                  <Star
                    className={`size-8 sm:size-9 transition-all duration-200 group-hover:scale-110 ${
                      isFilled
                        ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]"
                        : "text-zinc-600 fill-zinc-800/40 group-hover:text-zinc-400"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Optional Textarea */}
          <div className="space-y-1.5">
            <div className="relative">
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value.slice(0, 1000))}
                placeholder="Tell us what you liked or what we can improve..."
                rows={3}
                className="w-full bg-[#18181F] border border-white/10 rounded-2xl p-3.5 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/50 resize-none transition-all"
              />
              <span className="absolute bottom-2.5 right-3 text-[10px] text-zinc-500 font-mono">
                {feedbackText.length}/1000
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-1">
            <Button
              type="submit"
              disabled={rating === 0 || isSubmitting}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white font-bold text-sm shadow-[0_4px_24px_rgba(124,58,237,0.35)] hover:shadow-[0_6px_32px_rgba(124,58,237,0.5)] transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin text-white" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Feedback</span>
              )}
            </Button>

            <button
              type="button"
              onClick={onRemindLater}
              className="w-full py-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors duration-200 text-center font-medium cursor-pointer"
            >
              Remind Me Later
            </button>

            <button
              type="button"
              onClick={onSkip}
              className="w-full py-1 text-xs text-zinc-500 hover:text-zinc-400 transition-colors duration-200 text-center font-medium cursor-pointer"
            >
              Skip
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
