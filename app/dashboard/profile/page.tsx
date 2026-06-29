"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon, Mail, Calendar, Shield } from "lucide-react";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const createdAtDate = user?.created_at 
    ? new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "June 29, 2026";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent flex items-center gap-3">
          <UserIcon className="size-8 text-indigo-400" />
          Profile
        </h1>
        <p className="text-zinc-400">
          Manage your personal details and account status.
        </p>
      </div>

      <Card className="border border-zinc-800 bg-zinc-950/50 backdrop-blur-md shadow-lg overflow-hidden">
        <CardHeader className="border-b border-zinc-850 bg-zinc-900/10 p-6 flex flex-col md:flex-row items-center gap-6">
          <Avatar className="size-20 border border-zinc-800">
            <AvatarImage src="" />
            <AvatarFallback className="bg-gradient-to-tr from-violet-600 to-indigo-600 text-white text-2xl font-bold">
              {user?.email ? user.email[0].toUpperCase() : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="text-center md:text-left space-y-1">
            <CardTitle className="text-2xl font-bold text-white">
              {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Briefly User"}
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Free Tier Account
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-4 p-4 rounded-xl border border-zinc-850 bg-zinc-900/20">
              <Mail className="size-5 text-zinc-500" />
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Email Address</p>
                <p className="text-sm font-medium text-white">{user?.email || "loading..."}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl border border-zinc-850 bg-zinc-900/20">
              <Calendar className="size-5 text-zinc-500" />
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Member Since</p>
                <p className="text-sm font-medium text-white">{createdAtDate}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl border border-zinc-850 bg-zinc-900/20">
              <Shield className="size-5 text-zinc-500" />
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Account Role</p>
                <p className="text-sm font-medium text-white">Standard User</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
