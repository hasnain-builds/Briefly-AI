"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, createContext, useContext, useRef } from "react";
import { askAIAboutSummaryAction } from "./actions";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useTheme } from "next-themes";
import { 
  LayoutDashboard, 
  History, 
  Heart, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Sparkles,
  Search,
  Loader2,
  BarChart3,
  Monitor,
  Sun,
  Moon
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { ThemeToggle } from "@/components/theme-toggle";
import { PlanGateProvider } from "@/components/shared/plan-gate";
import { LogoutModal } from "@/components/shared/logout-modal";

export interface ChatContextType {
  title: string;
  originalText: string;
  summary: string;
  keyPoints: string[];
  keywords: string[];
}

export const SearchContext = createContext<{
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  profileName: string;
  setProfileName: (name: string) => void;
  chatContext: ChatContextType | null;
  isChatOpen: boolean;
  openChat: (context: ChatContextType) => void;
  closeChat: () => void;
}>({
  searchQuery: "",
  setSearchQuery: () => {},
  profileName: "",
  setProfileName: () => {},
  chatContext: null,
  isChatOpen: false,
  openChat: () => {},
  closeChat: () => {},
});

export const useSearch = () => useContext(SearchContext);
export const useDashboard = () => useContext(SearchContext);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [profileName, setProfileName] = useState("");
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const [chatContext, setChatContext] = useState<ChatContextType | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ sender: "user" | "ai"; text: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const openChat = (context: ChatContextType) => {
    setChatContext(context);
    setIsChatOpen(true);
    setChatMessages([]);
    setChatInput("");
  };

  const closeChat = () => {
    setIsChatOpen(false);
    setChatContext(null);
    setChatMessages([]);
    setChatInput("");
  };

  // Scroll chat messages to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isChatLoading]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !chatContext || isChatLoading) return;

    const userMsg = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { sender: "user", text: userMsg }]);
    setIsChatLoading(true);

    try {
      const result = await askAIAboutSummaryAction(userMsg, {
        originalText: chatContext.originalText,
        summary: chatContext.summary,
        keyPoints: chatContext.keyPoints,
        keywords: chatContext.keywords,
      });

      if (result.success && result.data) {
        setChatMessages(prev => [...prev, { sender: "ai", text: result.data }]);
      } else {
        toast.error(result.error || "Failed to get response from AI");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleSendPrompt = async (promptText: string) => {
    if (!chatContext || isChatLoading) return;
    
    let userMsg = "";
    if (promptText === "Explain Simply") {
      userMsg = "Can you explain this summary simply, like I'm 10 years old?";
    } else if (promptText === "Generate Quiz") {
      userMsg = "Can you generate a quick quiz with 3 multiple-choice questions based on this summary?";
    } else if (promptText === "Translate") {
      userMsg = "Can you translate this summary into Spanish?";
    } else if (promptText === "Key Concepts") {
      userMsg = "What are the most important key concepts and takeaways from this summary?";
    } else if (promptText === "Real-world Example") {
      userMsg = "Can you give a real-life example or application of the topics in this summary?";
    } else {
      userMsg = promptText;
    }

    setChatMessages(prev => [...prev, { sender: "user", text: userMsg }]);
    setIsChatLoading(true);

    try {
      const result = await askAIAboutSummaryAction(userMsg, {
        originalText: chatContext.originalText,
        summary: chatContext.summary,
        keyPoints: chatContext.keyPoints,
        keywords: chatContext.keywords,
      });

      if (result.success && result.data) {
        setChatMessages(prev => [...prev, { sender: "ai", text: result.data }]);
      } else {
        toast.error(result.error || "Failed to get response from AI");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setIsChatLoading(false);
    }
  };

  useEffect(() => {
    const supabase = createClient();
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        // Fetch full_name from profiles table
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();
        
        if (profile?.full_name) {
          setProfileName(profile.full_name);
        } else {
          setProfileName(user.user_metadata?.full_name || user.email?.split("@")[0] || "User");
        }
      }
    };
    getUser();
  }, []);

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleConfirmLogout = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Logged out successfully");
      setIsLogoutModalOpen(false);
      router.push("/auth/login");
    } catch (err: any) {
      toast.error(err.message || "An error occurred during logout");
    }
  };

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "History", href: "/dashboard/history", icon: History },
    { label: "Favorites", href: "/dashboard/favorites", icon: Heart },
    { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  const [searchQuery, setSearchQuery] = useState("");

  return (
    <PlanGateProvider>
      <SearchContext.Provider value={{ searchQuery, setSearchQuery, profileName, setProfileName, chatContext, isChatOpen, openChat, closeChat }}>
        <div className="flex h-screen w-full bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white overflow-hidden font-sans relative">
        <Toaster />
      
      {/* Mobile/Tablet Header */}
      <header className="flex lg:hidden items-center justify-between px-4 sm:px-6 py-3 border-b border-zinc-200 dark:border-zinc-800/60 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md w-full fixed top-0 left-0 right-0 z-40 h-16 gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center justify-center size-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600">
            <Sparkles className="size-4 text-white" />
          </div>
          <span className="font-bold text-base sm:text-lg bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">Briefly AI</span>
        </div>

        {/* Search bar on mobile/tablet */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 outline-none text-zinc-900 dark:text-white placeholder-zinc-400 focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <ThemeToggle />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white size-9 p-0 flex items-center justify-center"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open Navigation Menu"
          >
            <Menu className="size-5" />
          </Button>
        </div>
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
        fixed inset-y-0 left-0 z-50 flex flex-col w-64 border-r border-zinc-200 dark:border-zinc-800/60 bg-white dark:bg-zinc-950 p-6 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Logo Section */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center size-9 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-lg shadow-indigo-500/20">
              <Sparkles className="size-5 text-white" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">Briefly AI</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="lg:hidden text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white px-2"
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
                    ? "bg-zinc-100 text-zinc-900 border border-zinc-200 dark:bg-zinc-900 dark:text-white dark:border-zinc-800/80 shadow-inner" 
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900/40 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }
                `}
              >
                <Icon className={`size-4 transition-transform group-hover:scale-105 ${isActive ? "text-indigo-550 dark:text-indigo-400" : "text-zinc-500 dark:text-zinc-450 group-hover:text-zinc-700 dark:group-hover:text-zinc-300"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="border-t border-zinc-250 dark:border-zinc-800/60 pt-4 mt-auto">
          <button
            type="button"
            onClick={() => setIsLogoutModalOpen(true)}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200 cursor-pointer"
          >
            <LogOut className="size-4" />
            Logout
          </button>
        </div>
      </aside>

      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirmLogout={handleConfirmLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Navbar */}
        <header className="hidden lg:flex items-center justify-between px-8 py-4 border-b border-zinc-200 dark:border-zinc-800/40 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-md h-20">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-sm font-medium text-zinc-500">
                {user ? "Welcome," : "Welcome to Briefly AI"}
              </h2>
              <p className="text-base font-semibold text-zinc-900 dark:text-white truncate max-w-xs">
                {user ? profileName : "Explore summaries"}
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm rounded-lg bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 outline-none text-zinc-900 dark:text-white placeholder-zinc-450 dark:placeholder-zinc-500 focus:border-zinc-300 dark:focus:border-zinc-700/80 focus:bg-white dark:focus:bg-zinc-900 transition-all duration-200"
              />
            </div>

            {/* Desktop Theme Toggle */}
            <ThemeToggle />

            {/* Avatar & Email Info */}
            <div className="flex items-center gap-3 pl-6 border-l border-zinc-200 dark:border-zinc-800">
              <div className="text-right">
                <p className="text-xs text-zinc-500">Free Tier</p>
                <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 truncate max-w-[120px]">
                  {profileName || "User"}
                </p>
              </div>
              <Avatar className="size-9 border border-zinc-200 dark:border-zinc-800">
                <AvatarImage src="" />
                <AvatarFallback className="bg-gradient-to-tr from-violet-600 to-indigo-600 text-white text-xs font-semibold">
                  {profileName ? profileName[0].toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Mobile/Tablet Top Padding Spacer */}
        <div className="lg:hidden h-16 shrink-0" />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950 p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Chat Side Drawer */}
      {isChatOpen && chatContext && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-zinc-950/98 border-l border-zinc-850 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-250">
          {/* Header */}
          <div className="p-4 border-b border-zinc-850 flex items-center justify-between bg-zinc-900/10">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center size-8 rounded bg-gradient-to-tr from-violet-600 to-indigo-600">
                <Sparkles className="size-4 text-white" />
              </div>
              <div className="max-w-[200px]">
                <h3 className="text-sm font-bold text-white leading-none">Ask Briefly AI</h3>
                <p className="text-[10px] text-zinc-500 truncate mt-1">Grounded: {chatContext.title}</p>
              </div>
            </div>
            <Button
              onClick={closeChat}
              variant="ghost"
              size="sm"
              className="text-zinc-400 hover:text-white hover:bg-zinc-900 size-8 p-0 cursor-pointer"
            >
              <X className="size-4" />
            </Button>
          </div>

          {/* Message Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
            {chatMessages.length === 0 ? (
              <div className="flex-1 flex flex-col justify-center items-center text-center space-y-4">
                <Sparkles className="size-10 text-zinc-800 animate-pulse" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-zinc-400">Ask about this summary</p>
                  <p className="text-[10px] text-zinc-500 max-w-[200px] leading-normal">
                    AI responses remain strictly grounded within this summary's context.
                  </p>
                </div>
                
                {/* Suggested prompts */}
                <div className="flex flex-wrap justify-center gap-1.5 pt-4 max-w-xs">
                  {[
                    "Explain Simply",
                    "Generate Quiz",
                    "Translate",
                    "Key Concepts",
                    "Real-world Example"
                  ].map((pText) => (
                    <button
                      key={pText}
                      onClick={() => handleSendPrompt(pText)}
                      className="text-[10px] bg-zinc-900 hover:bg-zinc-850 text-zinc-350 border border-zinc-800 px-3 py-1.5 rounded-full cursor-pointer transition-colors"
                    >
                      {pText}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-indigo-600 text-white self-end rounded-br-none"
                      : "bg-zinc-900 text-zinc-200 border border-zinc-800 self-start rounded-bl-none"
                  }`}
                >
                  {msg.text}
                </div>
              ))
            )}

            {isChatLoading && (
              <div className="bg-zinc-900 text-zinc-400 border border-zinc-800 self-start rounded-xl rounded-bl-none px-3.5 py-2.5 text-xs flex items-center gap-2">
                <Loader2 className="size-3.5 animate-spin text-indigo-400" />
                Thinking...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Form */}
          <form onSubmit={handleChatSubmit} className="p-3 border-t border-zinc-855 bg-zinc-950">
            <div className="flex gap-2">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleChatSubmit(e);
                  }
                }}
                placeholder="Ask AI anything about this summary..."
                className="flex-1 min-h-[40px] max-h-[120px] bg-zinc-900/60 border border-zinc-800 rounded-lg p-2.5 outline-none text-white text-xs resize-none placeholder-zinc-505 focus:border-zinc-700 focus:bg-zinc-900 transition-all"
                rows={1}
              />
              <Button
                type="submit"
                disabled={isChatLoading || !chatInput.trim()}
                className="bg-indigo-650 hover:bg-indigo-600 text-white size-10 rounded-lg flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-40 shadow-md shadow-indigo-500/10"
              >
                <Sparkles className="size-4" />
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
      </SearchContext.Provider>
    </PlanGateProvider>
  );
}
