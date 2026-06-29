"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { 
  LayoutDashboard, 
  History, 
  Heart, 
  User as UserIcon, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Sparkles,
  Search
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Logged out successfully");
      router.push("/auth/login");
    } catch (err: any) {
      toast.error(err.message || "An error occurred during logout");
    }
  };

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "History", href: "/dashboard/history", icon: History },
    { label: "Favorites", href: "/dashboard/favorites", icon: Heart },
    { label: "Profile", href: "/dashboard/profile", icon: UserIcon },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen w-full bg-black text-white overflow-hidden font-sans">
      <Toaster />
      
      {/* Mobile/Tablet Header */}
      <header className="flex lg:hidden items-center justify-between px-6 py-4 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-md w-full fixed top-0 left-0 right-0 z-40 h-16">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center size-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600">
            <Sparkles className="size-4 text-white" />
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Briefly AI</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-zinc-400 hover:text-white"
          onClick={() => setIsSidebarOpen(true)}
        >
          <Menu className="size-6" />
        </Button>
      </header>

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 flex flex-col w-64 border-r border-zinc-800/60 bg-zinc-950 p-6 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Logo Section */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center size-9 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-lg shadow-indigo-500/20">
              <Sparkles className="size-5 text-white" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Briefly AI</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="lg:hidden text-zinc-400 hover:text-white px-2"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="size-5" />
          </Button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group
                  ${isActive 
                    ? "bg-zinc-900 text-white shadow-inner border border-zinc-800/80" 
                    : "text-zinc-400 hover:bg-zinc-900/40 hover:text-zinc-200"
                  }
                `}
              >
                <Icon className={`size-4 transition-transform group-hover:scale-105 ${isActive ? "text-indigo-400" : "text-zinc-400 group-hover:text-zinc-300"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="border-t border-zinc-800/60 pt-4 mt-auto">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-zinc-400 hover:bg-red-950/20 hover:text-red-400 transition-colors duration-200 cursor-pointer"
          >
            <LogOut className="size-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Navbar */}
        <header className="hidden lg:flex items-center justify-between px-8 py-4 border-b border-zinc-800/40 bg-zinc-950/40 backdrop-blur-md h-20">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-sm font-medium text-zinc-400">
                {user ? `Welcome back,` : "Welcome to Briefly AI"}
              </h2>
              <p className="text-base font-semibold text-white truncate max-w-xs">
                {user?.email || "Explore summaries"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Search Box */}
            <div className="relative w-64 group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-500 group-focus-within:text-zinc-400 transition-colors" />
              <input
                type="text"
                placeholder="Search summaries..."
                className="w-full pl-10 pr-4 py-2 text-sm rounded-lg bg-zinc-900/60 border border-zinc-800/80 outline-none text-white placeholder-zinc-500 focus:border-zinc-700/80 focus:bg-zinc-900 transition-all duration-200"
              />
            </div>

            {/* Avatar & Email Info */}
            <div className="flex items-center gap-3 pl-6 border-l border-zinc-800">
              <div className="text-right">
                <p className="text-xs text-zinc-500">Free Tier</p>
                <p className="text-xs font-semibold text-zinc-300 truncate max-w-[120px]">
                  {user?.email?.split("@")[0] || "User"}
                </p>
              </div>
              <Avatar className="size-9 border border-zinc-800">
                <AvatarImage src="" />
                <AvatarFallback className="bg-gradient-to-tr from-violet-600 to-indigo-600 text-white text-xs font-semibold">
                  {user?.email ? user.email[0].toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Mobile/Tablet Top Padding Spacer */}
        <div className="lg:hidden h-16 shrink-0" />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-zinc-950 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
