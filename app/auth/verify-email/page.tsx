"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Sparkles, ArrowLeft, Mail, Loader2 } from "lucide-react";

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [isLoading, setIsLoading] = useState(false);

  const handleResend = async () => {
    if (!email) {
      toast.error("No email address provided to resend verification.");
      return;
    }
    
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
      });

      if (error) {
        toast.error(error.message || "Failed to resend verification email.");
        return;
      }

      toast.success("Verification email resent successfully!");
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 p-6 sm:p-8 shadow-xl backdrop-blur-md relative">
      <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
      
      {/* Back Link */}
      <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors mb-6 group">
        <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
        Back to Login
      </Link>

      {/* Logo and Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center justify-center size-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-md shadow-indigo-500/10">
          <Sparkles className="size-4.5 text-white" />
        </div>
        <span className="font-bold text-lg bg-gradient-to-r from-zinc-950 to-zinc-500 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">Briefly AI</span>
      </div>

      <div className="flex flex-col items-center text-center mt-6 mb-8 space-y-3">
        <div className="p-4 rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
          <Mail className="size-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Verify your email</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs">
          We've sent a verification link to your inbox{email ? ` at ${email}` : ""}.
        </p>
      </div>

      <div className="space-y-3">
        <Button
          onClick={handleResend}
          disabled={isLoading || !email}
          className="h-11 w-full rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center shadow-md shadow-indigo-500/10"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin mr-2" />
              Resending Email...
            </>
          ) : (
            "Resend Email"
          )}
        </Button>

        <Link href="/auth/login" className="block w-full">
          <Button
            variant="outline"
            disabled={isLoading}
            className="h-11 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300 font-semibold transition-all cursor-pointer"
          >
            Back to Login
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white dark:bg-black text-zinc-900 dark:text-white px-4 transition-colors duration-300 relative">
      <Toaster />
      
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-violet-600/5 dark:bg-violet-600/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-indigo-600/5 dark:bg-indigo-600/10 blur-[100px] pointer-events-none" />

      <Suspense fallback={
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="size-10 animate-spin text-indigo-500" />
          <p className="text-sm text-zinc-400">Loading verification details...</p>
        </div>
      }>
        <VerifyEmailForm />
      </Suspense>
    </main>
  );
}
