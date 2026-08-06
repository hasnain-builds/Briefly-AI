"use client";

import { useState, type SVGProps } from "react";
import Link from "next/link";
import {
  Sparkles,
  Upload,
  Link as LinkIcon,
  FileText,
  Languages,
  Share2,
  History,
  ChevronDown,
  Menu,
  X,
  ArrowRight,
  Check,
  Clock,
  Tag,
  Lock,
  Globe,
  Star,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

function GithubIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.48 0-.24-.01-1.02-.01-1.85-2.78.52-3.5-.69-3.72-1.33-.12-.33-.64-1.33-1.09-1.6-.37-.2-.9-.7-.01-.72.84-.01 1.44.8 1.64 1.13.97 1.68 2.53 1.21 3.15.92.09-.72.37-1.21.68-1.49-2.37-.28-4.86-1.21-4.86-5.38 0-1.19.41-2.16 1.09-2.92-.11-.28-.47-1.43.11-2.97 0 0 .89-.29 2.92 1.12a9.7 9.7 0 0 1 5.32 0c2.03-1.41 2.92-1.12 2.92-1.12.58 1.54.22 2.69.11 2.97.68.76 1.09 1.73 1.09 2.92 0 4.18-2.5 5.1-4.88 5.37.38.34.72 1.01.72 2.04 0 1.47-.01 2.65-.01 3.02 0 .26.18.59.69.48A10.28 10.28 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}

function LinkedinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M4.98 3.5a2.48 2.48 0 1 0 0 4.96 2.48 2.48 0 0 0 0-4.96ZM3 8.75h3.95V21H3V8.75Zm7.12 0h3.78v1.67h.05c.53-1 1.83-2.06 3.76-2.06 4.02 0 4.76 2.65 4.76 6.1V21h-3.95v-5.74c0-1.37-.02-3.13-1.9-3.13-1.9 0-2.19 1.48-2.19 3.03V21h-3.95V8.75Z" />
    </svg>
  );
}

function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" strokeWidth="1.9" />
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.9" />
      <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" />
    </svg>
  );
}

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const aiFeatures = [
    {
      icon: <FileText className="size-5 text-purple-600 dark:text-purple-400" />,
      title: "Smart Text Summaries",
      description: "Generate concise summaries from long articles and notes.",
      isPro: false,
    },
    {
      icon: <Upload className="size-5 text-purple-600 dark:text-purple-400" />,
      title: "PDF Summarization",
      description: "Upload PDFs up to 100MB and receive AI-generated summaries.",
      isPro: true,
    },
    {
      icon: <Globe className="size-5 text-purple-600 dark:text-purple-400" />,
      title: "Website URL Summaries",
      description: "Paste any article URL and instantly summarize it.",
      isPro: true,
    },
    {
      icon: <Sparkles className="size-5 text-purple-600 dark:text-purple-400" />,
      title: "Ask AI",
      description: "Ask follow-up questions and get contextual AI answers.",
      isPro: true,
    },
    {
      icon: <Share2 className="size-5 text-purple-600 dark:text-purple-400" />,
      title: "Export Summaries",
      description: "Export summaries as PDF, Markdown or TXT.",
      isPro: true,
    },
    {
      icon: <Star className="size-5 text-purple-600 dark:text-purple-400" />,
      title: "Save Favorites",
      description: "Bookmark important summaries for later.",
      isPro: false,
    },
    {
      icon: <History className="size-5 text-purple-600 dark:text-purple-400" />,
      title: "History",
      description: "Access all previous summaries anytime.",
      isPro: false,
    },
    {
      icon: <Zap className="size-5 text-purple-600 dark:text-purple-400" />,
      title: "Lightning Fast",
      description: "Generate summaries within seconds.",
      isPro: false,
    },
    {
      icon: <Clock className="size-5 text-purple-600 dark:text-purple-400" />,
      title: "Time Saved Analytics",
      description: "Track your productivity and estimated reading time saved.",
      isPro: false,
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Paste or Upload",
      description: "Paste your raw text, enter an article URL, or drag and drop a PDF file into the summary dashboard."
    },
    {
      number: "02",
      title: "AI Generates Summary",
      description: "Our advanced Gemini AI quickly analyzes the content to synthesize key insights, takeaways, and keywords."
    },
    {
      number: "03",
      title: "Export or Share",
      description: "Download your beautifully formatted summary or generate a shareable link to collaborate with your team."
    }
  ];

  const faqs = [
    {
      question: "How does Briefly AI generate summaries?",
      answer: "Briefly AI is powered by Google Gemini models. When you provide text, a PDF, or a URL, our system extracts the relevant text and queries Gemini to create structured summaries with main ideas, key bullet points, and relevant tags."
    },
    {
      question: "Is there a limit to document sizes for PDF uploads?",
      answer: "The Free plan supports PDF files up to 10MB in size. The text extraction happens securely, ensuring fast processing times without overloading your browser."
    },
    {
      question: "What is the AI Credit system?",
      answer: "Every summary generated uses 1 AI Credit. When you sign up, you automatically receive 100 free credits to test out all our features (Text, PDF, and URL summarization)."
    },
    {
      question: "Can I export my summaries to other tools?",
      answer: "Yes, you can export your summaries in multiple formats: PDF (for reading offline), Markdown (for Notion, Obsidian, etc.), or plain TXT. You can also copy them directly to your clipboard."
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We care deeply about privacy. Your uploaded files and summarized texts are processed securely through Supabase and are only accessible by you. We do not use your data to train public AI models."
    }
  ];

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const surfaceCardClass = "rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-950/55 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_18px_48px_rgba(15,23,42,0.08)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_20px_55px_rgba(0,0,0,0.45)] backdrop-blur-xl";
  const surfaceCardHoverClass = "transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-zinc-300/90 dark:hover:border-zinc-700/80 hover:shadow-[0_12px_36px_rgba(15,23,42,0.1),0_26px_60px_rgba(15,23,42,0.12)] dark:hover:shadow-[0_18px_45px_rgba(0,0,0,0.5)]";
  const navLinkClass = "relative py-1 text-zinc-600 dark:text-zinc-400 transition-all duration-300 ease-out after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-indigo-600 after:opacity-70 after:transition-all after:duration-300 after:ease-out hover:-translate-y-px hover:text-zinc-950 dark:hover:text-white hover:after:scale-x-100 hover:after:opacity-100";
  const socialButtonClass = "flex size-10 items-center justify-center rounded-full border border-zinc-200 bg-white/90 text-zinc-500 shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600 hover:shadow-md hover:shadow-violet-500/10 active:translate-y-0 active:scale-95 dark:border-zinc-800 dark:bg-zinc-950/90 dark:text-zinc-400 dark:hover:border-violet-500/50 dark:hover:bg-violet-950/30 dark:hover:text-violet-300";
  const sectionHeadingClass = "font-heading text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950 dark:text-white";
  const sectionCopyClass = "text-zinc-600 dark:text-zinc-400 text-base sm:text-lg font-normal leading-relaxed";

  return (
    <div className="min-h-screen bg-[#F5F7FB] dark:bg-black text-zinc-900 dark:text-zinc-100 font-sans selection:bg-indigo-600 selection:text-white transition-colors duration-300">
      {/* Sticky Header / Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-200/80 dark:border-zinc-900/80 bg-[#F5F7FB]/85 dark:bg-black/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex items-center justify-center size-9 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-lg shadow-indigo-500/20">
              <Sparkles className="size-5 text-white" />
            </div>
            <span className="font-heading font-bold text-xl bg-gradient-to-r from-zinc-950 to-zinc-500 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">Briefly AI</span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold">
            <a href="#features" className={navLinkClass}>Features</a>
            <a href="#how-it-works" className={navLinkClass}>How It Works</a>
            <a href="#pricing" className={navLinkClass}>Pricing</a>
            <a href="#faq" className={navLinkClass}>FAQ</a>
          </nav>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            <Link href="/auth/login" className="rounded-lg px-3 py-1.5 text-sm font-semibold text-zinc-600 transition-all duration-300 hover:bg-zinc-100/70 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900/60 dark:hover:text-white">
              Login
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold shadow-[0_8px_22px_rgba(79,70,229,0.18)] hover:shadow-[0_12px_28px_rgba(79,70,229,0.26)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 px-4.5 py-2.5 rounded-lg cursor-pointer">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden rounded-lg p-2 text-zinc-600 transition-all duration-300 hover:bg-zinc-100/70 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900/60 dark:hover:text-white cursor-pointer"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 border-b border-zinc-200 dark:border-zinc-900 bg-white/95 dark:bg-black/95 backdrop-blur-lg px-6 py-6 space-y-4 shadow-xl">
            <nav className="flex flex-col gap-4 text-base font-medium text-zinc-600 dark:text-zinc-400">
              <a
                href="#features"
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                How It Works
              </a>
              <a
                href="#pricing"
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                Pricing
              </a>
              <a
                href="#faq"
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                FAQ
              </a>
            </nav>
            <div className="h-px bg-zinc-200 dark:bg-zinc-900 my-4" />
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-3 py-1 bg-zinc-100/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Theme</span>
                <ThemeToggle />
              </div>
              <div className="h-px bg-zinc-200 dark:bg-zinc-900 my-1" />
              <Link href="/auth/login" onClick={() => setIsMobileMenuOpen(false)} className="w-full text-center py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-medium transition-colors">
                Login
              </Link>
              <Link href="/auth/signup" onClick={() => setIsMobileMenuOpen(false)} className="w-full text-center">
                <Button className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium hover:opacity-90 py-2.5 rounded-lg cursor-pointer">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 sm:pt-28 pb-16 sm:pb-28 overflow-hidden">
        {/* Ambient Gradient Background Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[540px] h-[540px] rounded-full bg-indigo-600/5 dark:bg-indigo-600/10 blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[320px] h-[320px] rounded-full bg-violet-600/5 dark:bg-violet-600/10 blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="font-heading text-3xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-950 via-zinc-800 to-zinc-600 dark:from-white dark:via-zinc-200 dark:to-zinc-500 bg-clip-text text-transparent max-w-4xl mx-auto leading-[1.1] mb-6">
            Summarize Anything in Seconds
          </h1>

          <p className="text-base sm:text-xl text-zinc-700 dark:text-zinc-300 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed font-normal">
            Generate concise summaries from text, PDFs and web articles using AI.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-20">
            <Link href="/auth/signup" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-base px-8 py-6 rounded-xl shadow-[0_14px_35px_rgba(79,70,229,0.18)] hover:shadow-[0_20px_45px_rgba(79,70,229,0.28)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer flex items-center justify-center gap-2">
                Get Started Free
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <a href="#features" className="w-full sm:w-auto">
              <Button variant="ghost" className="w-full sm:w-auto border border-zinc-200/90 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-white/80 dark:hover:bg-zinc-900/60 font-semibold text-base px-8 py-6 rounded-xl hover:scale-[1.02] hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)] active:scale-[0.98] transition-all duration-300 cursor-pointer">
                View Features
              </Button>
            </a>
          </div>

          {/* Interactive Mockup Component */}
          <div className={surfaceCardClass + " relative max-w-4xl mx-auto p-5 sm:p-7"}>
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

            {/* Window controls */}
            <div className="flex items-center gap-1.5 mb-6 border-b border-zinc-100 dark:border-zinc-900 pb-4">
              <div className="size-3 rounded-full bg-red-500/40" />
              <div className="size-3 rounded-full bg-yellow-500/40" />
              <div className="size-3 rounded-full bg-green-500/40" />
              <span className="text-xs text-zinc-400 dark:text-zinc-600 ml-2 font-mono">briefly-ai-summary.pdf</span>
            </div>

            {/* Dashboard Mock Content */}
            <div className="text-left space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-900 pb-4">
                <div>
                  <div className="flex items-center gap-2 text-indigo-650 dark:text-indigo-400 text-xs font-semibold mb-1">
                    <FileText className="size-3.5" />
                    PDF SUMMARY
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">Next-Generation AI Platforms Overview</h3>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200/60 dark:border-zinc-800 text-xs font-semibold text-zinc-650 dark:text-zinc-400 self-start sm:self-center shadow-sm">
                  <Clock className="size-3.5 text-zinc-400 dark:text-zinc-500" />
                  <span>8 mins saved (80% shorter)</span>
                </div>
              </div>

              {/* Bullet Points */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 tracking-wider uppercase">Key Takeaways</h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    <span className="flex items-center justify-center size-5 rounded bg-zinc-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 font-semibold shrink-0 mt-0.5 text-xs border border-zinc-200 dark:border-transparent">1</span>
                    <span>Google Gemini introduces native multimodal intelligence processing text, high-fidelity audio, and video formats natively.</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    <span className="flex items-center justify-center size-5 rounded bg-zinc-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 font-semibold shrink-0 mt-0.5 text-xs border border-zinc-200 dark:border-transparent">2</span>
                    <span>Gemini 1.5 Pro introduces a breakthrough 1 million token context window, enabling deep analysis of massive codebases or files.</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    <span className="flex items-center justify-center size-5 rounded bg-zinc-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 font-semibold shrink-0 mt-0.5 text-xs border border-zinc-200 dark:border-transparent">3</span>
                    <span>Maintains near-perfect retrieval accuracy (99%+) in needle-in-a-haystack testing across the entire contextual length.</span>
                  </li>
                </ul>
              </div>

              {/* Keywords */}
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-900 flex flex-wrap items-center gap-2">
                <Tag className="size-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
                <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mr-1">Keywords:</span>
                {["Gemini Pro", "Multimodal", "Long Context", "Google AI", "Retrieval"].map((kw, i) => (
                  <span key={i} className="text-xs bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-zinc-600 dark:text-zinc-300 px-2.5 py-1 rounded-md border border-zinc-200/60 dark:border-zinc-800 transition-all duration-300 shadow-sm cursor-default">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Powerful AI Features Section */}
      <section id="features" className="py-24 border-t border-zinc-200/80 dark:border-zinc-900/80 bg-zinc-50/70 dark:bg-zinc-950/20 relative">
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] rounded-full bg-violet-600/5 dark:bg-violet-600/10 blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className={sectionHeadingClass + " mb-4"}>
              Powerful AI Features
            </h2>
            <p className={sectionCopyClass}>
              Everything you need to summarize, understand and save time with AI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {aiFeatures.map((feat, idx) => (
              <div
                key={idx}
                className={surfaceCardClass + " " + surfaceCardHoverClass + " p-6 group flex flex-col justify-between relative overflow-hidden border border-zinc-200/80 dark:border-zinc-800/80 hover:border-purple-500/40 dark:hover:border-purple-500/40"}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-purple-500/10 dark:bg-purple-950/30 border border-purple-500/20 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform duration-300">
                      {feat.icon}
                    </div>
                    {feat.isPro && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-[10px] font-bold text-purple-600 dark:text-purple-300 tracking-wider">
                        <Lock className="size-2.5 text-purple-500 dark:text-purple-400" />
                        <span>PRO</span>
                      </span>
                    )}
                  </div>

                  <h3 className="font-heading text-lg font-bold text-zinc-950 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300 flex items-center gap-2">
                    {feat.title}
                  </h3>
                  <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed font-normal">
                    {feat.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 border-t border-zinc-200/80 dark:border-zinc-900/80 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className={sectionHeadingClass + " mb-4"}>
              How It Works
            </h2>
            <p className={sectionCopyClass}>
              Get detailed summaries from any content source in three simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {steps.map((step, idx) => (
              <div key={idx} className="relative group">
                {/* Connector line for desktop */}
                {idx < 2 && (
                  <div className="hidden md:block absolute top-12 left-2/3 w-full h-[1px] border-t border-dashed border-zinc-200 dark:border-zinc-800 z-0" />
                )}

                <div className={surfaceCardClass + " " + surfaceCardHoverClass + " relative z-10 p-8"}>
                  <div className="font-heading text-4xl font-black bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                    {step.number}
                  </div>
                  <h3 className="font-heading text-lg font-bold text-zinc-950 dark:text-white mb-2.5">
                    {step.title}
                  </h3>
                  <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed font-normal">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 border-t border-zinc-200/80 dark:border-zinc-900/80 bg-zinc-50/70 dark:bg-zinc-950/20 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-600/5 blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className={sectionHeadingClass + " mb-4"}>
              Choose Your Briefly AI Plan
            </h2>
            <p className={sectionCopyClass}>
              Start free. Upgrade only when you need more power.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto items-stretch">
            {/* Free Plan */}
            <div className={surfaceCardClass + " " + surfaceCardHoverClass + " p-8 flex flex-col h-full"}>
              <div>
                <h3 className="font-heading text-xl font-bold text-zinc-950 dark:text-white mb-2">Free</h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-6">Perfect for trying Briefly AI.</p>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="font-heading text-4xl font-extrabold text-zinc-950 dark:text-white">₹0</span>
                  <span className="text-zinc-500 dark:text-zinc-500 text-sm font-semibold">/ month</span>
                </div>

                <div className="h-px bg-zinc-200/80 dark:bg-zinc-800 mb-8" />

                <ul className="space-y-3.5 mb-6">
                  {[
                    "10 Text Summaries per month",
                    "Up to 2,000 words per summary",
                    "History",
                    "Favorites",
                    "Light & Dark Theme"
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300 font-medium">
                      <span className="mt-0.5 flex items-center justify-center size-5 rounded-full bg-indigo-50/90 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/50 shrink-0">
                        <Check className="size-3 text-indigo-600 dark:text-indigo-400" />
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <ul className="space-y-3.5 mb-6">
                  {[
                    "PDF Summaries",
                    "Website URL Summaries",
                    "Ask AI Assistant",
                    "Export (PDF, Markdown, TXT)",
                    "Share Summaries"
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-zinc-400 dark:text-zinc-600 font-medium">
                      <span className="mt-0.5 flex items-center justify-center size-5 rounded-full bg-zinc-100/80 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shrink-0">
                        <X className="size-3 text-zinc-400 dark:text-zinc-600" />
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

              </div>

              <Link href="/auth/signup" className="w-full mt-auto">
                <Button className="w-full bg-zinc-950 border border-zinc-950 text-white hover:bg-zinc-900 dark:bg-zinc-900 dark:hover:bg-zinc-850 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 py-3 rounded-xl font-semibold shadow-[0_8px_20px_rgba(15,23,42,0.18)] hover:shadow-[0_12px_26px_rgba(15,23,42,0.24)] cursor-pointer">
                  Get Started Free
                </Button>
              </Link>
            </div>

            {/* Premium Plan */}
            <div className={surfaceCardClass + " " + surfaceCardHoverClass + " p-8 flex flex-col h-full relative border-violet-300/70 dark:border-violet-500/40 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_38px_rgba(139,92,246,0.18)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_18px_42px_rgba(76,29,149,0.45)]"}>
              <div className="absolute -top-3 right-6">
                <span className="inline-flex items-center rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-1 text-[10px] font-bold tracking-wide text-white shadow-md">
                  MOST POPULAR
                </span>
              </div>

              <div>
                <h3 className="font-heading text-xl font-bold text-zinc-950 dark:text-white mb-2">Pro</h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-6">Unlimited AI summarization and premium features for professionals.</p>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="font-heading text-4xl font-extrabold text-zinc-950 dark:text-white">₹399</span>
                  <span className="text-zinc-500 dark:text-zinc-500 text-sm font-semibold">/ month</span>
                </div>

                <div className="h-px bg-zinc-200/80 dark:bg-zinc-800 mb-8" />

                <ul className="space-y-3.5 mb-8">
                  {[
                    "Unlimited Text Summaries",
                    "Unlimited PDF Summaries (up to 100MB)",
                    "Unlimited Website URL Summaries",
                    "Unlimited Ask AI Assistant",
                    "Unlimited Export (PDF, Markdown, TXT)",
                    "Unlimited Share Summaries",
                    "Faster AI Processing",
                    "Priority Support"
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300 font-medium">
                      <span className="mt-0.5 flex items-center justify-center size-5 rounded-full bg-indigo-50/90 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/50 shrink-0">
                        <Check className="size-3 text-indigo-600 dark:text-indigo-400" />
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link href="/auth/signup" className="w-full mt-auto">
                <Button className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold shadow-[0_10px_24px_rgba(79,70,229,0.24)] hover:shadow-[0_14px_30px_rgba(79,70,229,0.34)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 py-3 rounded-xl cursor-pointer">
                  Upgrade to Premium
                </Button>
              </Link>
            </div>
          </div>

          <div className={surfaceCardClass + " mt-10 overflow-hidden max-w-5xl mx-auto"}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200/80 dark:border-zinc-800">
                    <th className="text-left px-5 py-4 font-heading text-zinc-950 dark:text-white">Feature</th>
                    <th className="text-left px-5 py-4 font-heading text-zinc-950 dark:text-white">Free</th>
                    <th className="text-left px-5 py-4 font-heading text-zinc-950 dark:text-white">Premium</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Text Summaries", "10/month", "Unlimited"],
                    ["Max Words", "2,000", "Unlimited"],
                    ["PDF Summaries", "✖", "✔"],
                    ["URL Summaries", "✖", "✔"],
                    ["TXT Upload", "✖", "✔"],
                    ["PDF Upload", "✖", "Up to 100 MB"],
                    ["Export PDF", "✖", "✔"],
                    ["Export TXT", "✖", "✔"],
                    ["Export Markdown", "✖", "✔"],
                    ["Priority Processing", "✖", "✔"],
                    ["Premium Support", "✖", "✔"]
                  ].map((row, idx) => (
                    <tr key={idx} className="border-b border-zinc-200/70 dark:border-zinc-900/70 last:border-0 hover:bg-zinc-50/70 dark:hover:bg-zinc-900/30 transition-colors">
                      <td className="px-5 py-3.5 text-zinc-700 dark:text-zinc-300 font-medium">{row[0]}</td>
                      <td className="px-5 py-3.5 text-zinc-600 dark:text-zinc-400">{row[1]}</td>
                      <td className="px-5 py-3.5 text-zinc-900 dark:text-zinc-100 font-semibold">{row[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 border-t border-zinc-200/80 dark:border-zinc-900/80 relative">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className={sectionHeadingClass + " mb-4"}>
              Frequently Asked Questions
            </h2>
            <p className={sectionCopyClass}>
              Have questions? We have answers. If you need further help, please reach out.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className={surfaceCardClass + " " + surfaceCardHoverClass + " overflow-hidden group"}
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between p-6 text-left font-heading font-semibold text-zinc-950 dark:text-white hover:text-indigo-650 dark:hover:text-indigo-400 hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40 transition-all duration-300 cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown className={`size-4 text-zinc-400 dark:text-zinc-500 shrink-0 transition-transform duration-300 group-hover:text-indigo-650 dark:group-hover:text-indigo-400 ${isOpen ? "rotate-180 text-indigo-650 dark:text-indigo-400" : ""}`} />
                  </button>
                  <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                    <div className="overflow-hidden">
                      <div className={`border-t border-zinc-100/80 dark:border-zinc-900/60 px-6 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 transition-all duration-300 ${isOpen ? "pb-6 pt-2 opacity-100" : "pb-0 pt-0 opacity-0"}`}>
                        {faq.answer}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200/80 dark:border-zinc-900/80 py-12 bg-[#F5F7FB] dark:bg-black">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo & Copyright */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center size-7 rounded bg-gradient-to-tr from-violet-600 to-indigo-600">
                <Sparkles className="size-4 text-white" />
              </div>
              <span className="font-heading font-bold text-zinc-950 dark:text-white">Briefly AI</span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              © {new Date().getFullYear()} Briefly AI. Built by Hasnain Sheikh.
            </p>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/hasnain-builds"
              target="_blank"
              rel="noopener noreferrer"
              className={socialButtonClass}
              aria-label="GitHub"
            >
              <GithubIcon className="size-5" />
            </a>
            <a
              href="https://www.linkedin.com/in/hasnainbuilds/"
              target="_blank"
              rel="noopener noreferrer"
              className={socialButtonClass}
              aria-label="LinkedIn"
            >
              <LinkedinIcon className="size-5" />
            </a>
            <a
              href="https://instagram.com/hasnain.learn"
              target="_blank"
              rel="noopener noreferrer"
              className={socialButtonClass}
              aria-label="Instagram"
            >
              <InstagramIcon className="size-5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
