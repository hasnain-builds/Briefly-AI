import Link from "next/link";
import { Sparkles, ArrowLeft, Lock, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata = {
  title: "Privacy Policy - Briefly AI",
  description: "Privacy Policy and data protection details for Briefly AI.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FB] dark:bg-black text-zinc-900 dark:text-zinc-100 font-sans selection:bg-purple-600 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-800 bg-[#F5F7FB]/80 dark:bg-black/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex items-center justify-center size-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600">
              <Sparkles className="size-4 text-white" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
              Briefly AI
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="size-4" /> Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 sm:py-16 space-y-10">
        {/* Document Header */}
        <div className="space-y-3 border-b border-zinc-200 dark:border-zinc-800 pb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-400 tracking-wider">
            <Lock className="size-3.5" />
            DATA PROTECTION
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Last Updated: August 6, 2026 • Version 1.0
          </p>
        </div>

        {/* Privacy Sections */}
        <div className="space-y-8 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">1. Information We Collect</h2>
            <p>Briefly AI collects minimal personal data required to operate the application securely:</p>
            <ul className="list-disc pl-6 space-y-1.5 text-zinc-600 dark:text-zinc-400">
              <li><strong>Account Data:</strong> Email address and authentication credentials stored securely via Supabase Auth.</li>
              <li><strong>Usage Content:</strong> Texts, PDF files, and URL links you explicitly submit for AI summarization.</li>
              <li><strong>Consent Records:</strong> Legal agreement version, timestamp, and acceptance status stored in our database.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">2. Use of Essential Cookies</h2>
            <p>
              We use <strong>essential cookies only</strong> to maintain secure user sessions, remember theme preferences, and track legal consent state. We do not use third-party tracking or advertising cookies.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">3. AI Processing & Third Parties</h2>
            <p>
              When you generate a summary, your content is processed via secure API calls to Google Gemini AI. Content submitted is used exclusively for generating your requested summary and is not used to train public models.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">4. Data Storage & Security</h2>
            <p>
              All database records and stored summaries are safeguarded using Row Level Security (RLS) policies in PostgreSQL on Supabase. Your data is strictly accessible only to your authenticated user account.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">5. Your Privacy Rights</h2>
            <p>
              You have the right to access, export, or delete your saved summaries and account data at any time directly through the Briefly AI dashboard settings.
            </p>
          </section>

          <section className="space-y-3 border-t border-zinc-200 dark:border-zinc-800 pt-6">
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">6. Contact Privacy Team</h2>
            <p>
              For privacy inquiries or data requests, contact our team at{" "}
              <a href="mailto:privacy@briefly.ai" className="text-purple-500 hover:underline">
                privacy@briefly.ai
              </a>.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-8 text-center text-xs text-zinc-500">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Briefly AI. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-zinc-900 dark:hover:text-white">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-zinc-900 dark:hover:text-white">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
