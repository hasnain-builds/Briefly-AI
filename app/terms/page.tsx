import Link from "next/link";
import { Sparkles, ArrowLeft, ShieldCheck, AlertTriangle } from "lucide-react";
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
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">2. Description of the Service</h2>
            <p>
              Briefly AI is an artificial intelligence-powered web application that allows users to process, condense, and generate summaries, key insights, and action items from text content, uploaded PDF documents, and web article URLs.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">3. Eligibility & Age Requirement</h2>
            <p>
              You must be at least 13 years of age (or the legal age of digital consent in your jurisdiction) to create an account or use Briefly AI. By accessing or using the Service, you represent and warrant that you meet this eligibility requirement.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">4. User Accounts & Security</h2>
            <p>
              To access certain features of the Service, you may be required to register for an account using Supabase Authentication. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">5. Acceptable Use & Prohibited Conduct</h2>
            <p>You agree to use Briefly AI responsibly and lawfully. You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1.5 text-zinc-600 dark:text-zinc-400">
              <li>Upload, post, or submit content that infringes third-party intellectual property or privacy rights.</li>
              <li>Upload malicious code, malware, viruses, or content designed to compromise platform security.</li>
              <li>Attempt to reverse-engineer, decompile, crawl, or scrape the platform source code or algorithms.</li>
              <li>Automate excessive request rates that exceed published usage limits or disrupt service availability.</li>
              <li>Use the Service for illegal, fraudulent, or harmful activities.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">6. User Content & Ownership</h2>
            <p>
              You retain full ownership of all original text, PDF files, and URL links you submit to Briefly AI (&quot;User Content&quot;). By submitting User Content, you grant Briefly AI a limited, non-exclusive license strictly to process, analyze, and render your requested AI summaries.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">7. AI-Generated Summaries & Accuracy Disclaimer</h2>
            <p>
              Briefly AI processes content using large language models (such as Google Gemini AI). AI outputs—including summaries, key takeaways, and responses—are generated probabilistically and may contain factual errors, incomplete analysis, or misinterpretations.
            </p>
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">
              AI summaries may contain inaccuracies. Users should verify important information before relying on it. Briefly AI is an AI assistance tool and does not guarantee factual accuracy.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">8. Third-Party Services & Links</h2>
            <p>
              Briefly AI integrates third-party services (such as Google Gemini AI for processing and Supabase for authentication and database storage) and may contain links to third-party web articles. We do not control or assume responsibility for any third-party services, content, or privacy practices.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">9. Intellectual Property</h2>
            <p>
              Briefly AI and its original software code, user interface designs, branding, logos, graphics, and documentation are protected by intellectual property laws. You may not copy, modify, distribute, or create derivative works of the Briefly AI application without prior written permission.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">10. Privacy & Data Protection</h2>
            <p>
              Your privacy is important to us. Our collection, storage, and processing of your personal information and user content are governed by our{" "}
              <Link href="/privacy" className="text-purple-500 hover:underline font-medium">
                Privacy Policy
              </Link>, which is incorporated into these Terms by reference.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">11. Service Availability, Quotas & Subscriptions</h2>
            <p>
              Briefly AI provides both Free and Pro plan options. Free accounts are subject to usage limits and monthly quota resets. We reserve the right to modify, suspend, or discontinue any aspect of the Service, usage quotas, or feature offerings at any time.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">12. Disclaimer of Warranties</h2>
            <p>
              The Service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind, whether express, implied, or statutory. Briefly AI disclaims all warranties, including but not limited to implied warranties of merchantability, fitness for a particular purpose, non-infringement, and accuracy.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">13. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, Briefly AI and its developers shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, data, or goodwill resulting from your use of or inability to use the Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">14. Account Suspension & Termination</h2>
            <p>
              We reserve the right to suspend or terminate your access to Briefly AI at our sole discretion, without prior notice, if we believe you have violated these Terms of Service or engaged in abusive or unlawful behavior.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">15. Changes to the Terms</h2>
            <p>
              We reserve the right to revise or update these Terms of Service at any time. Any changes will become effective immediately upon posting the updated Terms on this page with a revised &quot;Last Updated&quot; date. Your continued use of the Service after changes are posted constitutes your acceptance of the revised Terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">16. Governing Law & Jurisdiction</h2>
            <p>
              These Terms shall be governed by and construed in accordance with applicable laws, without regard to its conflict of law principles. Any legal action or proceeding arising under these Terms shall be resolved in a court of competent jurisdiction.
            </p>
          </section>

          <section className="space-y-3 border-t border-zinc-200 dark:border-zinc-800 pt-6">
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">17. Contact Us</h2>
            <p>
              If you have any questions, feedback, or concerns regarding these Terms of Service, please contact us at{" "}
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

