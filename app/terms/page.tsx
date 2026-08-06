import Link from "next/link";
import { Sparkles, ArrowLeft, ShieldCheck, FileText, AlertTriangle } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata = {
  title: "Terms of Service - Briefly AI",
  description: "Terms of Service and legal agreements for using Briefly AI.",
};

export default function TermsPage() {
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
            <ShieldCheck className="size-3.5" />
            LEGAL AGREEMENT
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Terms of Service
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Last Updated: August 6, 2026 • Version 1.0
          </p>
        </div>

        {/* Highlighted AI Inaccuracy Disclaimer Card */}
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 sm:p-6 text-amber-900 dark:text-amber-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-base text-amber-800 dark:text-amber-300">
            <AlertTriangle className="size-5 text-amber-500 shrink-0" />
            <span>AI Summarization & Accuracy Disclaimer</span>
          </div>
          <p className="text-xs sm:text-sm leading-relaxed font-medium">
            AI summaries may contain inaccuracies. Users should verify important information before relying on it. Briefly AI is an AI assistance tool and does not guarantee factual accuracy.
          </p>
        </div>

        {/* Terms Sections */}
        <div className="space-y-8 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">1. Acceptance of Terms</h2>
            <p>
              By accessing, browsing, or using Briefly AI (&quot;Service&quot;), you confirm that you have read, understood, and agreed to be bound by these Terms of Service (&quot;Terms&quot;) and our Privacy Policy. If you do not agree to all of these terms, you must not access or use the Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">2. Eligibility & Age Requirement</h2>
            <p>
              You must be at least 13 years of age (or the legal age of digital consent in your jurisdiction) to create an account or use Briefly AI. By continuing to use the Service, you represent and warrant that you meet this age requirement.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">3. User Responsibilities & Prohibited Conduct</h2>
            <p>You agree to use Briefly AI responsibly and lawfully. You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1.5 text-zinc-600 dark:text-zinc-400">
              <li>Upload or submit content that infringes third-party intellectual property or privacy rights.</li>
              <li>Upload malicious code, malware, or content intended to disrupt service availability.</li>
              <li>Attempt to reverse-engineer, decompile, or bypass security features or quota controls.</li>
              <li>Automate excessive request rates exceeding published rate limits or usage tier limits.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">4. AI Output Disclaimer & Accuracy</h2>
            <p>
              Briefly AI processes text, PDF documents, and website URLs using third-party artificial intelligence models (such as Google Gemini). AI-generated outputs (summaries, key points, keywords, and chat responses) are produced probabilistically and may contain factual errors, misinterpretations, or hallucinations.
            </p>
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">
              AI summaries may contain inaccuracies. Users should verify important information before relying on it. Briefly AI is an AI assistance tool and does not guarantee factual accuracy.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">5. Usage Quotas & Subscriptions</h2>
            <p>
              Free accounts are subject to monthly quota limits (including 10 Text Summaries, 2 PDF trial summaries, and 2 URL trial summaries per billing cycle). Quotas reset automatically based on your individual monthly cycle. Briefly AI reserves the right to adjust limits or offer Pro subscription plans.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">6. Intellectual Property</h2>
            <p>
              You retain full ownership of the original text and documents you upload to Briefly AI. Briefly AI retains all rights, title, and interest in and to the platform design, software, branding, and proprietary algorithms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">7. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, Briefly AI shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of data, profits, or revenue arising out of or related to your use of the Service.
            </p>
          </section>

          <section className="space-y-3 border-t border-zinc-200 dark:border-zinc-800 pt-6">
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">8. Contact Us</h2>
            <p>
              If you have any questions or concerns regarding these Terms of Service, please contact us at{" "}
              <a href="mailto:support@briefly.ai" className="text-purple-500 hover:underline">
                support@briefly.ai
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
