"use client";

import { useEffect, useState } from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { useTheme } from "next-themes";
import { Calendar, CheckCircle2, Loader2, Mail, Moon, Settings, Shield, Sun, User, AlertTriangle, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useDashboard } from "../layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { usePlanGate } from "@/components/shared/plan-gate";
import { DeleteAccountModal } from "@/components/shared/delete-account-modal";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { profileName, setProfileName } = useDashboard();
  const { plan, setPlan, openUpgradeModal } = usePlanGate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [fullName, setFullName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleTogglePlan = async () => {
    if (plan === "free") {
      openUpgradeModal();
      return;
    }

    setIsSaving(true);
    try {
      const cancelRes = await fetch("/api/payments/cancel", {
        method: "POST",
      });
      const cancelData = await cancelRes.json();
      if (!cancelRes.ok || !cancelData.success) {
        throw new Error(cancelData.error || "Failed to cancel subscription");
      }
      
      setPlan("free");
      toast.success("Subscription cancelled successfully.");
    } catch (err: any) {
      toast.error(err.message || "An error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const supabase = createClient();

    const getUser = async () => {
      setIsLoadingUser(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingUser(false);
      }
    };

    getUser();
  }, []);

  useEffect(() => {
    if (profileName) {
      setFullName(profileName);
    }
  }, [profileName]);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeTheme = mounted ? (theme === "system" ? resolvedTheme : theme) : undefined;
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Loading...";

  const handleSaveProfile = async () => {
    const nextName = fullName.trim();

    if (!nextName) {
      toast.error("Full name cannot be empty");
      return;
    }

    setIsSaving(true);
    try {
      const supabase = createClient();
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (!currentUser) {
        toast.error("You must be logged in to update your profile");
        return;
      }

      const { error: dbError } = await supabase
        .from("profiles")
        .update({
          full_name: nextName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentUser.id);

      if (dbError) {
        throw dbError;
      }

      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: nextName },
      });

      if (authError) {
        console.warn("Could not sync auth metadata:", authError.message);
      }

      setProfileName(nextName);
      setFullName(nextName);
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred saving your profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResendVerification = async () => {
    if (!user?.email) return;

    setIsResending(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: user.email,
      });

      if (error) {
        toast.error(error.message || "Failed to resend verification email.");
        return;
      }

      toast.success("Verification email resent successfully!");
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred.");
    } finally {
      setIsResending(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        toast.error(error.message || "Failed to update password.");
        return;
      }

      toast.success("Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleDeleteAccount = async () => {
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete account");
      }

      // Clear client session
      const supabase = createClient();
      await supabase.auth.signOut();

      if (typeof window !== "undefined") {
        localStorage.removeItem("guest_consent_state");
      }

      toast.success("Your account has been permanently deleted.");
      setIsDeleteModalOpen(false);
      window.location.href = "/auth/login";
    } catch (err: any) {
      toast.error(err.message || "Failed to delete account. Please try again.");
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirmDelete={handleDeleteAccount}
      />

      <div className="space-y-2">
        <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">
          <Settings className="size-7 text-zinc-500" />
          Settings
        </h1>
        <p className="max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
          Manage your profile, security, and appearance.
        </p>
      </div>

      <div className="space-y-6">
        <Card className="border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <CardHeader className="flex flex-row items-center gap-3 pb-4">
            <div className="flex size-10 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              <User className="size-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-zinc-950 dark:text-white">Profile</CardTitle>
              <CardDescription className="text-zinc-500 dark:text-zinc-400">Update the name used across your account.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoadingUser ? (
              <div className="flex items-center gap-2 py-4 text-sm text-zinc-500">
                <Loader2 className="size-4 animate-spin" />
                Loading profile...
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-[auto,1fr] md:items-start">
                <div className="flex w-full flex-col items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-center dark:border-zinc-800 dark:bg-zinc-900/40 md:w-56">
                  <Avatar className="size-20 border border-zinc-200 dark:border-zinc-800">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xl font-semibold">
                      {(fullName || profileName || user?.email || "U")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-zinc-950 dark:text-white">{fullName || profileName || "User"}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">This avatar follows your display name.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Full Name</label>
                    <Input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={isSaving}
                      className="h-11 border-zinc-200 bg-white text-zinc-950 shadow-sm focus-visible:ring-0 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                      placeholder="Your full name"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/30">
                      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        <Mail className="size-4" />
                        Email Address
                      </div>
                      <p className="break-all text-sm text-zinc-950 dark:text-white">{user?.email || "Loading..."}</p>
                    </div>

                    <div className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/30">
                      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        <Calendar className="size-4" />
                        Member Since
                      </div>
                      <p className="text-sm text-zinc-950 dark:text-white">{memberSince}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                      {user?.email_confirmed_at ? (
                        <>
                          <CheckCircle2 className="size-4 text-emerald-500" />
                          Email verified
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="size-4 text-amber-500" />
                          Verification pending
                        </>
                      )}
                    </div>

                    <Button
                      onClick={handleSaveProfile}
                      disabled={isSaving || !fullName.trim() || fullName.trim() === profileName}
                      className="h-11 rounded-full bg-zinc-950 px-5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-40 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          Saving
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </div>

                  {!user?.email_confirmed_at && (
                    <Button
                      onClick={handleResendVerification}
                      disabled={isResending}
                      variant="ghost"
                      className="h-9 px-0 text-sm font-medium text-zinc-600 hover:bg-transparent hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
                    >
                      {isResending ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          Resending verification email
                        </>
                      ) : (
                        "Resend verification email"
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <CardHeader className="flex flex-row items-center gap-3 pb-4">
            <div className="flex size-10 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              <Shield className="size-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-zinc-950 dark:text-white">Security</CardTitle>
              <CardDescription className="text-zinc-500 dark:text-zinc-400">Protect your account with a strong password.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/30 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-zinc-950 dark:text-white">Change your password</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Update the password for your account.</p>
              </div>
              <Button
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                variant="outline"
                className="h-10 rounded-full border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-950 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900"
              >
                {showPasswordForm ? "Hide form" : "Change Password"}
              </Button>
            </div>

            {showPasswordForm && (
              <form onSubmit={handleChangePassword} className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">New Password</label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isUpdatingPassword}
                      className="h-11 border-zinc-200 bg-white text-zinc-950 shadow-sm focus-visible:ring-0 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Confirm Password</label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isUpdatingPassword}
                      className="h-11 border-zinc-200 bg-white text-zinc-950 shadow-sm focus-visible:ring-0 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={isUpdatingPassword || !newPassword || !confirmPassword}
                  className="h-11 rounded-full bg-zinc-950 px-5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-40 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                >
                  {isUpdatingPassword ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Updating
                    </>
                  ) : (
                    "Save Password"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card className="border border-violet-250/70 bg-white shadow-sm dark:border-violet-500/20 dark:bg-zinc-950 shadow-violet-500/5 dark:shadow-violet-950/10">
          <CardHeader className="flex flex-row items-center gap-3 pb-4">
            <div className="flex size-10 items-center justify-center rounded-full border border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-500/30 dark:bg-violet-950/30 dark:text-violet-300">
              <CreditCard className="size-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-zinc-955 dark:text-white flex items-center gap-2">
                Subscription Plan
                {plan === "pro" && (
                  <span className="inline-flex items-center rounded-full bg-violet-600/10 dark:bg-violet-500/15 px-2.5 py-0.5 text-[10px] font-bold text-violet-750 dark:text-violet-300">
                    PRO Active
                  </span>
                )}
              </CardTitle>
              <CardDescription className="text-zinc-550 dark:text-zinc-400">
                Manage your subscription and premium features.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/30 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-zinc-950 dark:text-white">
                  {plan === "pro" ? "Briefly AI Pro Plan" : "Briefly AI Free Plan"}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {plan === "pro" 
                    ? "Enjoy unlimited summaries, PDF and URL support, and premium exports."
                    : "Up to 10 text summaries per month. Pro features are locked."}
                </p>
              </div>
              <Button
                onClick={handleTogglePlan}
                disabled={isSaving}
                className={cn(
                  "h-10 rounded-full px-5 text-sm font-semibold transition-all duration-300 cursor-pointer",
                  plan === "pro"
                    ? "border border-zinc-200 bg-white text-zinc-755 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
                    : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/10 hover:shadow-violet-500/20"
                )}
              >
                {plan === "pro" ? "Cancel Subscription" : "Upgrade to Pro (₹699)"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <CardHeader className="flex flex-row items-center gap-3 pb-4">
            <div className="flex size-10 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              <Sun className="size-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-zinc-950 dark:text-white">Appearance</CardTitle>
              <CardDescription className="text-zinc-500 dark:text-zinc-400">Choose a light or dark interface.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`flex items-center justify-between rounded-2xl border px-4 py-4 text-left transition-colors ${
                  activeTheme === "light"
                    ? "border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950"
                    : "border-zinc-200 bg-white text-zinc-950 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900"
                }`}
              >
                <span className="flex items-center gap-3 text-sm font-medium">
                  <Sun className="size-4" />
                  Light Mode
                </span>
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex items-center justify-between rounded-2xl border px-4 py-4 text-left transition-colors ${
                  activeTheme === "dark"
                    ? "border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950"
                    : "border-zinc-200 bg-white text-zinc-950 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900"
                }`}
              >
                <span className="flex items-center gap-3 text-sm font-medium">
                  <Moon className="size-4" />
                  Dark Mode
                </span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border border-red-200/80 bg-red-50/20 shadow-sm dark:border-red-900/40 dark:bg-red-950/10">
          <CardHeader className="flex flex-row items-center gap-3 pb-4">
            <div className="flex size-10 items-center justify-center rounded-full border border-red-200 bg-red-100 text-red-600 dark:border-red-900/50 dark:bg-red-950/60 dark:text-red-400">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-red-950 dark:text-red-200">
                Danger Zone
              </CardTitle>
              <CardDescription className="text-red-700/80 dark:text-red-300/70">
                Permanently delete your account and associated data.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col gap-4 rounded-2xl border border-red-200/60 bg-white p-4 dark:border-red-900/30 dark:bg-zinc-950 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-zinc-950 dark:text-white">
                  Delete Account
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Permanently remove your Briefly AI profile, saved summaries, history, and favorites.
                </p>
              </div>
              <Button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                variant="destructive"
                className="h-10 rounded-full px-5 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-all cursor-pointer shrink-0"
              >
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}