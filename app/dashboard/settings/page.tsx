"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Settings, Shield, Bell, Sparkles } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent flex items-center gap-3">
          <Settings className="size-8 text-indigo-400" />
          Settings
        </h1>
        <p className="text-zinc-400">
          Customize your preferences, API integration, and security options.
        </p>
      </div>

      <div className="space-y-4">
        {/* API Settings */}
        <Card className="border border-zinc-800 bg-zinc-950/50 backdrop-blur-md shadow-lg">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Sparkles className="size-5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-white">AI Engine Preferences</CardTitle>
              <CardDescription className="text-zinc-500">Configure summarize options and models.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0 text-sm text-zinc-400">
            Engine is currently configured to use Briefly AI default model (Gemini-1.5-Flash equivalent). Custom key support is coming soon.
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="border border-zinc-800 bg-zinc-950/50 backdrop-blur-md shadow-lg">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400">
              <Shield className="size-5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-white">Security & Password</CardTitle>
              <CardDescription className="text-zinc-500">Manage account authentication details.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0 text-sm text-zinc-400">
            Password update and multi-factor authentication preferences will be manageable in a future release.
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="border border-zinc-800 bg-zinc-950/50 backdrop-blur-md shadow-lg">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Bell className="size-5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-white">Notifications</CardTitle>
              <CardDescription className="text-zinc-500">Choose when and how you receive alerts.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0 text-sm text-zinc-400">
            Manage your digest summaries and weekly analytics email notifications (Coming Soon).
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
