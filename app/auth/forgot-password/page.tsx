"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Sparkles, ArrowLeft, Loader2, Key } from "lucide-react";

const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        toast.error(error.message || "Failed to send password reset link.");
        return;
      }

      setIsSent(true);
      toast.success("Password reset email sent!");
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-white dark:bg-black text-zinc-900 dark:text-white px-4 transition-colors duration-300 relative">
      <Toaster />
      
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-violet-600/5 dark:bg-violet-600/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-indigo-600/5 dark:bg-indigo-600/10 blur-[100px] pointer-events-none" />

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

        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mt-4">Reset Password</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 mb-6">
          We'll send a password recovery link to your email address.
        </p>

        {isSent ? (
          <div className="space-y-6">
            <div className="p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 text-sm leading-relaxed flex gap-3">
              <Key className="size-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Reset link sent!</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-405 mt-1">Please check your inbox. If you don't receive it in a few minutes, check your spam folder.</p>
              </div>
            </div>
            <Link href="/auth/login" className="block w-full">
              <Button className="h-11 w-full rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer">
                Back to Login
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-zinc-655 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">Email Address</label>
              <Input
                type="email"
                placeholder="name@example.com"
                disabled={isLoading}
                className="h-10 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2 outline-none text-zinc-900 dark:text-white focus-visible:border-zinc-400 dark:focus-visible:border-zinc-500 focus-visible:ring-0 focus-visible:bg-white dark:focus-visible:bg-zinc-900 text-sm transition-all"
                {...register("email")}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="h-11 w-full rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center mt-6 shadow-md shadow-indigo-500/10"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Sending Link...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
