"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const signupSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: SignupFormValues) => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.full_name,
          },
        },
      });

      if (error) {
        toast.error(error.message || "An error occurred during signup");
        return;
      }

      toast.success("Account created successfully!");

      if (data.user && !data.session) {
        setIsSuccess(true);
      } else {
        router.push("/auth/login");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <Toaster />
        <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-8">
          <h1 className="mb-2 text-3xl font-bold">Verify Your Email</h1>
          <p className="text-zinc-400">
            Please check your email to verify and confirm your account.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black text-white">
      <Toaster />
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-8">
        <h1 className="mb-2 text-3xl font-bold">Create Account</h1>

        <p className="mb-6 text-zinc-400">
          Start using Briefly AI today.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="Full Name"
              disabled={isLoading}
              className="h-auto w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 outline-none text-white focus-visible:border-zinc-500 focus-visible:ring-0"
              {...register("full_name")}
            />
            {errors.full_name && (
              <p className="mt-1 text-xs text-red-500">{errors.full_name.message}</p>
            )}
          </div>

          <div>
            <Input
              type="email"
              placeholder="Email"
              disabled={isLoading}
              className="h-auto w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 outline-none text-white focus-visible:border-zinc-500 focus-visible:ring-0"
              {...register("email")}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Input
              type="password"
              placeholder="Password"
              disabled={isLoading}
              className="h-auto w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 outline-none text-white focus-visible:border-zinc-500 focus-visible:ring-0"
              {...register("password")}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="h-auto w-full rounded-lg bg-white py-3 font-semibold text-black transition hover:bg-zinc-200 cursor-pointer disabled:opacity-50 flex items-center justify-center"
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>
      </div>
    </main>
  );
}