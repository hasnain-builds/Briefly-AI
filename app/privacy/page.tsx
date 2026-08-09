import Link from "next/link";
import { Sparkles, ArrowLeft, Lock } from "lucide-react";
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
            <p>Briefly AI collects minimal personal information required to deliver and manage the Service:</p>
            <ul className="list-disc pl-6 space-y-1.5 text-zinc-600 dark:text-zinc-400">
              <li><strong>Account Information:</strong> Email address and profile credentials used to create, authenticate, and securely maintain your account.</li>
              <li><strong>Submitted Content:</strong> Texts, PDF documents, and website URLs you explicitly submit for AI summarization.</li>
              <li><strong>Consent Records:</strong> Status, timestamp, and version records of your agreement to our Terms of Service and Privacy Policy.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">2. Use of Essential Cookies & Storage</h2>
            <p>
              We use <strong>essential cookies and local browser storage</strong> strictly to maintain secure user sessions, remember theme preferences, and save legal consent status. We do not use third-party tracking or advertising cookies.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">3. AI Processing & Third Parties</h2>
            <p>
              When you request a summary, the text, documents, or links you submit are securely processed by our artificial intelligence processing provider (Google Gemini) solely for the purpose of generating your requested summary and key insights. Submitted content is used exclusively to fulfill your requests and is not used to train public AI models.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">4. Data Storage & Security</h2>
            <p>
              Your account details and saved content are protected using encrypted connections, secure cloud infrastructure, and access controls designed to ensure your information remains accessible only to your authenticated account.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">5. Your Data & Account Controls</h2>
            <p>
              You can view and update your profile information, manage security settings, and organize your saved summaries directly within your Briefly AI account settings.
            </p>
          </section>

          <section className="space-y-3 border-t border-zinc-200 dark:border-zinc-800 pt-6">
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">6. Contact Privacy Team</h2>
            <p>
              For privacy inquiries or data requests, contact our team at{" "}
              <a href="mailto:hasnain.builds@gmail.com" className="text-purple-500 hover:underline font-medium">
                hasnain.builds@gmail.com
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
            <Link href="/terms" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

