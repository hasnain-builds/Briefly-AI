"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Sparkles, ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      toast.error(errorParam);
      const newUrl = window.location.pathname;
      router.replace(newUrl);
    }
  }, [searchParams, router]);

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/dashboard");
      }
    };
    checkUser();
  }, [router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        if (error.message.toLowerCase().includes("email not confirmed") || error.message.toLowerCase().includes("confirm") || error.message.toLowerCase().includes("verified")) {
          toast.error("Please verify your email before signing in.");
        } else {
          toast.error(error.message || "An error occurred during login");
        }
        return;
      }

      if (data?.user && !data.user.email_confirmed_at) {
        await supabase.auth.signOut();
        toast.error("Please verify your email before signing in.");
        return;
      }

      toast.success("Logged in successfully!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push("/auth/forgot-password");
  };

  const handleGoogleSignIn = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        toast.error(error.message || "Failed to initialize Google login.");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred.");
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
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors mb-6 group">
          <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
          Back to home
        </Link>

        {/* Logo and Header */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center justify-center size-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-md shadow-indigo-500/10">
            <Sparkles className="size-4.5 text-white" />
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-zinc-950 to-zinc-500 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">Briefly AI</span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Welcome Back</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 mb-6">
          Sign in to your Briefly AI account.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email Address */}
          <div>
            <label className="block text-xs font-semibold text-zinc-655 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">Email Address</label>
            <Input
              type="email"
              placeholder="name@gmail.com"
              disabled={isLoading}
              className="h-10 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2 outline-none text-zinc-900 dark:text-white focus-visible:border-zinc-400 dark:focus-visible:border-zinc-500 focus-visible:ring-0 focus-visible:bg-white dark:focus-visible:bg-zinc-900 text-sm transition-all"
              {...register("email")}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-zinc-655 dark:text-zinc-400 uppercase tracking-wider">Password</label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs font-semibold text-indigo-650 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                disabled={isLoading}
                className="h-10 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 pl-3.5 pr-10 py-2 outline-none text-zinc-900 dark:text-white focus-visible:border-zinc-400 dark:focus-visible:border-zinc-500 focus-visible:ring-0 focus-visible:bg-white dark:focus-visible:bg-zinc-900 text-sm transition-all"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>

          {/* Remember Me */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="size-4 rounded border-zinc-350 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="remember" className="text-sm font-medium text-zinc-600 dark:text-zinc-400 select-none cursor-pointer">
              Remember me
            </label>
          </div>

          {/* Sign In Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="h-11 w-full rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center mt-6 shadow-md shadow-indigo-500/10"
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </Button>
        </form>

        {/* Separator */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-zinc-50 dark:bg-zinc-950 px-2 text-zinc-400 dark:text-zinc-500">Or continue with</span>
          </div>
        </div>

        {/* Google Login Placeholder */}
        <Button
          type="button"
          onClick={handleGoogleSignIn}
          variant="outline"
          className="h-11 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300 font-medium transition-all cursor-pointer flex items-center justify-center gap-2 text-sm"
        >
          {/* Custom Google logo SVG */}
          <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </Button>

        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Don't have an account?{" "}
          <Link href="/auth/signup" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen items-center justify-center bg-white dark:bg-black text-zinc-900 dark:text-white px-4">
        <Loader2 className="size-8 animate-spin text-zinc-400" />
      </main>
    }>
      <LoginForm />
    </Suspense>
  );
}
