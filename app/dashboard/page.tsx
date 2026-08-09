"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import NextLink from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  Upload,
  Trash2,
  Eye,
  BookOpen,
  Clock,
  Coins,
  FileText,
  TrendingUp,
  X,
  CheckCircle2,
  Tag,
  Loader2,
  Heart,
  Copy,
  FileDown,
  Share2,
  FileCode,
  Search,
  Link2,
  Star,
  Activity,
  Zap,
  ArrowRight,
  Lock,
  History as HistoryIcon
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  generateAndSaveSummaryAction,
  fetchAllSummariesAction,
  deleteSummaryAction,
  toggleFavoriteSummaryAction,
  extractTextFromURLAction,
  fetchProfileUsageAction,
  submitUserFeedbackAction,
  setFeedbackReminderAction,
  checkUserFeedbackStatusAction
} from "./actions";
import { SummaryRecord, UsageInfo } from "@/types";
import { extractTextFromPDF, PDFExtractionProgress } from "@/services/pdf";
import { exportToPDF, exportToMarkdown, exportToTxt, shareSummaryContent } from "@/lib/export";
import { useSearch, useDashboard } from "./layout";
import { GatedButton, usePlanGate } from "@/components/shared/plan-gate";
import { FeedbackModal } from "@/components/shared/feedback-modal";
import { cn } from "@/lib/utils";

interface SummaryView {
  title: string;
  summary: string;
  keyPoints: string[];
  keywords: string[];
  readingTimeSaved: string;
  date: string;
  source_url?: string;
  filename?: string;
}

interface ActivityItem {
  id: string;
  text: string;
  timestamp: Date;
}

const getSummaryTitle = (summaryText: string) => {
  const firstSentence = summaryText.split(/[.!?]/)[0].trim();
  if (firstSentence) {
    const words = firstSentence.split(/\s+/);
    if (words.length > 7) {
      return words.slice(0, 7).join(" ") + "...";
    }
    return firstSentence + ".";
  }
  return summaryText.slice(0, 40) + "...";
};

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [text, setText] = useState("");

  useEffect(() => {
    const authSuccess = searchParams.get("auth_success");
    if (authSuccess) {
      if (authSuccess === "signup") {
        toast.success("Welcome to Briefly AI! Your account has been created.");
      } else {
        toast.success("Successfully logged in!");
      }
      // Remove query parameters from URL
      const newUrl = window.location.pathname;
      router.replace(newUrl);
    }
  }, [searchParams, router]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [summaries, setSummaries] = useState<SummaryRecord[]>([]);
  const [currentSummary, setCurrentSummary] = useState<SummaryView | null>(null);
  const [outputLanguage, setOutputLanguage] = useState("Auto Detect");
  const { searchQuery } = useSearch();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPendingAction, setIsPendingAction] = useState(false);
  const { openChat, closeChat } = useDashboard();

  // PDF upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState<PDFExtractionProgress | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [pdfPageCount, setPdfPageCount] = useState<number | null>(null);

  // URL state
  const [urlInput, setUrlInput] = useState("");

  // Input tab selection
  const [activeTab, setActiveTab] = useState<"text" | "pdf" | "url">("text");

  // Recent Activities
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  const [usageInfo, setUsageInfo] = useState<UsageInfo>({
    plan: "free",
    textUsage: 0,
    textLimit: 10,
    pdfUsage: 0,
    pdfLimit: 2,
    urlUsage: 0,
    urlLimit: 2,
    monthlyUsage: 0,
    monthlyLimit: 10,
    usageResetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    remaining: 10,
  });

  // Smart Feedback Management Engine
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [hasSkippedFeedbackThisSession, setHasSkippedFeedbackThisSession] = useState(false);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasTriggeredFeedbackThisSessionRef = useRef<boolean>(false);

  // Clean up feedback delay timer on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  const evaluateFeedbackEligibility = useCallback((currentCount: number) => {
    // 1. Check if feedback is already completed (DB or localStorage)
    if (usageInfo.feedbackCompleted || (typeof window !== "undefined" && localStorage.getItem("briefly_feedback_completed") === "true")) {
      return;
    }

    // 2. Minimum threshold: at least 3 successful summaries
    if (currentCount < 3) {
      return;
    }

    // 3. Single-session lock: never ask more than once per browser session
    if (typeof window !== "undefined") {
      if (sessionStorage.getItem("briefly_feedback_shown_session") === "true") {
        return;
      }
    }

    // 4. In-memory ref lock to prevent race conditions or duplicate triggers
    if (hasTriggeredFeedbackThisSessionRef.current) {
      return;
    }

    // 5. Cooldown check: 24-hour dismissal cooldown
    if (typeof window !== "undefined") {
      const dismissedAt = localStorage.getItem("briefly_feedback_dismissed_at");
      if (dismissedAt) {
        const elapsed = Date.now() - parseInt(dismissedAt, 10);
        if (elapsed < 24 * 60 * 60 * 1000) {
          return;
        }
      }
    }

    // 6. DB reminder threshold check
    const remindAfter = usageInfo.feedbackRemindAfter ?? 0;
    if (remindAfter > 0 && currentCount < remindAfter) {
      return;
    }

    // Reached eligibility! Mark session lock & schedule natural UX delay (2.5s buffer)
    hasTriggeredFeedbackThisSessionRef.current = true;
    if (typeof window !== "undefined") {
      sessionStorage.setItem("briefly_feedback_shown_session", "true");
    }

    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }

    feedbackTimeoutRef.current = setTimeout(() => {
      setIsFeedbackModalOpen(true);
    }, 2500);
  }, [usageInfo.feedbackCompleted, usageInfo.feedbackRemindAfter]);

  const handleFeedbackSubmit = async (rating: number, feedbackText: string) => {
    try {
      const res = await submitUserFeedbackAction(rating, feedbackText);
      if (res.success) {
        toast.success("Thank you for helping improve Briefly AI ❤️");
        if (typeof window !== "undefined") {
          localStorage.setItem("briefly_feedback_completed", "true");
        }
        setUsageInfo((prev) => ({ ...prev, feedbackCompleted: true }));
        setIsFeedbackModalOpen(false);
      } else {
        toast.error(res.error || "Failed to submit feedback.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to submit feedback.");
    }
  };

  const handleFeedbackRemindLater = async () => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("briefly_feedback_dismissed_at", Date.now().toString());
      sessionStorage.setItem("briefly_feedback_shown_session", "true");
    }
    setIsFeedbackModalOpen(false);
    const targetCount = summaries.length + 5;
    setUsageInfo((prev) => ({ ...prev, feedbackRemindAfter: targetCount }));
    await setFeedbackReminderAction(targetCount);
  };

  const handleFeedbackSkip = () => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("briefly_feedback_dismissed_at", Date.now().toString());
      sessionStorage.setItem("briefly_feedback_shown_session", "true");
    }
    setHasSkippedFeedbackThisSession(true);
    setIsFeedbackModalOpen(false);
  };

  const loadUsage = async () => {
    try {
      const res = await fetchProfileUsageAction();
      if (res.success && res.data) {
        setUsageInfo(res.data);
      }

      // Authoritative database check against public.feedback table
      const fbRes = await checkUserFeedbackStatusAction();
      if (fbRes.success && fbRes.feedbackCompleted) {
        if (typeof window !== "undefined") {
          localStorage.setItem("briefly_feedback_completed", "true");
        }
        setUsageInfo((prev) => ({ ...prev, feedbackCompleted: true }));
      }
    } catch (err) {
      console.error("Failed to load profile usage info:", err);
    }
  };

  useEffect(() => {
    loadUsage();
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { plan, openUpgradeModal } = usePlanGate();

  // Filter loaded summaries based on searchQuery (instant client-side search)
  const filteredSummaries = summaries.filter((item) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const title = (item.title || item.page_title || getSummaryTitle(item.summary) || "").toLowerCase();
    const summary = (item.summary || "").toLowerCase();

    let keywordsStr = "";
    if (item.keywords) {
      if (Array.isArray(item.keywords)) {
        keywordsStr = item.keywords.join(" ").toLowerCase();
      } else {
        try {
          const parsedKws = JSON.parse(item.keywords as any);
          if (Array.isArray(parsedKws)) {
            keywordsStr = parsedKws.join(" ").toLowerCase();
          }
        } catch (e) {
          // ignore
        }
      }
    }

    return title.includes(query) || summary.includes(query) || keywordsStr.includes(query);
  });

  // Load summaries on mount
  useEffect(() => {
    loadSummaries();
  }, []);

  const loadSummaries = async () => {
    setIsLoadingHistory(true);
    try {
      await loadUsage();
      const result = await fetchAllSummariesAction();
      if (result.success && result.data) {
        const loaded = result.data;
        setSummaries(loaded);

        // Seed activities from summaries
        const initialActivities: ActivityItem[] = [];
        loaded.slice(0, 5).forEach((item) => {
          const title = item.title || item.page_title || getSummaryTitle(item.summary);
          initialActivities.push({
            id: `create-${item.id}`,
            text: `Created ${item.source_type ? item.source_type.toUpperCase() : "Text"} summary: "${title}"`,
            timestamp: new Date(item.created_at)
          });
          if (item.favorite) {
            initialActivities.push({
              id: `fav-${item.id}`,
              text: `Favorited "${title}"`,
              timestamp: new Date(new Date(item.created_at).getTime() + 1000)
            });
          }
        });
        setActivities(
          initialActivities
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, 5)
        );
      } else if (!result.success) {
        toast.error(result.error || "Failed to load recent summaries");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred loading summaries");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const logActivity = (actionText: string) => {
    setActivities(prev => [
      { id: `act-${Date.now()}-${Math.random()}`, text: actionText, timestamp: new Date() },
      ...prev
    ].slice(0, 5));
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // Calculations for current input
  const activeText = activeTab === "pdf" ? extractedText : text;
  const wordCount = activeTab === "url"
    ? (urlInput.trim() === "" ? 0 : 250) // placeholder for URL length estimate
    : (activeText.trim() === "" ? 0 : activeText.trim().split(/\s+/).length);
  const estimatedReadingTime = Math.ceil(wordCount / 200);

  // Client-side computed overview stats
  const totalSummaries = summaries.length;
  const favoriteSummaries = summaries.filter((s) => s.favorite).length;
  const pdfsSummarized = summaries.filter((s) => s.source_type === "pdf").length;
  const urlsSummarized = summaries.filter((s) => s.source_type === "url").length;
  const textSummaries = summaries.filter((s) => s.source_type === "text").length;
  const totalMinutesSaved = summaries.reduce((acc, item) => acc + (item.reading_time_saved || 0), 0);
  const hoursSaved = (totalMinutesSaved / 60).toFixed(1);
  const creditsRemaining = Math.max(0, 100 - totalSummaries);

  // Summary breakdown values (percentages)
  const textPercent = totalSummaries > 0 ? Math.round((textSummaries / totalSummaries) * 100) : 0;
  const pdfPercent = totalSummaries > 0 ? Math.round((pdfsSummarized / totalSummaries) * 100) : 0;
  const urlPercent = totalSummaries > 0 ? Math.round((urlsSummarized / totalSummaries) * 100) : 0;

  // Monthly productivity card calculation
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlySummaries = summaries.filter(s => new Date(s.created_at) >= startOfMonth);
  const summariesCreatedThisMonth = monthlySummaries.length;
  const timeSavedThisMonth = monthlySummaries.reduce((acc, item) => acc + (item.reading_time_saved || 0), 0);
  const averageSummaryLengthThisMonth = monthlySummaries.length > 0
    ? Math.round(monthlySummaries.reduce((acc, item) => acc + (item.summary ? item.summary.trim().split(/\s+/).length : 0), 0) / monthlySummaries.length)
    : 0;

  const sourceCounts = monthlySummaries.reduce((acc, item) => {
    const src = item.source_type || "text";
    acc[src] = (acc[src] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  let mostUsedSourceThisMonth = "None";
  let maxCount = 0;
  Object.entries(sourceCounts).forEach(([src, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostUsedSourceThisMonth = src === "text" ? "Text Input" : src === "pdf" ? "PDF File" : "URL Link";
    }
  });

  const textSummariesThisMonth = monthlySummaries.filter((item) => item.source_type === "text").length;
  const isTextFreeLimitReached = plan === "free" && textSummariesThisMonth >= 10;

  // Quick Action triggers
  const triggerNewTextSummary = () => {
    setActiveTab("text");
    setText("");
    setSelectedFile(null);
    setExtractedText(null as any);
    setPdfPageCount(null);
    setExtractionProgress(null);
    toast.success("Ready for text summary!");
  };

  const triggerSummarizeUrl = () => {
    setActiveTab("url");
    setUrlInput("");
    toast.success("Ready for URL summary!");
  };

  const triggerUploadPdf = () => {
    setActiveTab("pdf");
    fileInputRef.current?.click();
  };

  const handleGenerateSummary = async () => {
    closeChat();

    if (activeTab !== "text" && plan === "free") {
      openUpgradeModal();
      return;
    }

    if (isTextFreeLimitReached) {
      openUpgradeModal();
      return;
    }

    let textToSummarize = "";
    let sourceType = "text";
    let sourceUrl: string | undefined = undefined;
    let pageTitle: string | undefined = undefined;

    if (activeTab === "pdf") {
      textToSummarize = extractedText;
      sourceType = "pdf";
      if (!textToSummarize.trim()) {
        toast.error("Please upload and extract a PDF file first.");
        return;
      }
    } else if (activeTab === "url") {
      if (!urlInput.trim()) {
        toast.error("Please enter a URL.");
        return;
      }
      setIsGenerating(true);
      try {
        const extResult = await extractTextFromURLAction(urlInput.trim());
        if (!extResult.success || !extResult.data) {
          toast.error(extResult.error || "Failed to extract text from URL.");
          setIsGenerating(false);
          return;
        }
        textToSummarize = extResult.data.text;
        pageTitle = extResult.data.title;
        sourceUrl = urlInput.trim();
        sourceType = "url";
      } catch (err: any) {
        toast.error(err.message || "Failed to extract text from URL.");
        setIsGenerating(false);
        return;
      }
    } else {
      textToSummarize = text;
      sourceType = "text";
      if (!textToSummarize.trim()) {
        toast.error("Please enter some text.");
        return;
      }
    }

    setIsGenerating(true);
    try {
      const result = await generateAndSaveSummaryAction(
        textToSummarize,
        outputLanguage,
        sourceType,
        sourceUrl,
        pageTitle
      );

      if (!result.success || !result.data) {
        if (result.code === "LIMIT_REACHED") {
          openUpgradeModal("limit_reached", result.usageResetAt);
          toast.error("You've reached your monthly limit of 10 free summaries.");
          return;
        }
        if (result.code === "PRO_REQUIRED") {
          openUpgradeModal("pro_feature");
          toast.error(result.error || "Unlock Briefly AI Pro to use this feature.");
          return;
        }
        toast.error(result.error || "Failed to generate summary");
        return;
      }

      const record = result.data;
      toast.success("Summary generated and saved successfully!");
      loadUsage();

      const keyPoints = Array.isArray(record.key_points)
        ? record.key_points
        : JSON.parse((record.key_points as any) || "[]");

      const keywords = Array.isArray(record.keywords)
        ? record.keywords
        : JSON.parse((record.keywords as any) || "[]");

      const finalTitle = record.title || record.page_title || selectedFile?.name || getSummaryTitle(record.summary);

      setCurrentSummary({
        title: finalTitle,
        summary: record.summary,
        keyPoints,
        keywords,
        readingTimeSaved: record.reading_time_saved + " minutes",
        date: formatDate(record.created_at),
        source_url: record.source_url || undefined,
        filename: selectedFile?.name || undefined,
      });

      logActivity(`Created ${sourceType.toUpperCase()} summary: "${finalTitle}"`);

      // Clear states
      setText("");
      setSelectedFile(null);
      setExtractedText("");
      setPdfPageCount(null);
      setExtractionProgress(null);
      setUrlInput("");

      await loadSummaries();

      // Smart, non-intrusive feedback eligibility evaluation
      evaluateFeedbackEligibility(summaries.length + 1);
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Only PDF files are accepted.");
      return;
    }

    const maxPdfSize = plan === "pro" ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxPdfSize) {
      if (plan === "free") {
        openUpgradeModal();
      } else {
        toast.error("Maximum file size for Pro is 100 MB.");
      }
      return;
    }

    setSelectedFile(file);
    setIsExtracting(true);
    setExtractedText("");
    setPdfPageCount(null);

    try {
      const result = await extractTextFromPDF(file, (progress) => {
        setExtractionProgress(progress);
      });
      setExtractedText(result.text);
      setPdfPageCount(result.pageCount);
      toast.success("Text extracted successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to extract text from PDF.");
      setSelectedFile(null);
      setExtractedText("");
      setPdfPageCount(null);
      setExtractionProgress(null);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleClearPdf = () => {
    setSelectedFile(null);
    setExtractedText("");
    setPdfPageCount(null);
    setExtractionProgress(null);
    closeChat();
  };

  const handleView = (item: SummaryRecord) => {
    const keyPoints = Array.isArray(item.key_points)
      ? item.key_points
      : JSON.parse((item.key_points as any) || "[]");

    const keywords = Array.isArray(item.keywords)
      ? item.keywords
      : JSON.parse((item.keywords as any) || "[]");

    setCurrentSummary({
      title: item.title || item.page_title || (item.source_type === "pdf" ? "PDF Document Summary" : getSummaryTitle(item.summary)),
      summary: item.summary,
      keyPoints,
      keywords,
      readingTimeSaved: item.reading_time_saved + " minutes",
      date: formatDate(item.created_at),
      source_url: item.source_url || undefined,
      filename: item.source_type === "pdf" ? (item.title || item.page_title || "PDF Document") : undefined,
    });

    const element = document.getElementById("summary-viewer");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleToggleFavorite = async (id: string, isFavorite: boolean) => {
    const item = summaries.find(s => s.id === id);
    if (!item) return;
    const title = item.title || item.page_title || getSummaryTitle(item.summary);

    try {
      setSummaries(prev => prev.map(s => s.id === id ? { ...s, favorite: isFavorite } : s));
      logActivity(`${isFavorite ? "Favorited" : "Unfavorited"} "${title}"`);

      const result = await toggleFavoriteSummaryAction(id, isFavorite);
      if (!result.success) {
        setSummaries(prev => prev.map(s => s.id === id ? { ...s, favorite: !isFavorite } : s));
        toast.error(result.error || "Failed to update favorite status");
      } else {
        toast.success(isFavorite ? "Added to favorites!" : "Removed from favorites!");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    }
  };

  const confirmDeleteSummary = (id: string) => {
    setDeletingId(id);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    const deletedItem = summaries.find(s => s.id === deletingId);
    setIsPendingAction(true);
    try {
      const result = await deleteSummaryAction(deletingId);
      if (result.success) {
        toast.success("Summary deleted successfully!");

        if (deletedItem) {
          const title = deletedItem.title || deletedItem.page_title || getSummaryTitle(deletedItem.summary);
          logActivity(`Deleted "${title}"`);
          if (currentSummary && currentSummary.title === title) {
            setCurrentSummary(null);
          }
        }

        setSummaries(prev => prev.filter(item => item.id !== deletingId));
      } else {
        toast.error(result.error || "Failed to delete summary");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setIsPendingAction(false);
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Recent";
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Hero Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight lg:text-4xl bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-200 dark:to-zinc-500 bg-clip-text text-transparent">
          Summarize Anything with AI
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl text-base lg:text-lg">
          Paste articles, blogs, reports or upload PDFs and get concise AI-powered summaries instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Left Section (Generator & Recent Summaries) */}
        <div className="xl:col-span-8 space-y-8">
          {/* Summary Input Card */}
          <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/50 backdrop-blur-md shadow-md dark:shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 via-transparent to-transparent opacity-50 pointer-events-none" />

            <CardHeader className="pb-2">
              <div className="flex justify-between items-center flex-wrap gap-3">
                <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="size-4 text-indigo-400" />
                  What would you like to summarize?
                </CardTitle>
                {/* Custom Source Tabs */}
                <div
                  role="tablist"
                  aria-label="Summary mode selection"
                  className="inline-flex items-center gap-1 p-1 rounded-xl bg-zinc-100/90 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-md shadow-xs max-w-full overflow-x-auto scrollbar-none"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "text"}
                    onClick={() => setActiveTab("text")}
                    className={cn(
                      "h-7.5 px-3 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-all duration-200 ease-out cursor-pointer select-none whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50",
                      activeTab === "text"
                        ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs font-semibold border border-zinc-200/60 dark:border-zinc-700/60"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/40"
                    )}
                  >
                    <FileText className="size-3.5 shrink-0 opacity-80" />
                    <span>Text</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "pdf"}
                    onClick={() => setActiveTab("pdf")}
                    className={cn(
                      "h-7.5 px-3 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-all duration-200 ease-out cursor-pointer select-none whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50",
                      activeTab === "pdf"
                        ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs font-semibold border border-zinc-200/60 dark:border-zinc-700/60"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/40"
                    )}
                  >
                    <Upload className="size-3.5 shrink-0 opacity-80" />
                    <span>PDF</span>
                    {plan === "free" && (
                      <Lock className="size-3 text-zinc-400 opacity-80 shrink-0 ml-0.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "url"}
                    onClick={() => setActiveTab("url")}
                    className={cn(
                      "h-7.5 px-3 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-all duration-200 ease-out cursor-pointer select-none whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50",
                      activeTab === "url"
                        ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs font-semibold border border-zinc-200/60 dark:border-zinc-700/60"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/40"
                    )}
                  >
                    <Link2 className="size-3.5 shrink-0 opacity-80" />
                    <span>URL</span>
                    {plan === "free" && (
                      <Lock className="size-3 text-zinc-400 opacity-80 shrink-0 ml-0.5" />
                    )}
                  </button>
                </div>
              </div>
              <CardDescription className="text-zinc-550 dark:text-zinc-500 mt-1">
                {activeTab === "text" && "Paste raw text or notes below."}
                {activeTab === "pdf" && "Upload and summarize document contents."}
                {activeTab === "url" && "Enter a website article link."}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                accept=".pdf"
                className="hidden"
                onChange={handlePdfUpload}
              />

              {activeTab === "pdf" && (
                <div>
                  {selectedFile ? (
                    <div className="border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg p-6 bg-zinc-50 dark:bg-zinc-900/10 flex flex-col items-center justify-center text-center space-y-4 relative min-h-[220px]">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClearPdf}
                        disabled={isGenerating || isExtracting}
                        className="absolute top-2 right-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer h-8 w-8 p-0"
                      >
                        <X className="size-4" />
                      </Button>

                      <div className="p-4 rounded-full bg-indigo-500/10 text-indigo-400">
                        {isExtracting ? (
                          <Loader2 className="size-8 animate-spin text-indigo-400" />
                        ) : (
                          <FileText className="size-8 text-indigo-400" />
                        )}
                      </div>

                      <div className="space-y-1 max-w-md">
                        <h3 className="font-semibold text-zinc-900 dark:text-white truncate px-4">{selectedFile.name}</h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {formatBytes(selectedFile.size)} • {pdfPageCount !== null ? `${pdfPageCount} pages` : "Analyzing PDF..."}
                        </p>
                      </div>

                      {isExtracting && (
                        <div className="w-full max-w-xs space-y-2">
                          <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                            <span>Extracting readable text...</span>
                            <span>
                              {extractionProgress
                                ? Math.round((extractionProgress.currentPage / (extractionProgress.totalPages || 1)) * 100)
                                : 0}%
                            </span>
                          </div>
                          <div className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-full h-1.5 overflow-hidden border border-zinc-200 dark:border-zinc-850">
                            <div
                              className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${extractionProgress
                                  ? (extractionProgress.currentPage / (extractionProgress.totalPages || 1)) * 100
                                  : 0
                                  }%`,
                              }}
                            />
                          </div>
                          <p className="text-[10px] text-zinc-500">
                            Page {extractionProgress?.currentPage || 0} of {extractionProgress?.totalPages || 0}
                          </p>
                        </div>
                      )}

                      {!isExtracting && extractedText && (
                        <div className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900/30 px-3 py-1 rounded-full animate-pulse">
                          <CheckCircle2 className="size-3.5" />
                          Ready for summarization
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border border-dashed border-zinc-200 dark:border-zinc-800 hover:border-zinc-350 dark:hover:border-zinc-700 rounded-lg p-10 bg-zinc-50/50 dark:bg-zinc-900/5 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/10 flex flex-col items-center justify-center text-center space-y-4 relative min-h-[220px] cursor-pointer transition-all group shadow-sm"
                    >
                      <div className="p-4 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-550 dark:text-zinc-450 group-hover:scale-105 transition-transform shadow-sm">
                        <Upload className="size-8 text-zinc-500 dark:text-zinc-400" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-semibold text-zinc-900 dark:text-white">Click to Upload PDF</h3>
                        <p className="text-xs text-zinc-500">Supported up to 20MB</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "url" && (
                <div className="space-y-4 min-h-[220px] flex flex-col justify-center">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider">Website URL</label>
                    <Input
                      type="url"
                      placeholder="https://example.com/article-url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      disabled={isGenerating}
                      className="bg-white dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus-visible:border-zinc-300 dark:focus-visible:border-zinc-700 focus-visible:ring-1 focus-visible:ring-indigo-500/20 text-sm h-11"
                    />
                  </div>
                  <p className="text-xs text-zinc-550 dark:text-zinc-500 leading-normal">
                    Paste the link of any blog post, news story, or online article. Briefly AI will fetch the contents and build a clean summary.
                  </p>
                </div>
              )}

              {activeTab === "text" && (
                <Textarea
                  placeholder="Paste your article here..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  disabled={isGenerating}
                  className="min-h-[220px] bg-white dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus-visible:border-zinc-300 dark:focus-visible:border-zinc-700 focus-visible:ring-1 focus-visible:ring-indigo-500/20 text-base"
                />
              )}

              {/* Status and Actions row */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-zinc-200 dark:border-zinc-900/40">
                <div className="flex items-center gap-4 text-xs text-zinc-550 dark:text-zinc-400">
                  <span className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 px-2.5 py-1 rounded-md text-zinc-750 dark:text-zinc-400 font-medium">
                    <strong>{wordCount}</strong> estimated words
                  </span>
                  {wordCount > 0 && (
                    <span className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 px-2.5 py-1 rounded-md flex items-center gap-1.5 text-zinc-750 dark:text-zinc-400 font-medium">
                      <Clock className="size-3 text-zinc-500" />
                      ~{estimatedReadingTime} min read
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {activeTab === "pdf" && !selectedFile && (
                    <GatedButton
                      type="button"
                      variant="outline"
                      locked
                      className="h-10 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 text-zinc-650 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer flex items-center gap-2 disabled:opacity-50 shadow-sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="size-4" />
                      Choose File
                    </GatedButton>
                  )}

                  <select
                    value={outputLanguage}
                    onChange={(e) => setOutputLanguage(e.target.value)}
                    disabled={isGenerating || isExtracting}
                    className="h-10 px-3 py-2 text-sm rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 outline-none focus:border-zinc-300 dark:focus:border-zinc-700 transition cursor-pointer disabled:opacity-50 shadow-sm"
                  >
                    <option value="Auto Detect">Auto Detect</option>
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Marathi">Marathi</option>
                    <option value="Urdu">Urdu</option>
                    <option value="French">French</option>
                    <option value="Spanish">Spanish</option>
                    <option value="German">German</option>
                    <option value="Japanese">Japanese</option>
                    <option value="Korean">Korean</option>
                  </select>

                  <GatedButton
                    type="button"
                    onClick={handleGenerateSummary}
                    locked={activeTab !== "text" || isTextFreeLimitReached}
                    disabled={isGenerating || isExtracting || (activeTab === "text" && !text.trim()) || (activeTab === "pdf" && !extractedText.trim()) || (activeTab === "url" && !urlInput.trim())}
                    className="h-10 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-colors font-semibold px-5 flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="size-4 text-current animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-4 text-current" />
                        Generate
                      </>
                    )}
                  </GatedButton>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Summary Result Viewer */}
          {currentSummary && (
            <Card id="summary-viewer" className="border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950/70 backdrop-blur-md shadow-md dark:shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-30 pointer-events-none" />

              <CardHeader className="pb-3 border-b border-zinc-200 dark:border-zinc-850 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="size-4 text-indigo-400 shrink-0" />
                    <span className="truncate">{currentSummary.title || "AI Summary Results"}</span>
                  </CardTitle>
                  <CardDescription className="text-zinc-550 dark:text-zinc-500">
                    Generated summary with key takeaways.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCurrentSummary(null);
                    closeChat();
                  }}
                  className="text-zinc-550 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer h-8 w-8 p-0"
                >
                  <X className="size-4" />
                </Button>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* Summary Paragraph */}
                <div className="space-y-2">
                  <h3 className="text-xs text-zinc-500 dark:text-zinc-450 uppercase tracking-wider font-semibold">Summary Overview</h3>
                  <p className="text-zinc-850 dark:text-zinc-200 text-sm leading-relaxed">{currentSummary.summary}</p>
                </div>

                {/* Key Points */}
                {currentSummary.keyPoints && currentSummary.keyPoints.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs text-zinc-500 dark:text-zinc-450 uppercase tracking-wider font-semibold">Key Takeaways</h3>
                    <ul className="space-y-2">
                      {currentSummary.keyPoints.map((point, index) => (
                        <li key={index} className="flex items-start gap-2.5 text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed">
                          <CheckCircle2 className="size-4 text-indigo-500 shrink-0 mt-0.5" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Keywords & Reading Time Saved */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-850">
                  {currentSummary.keywords && currentSummary.keywords.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      {currentSummary.keywords.map((kw, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2.5 py-0.5 rounded-full"
                        >
                          <Tag className="size-2.5 text-zinc-500" />
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}

                  {currentSummary.readingTimeSaved && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-755 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-250 dark:border-emerald-900/50 px-3 py-1.5 rounded-lg">
                      <Clock className="size-3.5" />
                      Estimated Time Saved: ~{currentSummary.readingTimeSaved}
                    </div>
                  )}
                </div>

                {/* Action Buttons Row */}
                <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-850">
                                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(currentSummary.summary);
                        toast.success("Summary copied to clipboard!");
                        logActivity(`Copied Summary: "${currentSummary.title}"`);
                      } catch {
                        toast.error("Failed to copy summary.");
                      }
                    }}
                    className="h-9 rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/60 dark:hover:bg-zinc-850 cursor-pointer flex items-center gap-1.5 text-xs transition-all duration-200 shadow-2xs"
                  >
                    <Copy className="size-3.5 text-emerald-500 shrink-0" />
                    Copy
                  </Button>

                  <GatedButton
                    type="button"
                    variant="outline"
                    size="sm"
                    locked
                    onClick={() => {
                      try {
                        exportToPDF(currentSummary);
                        toast.success("PDF exported successfully!");
                        logActivity(`Exported PDF for "${currentSummary.title}"`);
                      } catch (err: any) {
                        toast.error(err.message || "Failed to export PDF.");
                      }
                    }}
                    className="h-9 rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/60 dark:hover:bg-zinc-850 cursor-pointer flex items-center gap-1.5 text-xs transition-all duration-200 shadow-2xs"
                  >
                    <FileDown className="size-3.5 shrink-0" />
                    Export PDF
                  </GatedButton>

                  <GatedButton
                    type="button"
                    variant="outline"
                    size="sm"
                    locked
                    onClick={() => {
                      try {
                        exportToMarkdown(currentSummary);
                        toast.success("Markdown exported successfully!");
                        logActivity(`Exported Markdown for "${currentSummary.title}"`);
                      } catch (err: any) {
                        toast.error(err.message || "Failed to export Markdown.");
                      }
                    }}
                    className="h-9 rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/60 dark:hover:bg-zinc-850 cursor-pointer flex items-center gap-1.5 text-xs transition-all duration-200 shadow-2xs"
                  >
                    <FileCode className="size-3.5 shrink-0" />
                    Export MD
                  </GatedButton>

                  <GatedButton
                    type="button"
                    variant="outline"
                    size="sm"
                    locked
                    onClick={() => {
                      try {
                        exportToTxt(currentSummary);
                        toast.success("TXT exported successfully!");
                        logActivity(`Exported TXT for "${currentSummary.title}"`);
                      } catch (err: any) {
                        toast.error(err.message || "Failed to export TXT.");
                      }
                    }}
                    className="h-9 rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/60 dark:hover:bg-zinc-850 cursor-pointer flex items-center gap-1.5 text-xs transition-all duration-200 shadow-2xs"
                  >
                    <FileDown className="size-3.5 shrink-0" />
                    Export TXT
                  </GatedButton>

                  <GatedButton
                    type="button"
                    variant="outline"
                    size="sm"
                    locked
                    onClick={() => openChat({
                      title: currentSummary.title || "AI Summary",
                      summary: currentSummary.summary,
                      originalText: activeText || currentSummary.summary,
                      keyPoints: currentSummary.keyPoints || [],
                      keywords: currentSummary.keywords || []
                    })}
                    className="h-9 rounded-xl border-indigo-200/80 dark:border-indigo-900/60 bg-indigo-50/60 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100/60 dark:hover:bg-indigo-900/40 hover:text-indigo-800 dark:hover:text-indigo-300 cursor-pointer flex items-center gap-1.5 text-xs font-semibold mr-auto shadow-2xs"
                  >
                    <Sparkles className="size-3.5 shrink-0" />
                    Ask AI
                  </GatedButton>

                  <GatedButton
                    type="button"
                    variant="outline"
                    size="sm"
                    locked
                    onClick={async () => {
                      try {
                        const res = await shareSummaryContent(currentSummary);
                        if (res === "copied") {
                          toast.success("Shareable summary copied to clipboard!");
                          logActivity(`Shared Summary: "${currentSummary.title}"`);
                        }
                      } catch (err: any) {
                        if (err.name !== "AbortError") {
                          toast.error("Failed to share summary.");
                        }
                      }
                    }}
                    className="h-9 rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/60 dark:hover:bg-zinc-850 cursor-pointer flex items-center gap-1.5 text-xs sm:ml-auto shadow-2xs"
                  >
                    <Share2 className="size-3.5 shrink-0" />
                    Share
                  </GatedButton>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Summaries Section */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Clock className="size-5 text-indigo-400" />
                Recent Summaries
              </h2>
            </div>

            {isLoadingHistory ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
                {[1, 2].map((i) => (
                  <Card key={i} className="border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950/20 shadow-md dark:shadow-lg p-5 space-y-4">
                    <div className="space-y-2">
                      <div className="h-4 bg-zinc-100 dark:bg-zinc-850 rounded w-3/4"></div>
                      <div className="h-3 bg-zinc-50 dark:bg-zinc-900 rounded w-1/4"></div>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-3 bg-zinc-50 dark:bg-zinc-900 rounded w-16"></div>
                      <div className="h-3 bg-zinc-50 dark:bg-zinc-900 rounded w-16"></div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : summaries.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 border border-dashed border-zinc-200 dark:border-zinc-850 rounded-xl bg-white dark:bg-zinc-950/20 text-center shadow-sm">
                <FileText className="size-10 text-zinc-400 mb-3" />
                <p className="text-zinc-700 dark:text-zinc-400 font-medium">No summaries yet.</p>
                <p className="text-zinc-500 dark:text-zinc-550 text-xs mt-1">Generate your first AI summary.</p>
              </div>
            ) : filteredSummaries.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 border border-dashed border-zinc-200 dark:border-zinc-850 rounded-xl bg-white dark:bg-zinc-950/20 text-center shadow-sm">
                <Search className="size-10 text-zinc-400 mb-3" />
                <p className="text-zinc-700 dark:text-zinc-400 font-medium">No summaries found.</p>
                <p className="text-zinc-500 dark:text-zinc-550 text-xs mt-1">Try searching for a different keyword or title.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredSummaries.map((item) => {
                  const wc = item.original_text ? item.original_text.trim().split(/\s+/).length : 0;
                  const itemTitle = item.title || item.page_title || getSummaryTitle(item.summary);
                  return (
                    <Card
                      key={item.id}
                      className="border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950/40 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-all duration-300 group shadow-md dark:shadow-lg"
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate flex-1" title={itemTitle}>
                            {itemTitle}
                          </CardTitle>
                          {item.favorite && (
                            <Heart className="size-4 text-rose-500 fill-rose-500 shrink-0 mt-0.5" />
                          )}
                        </div>
                        <CardDescription className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-2 mt-0.5">
                          {formatDate(item.created_at)}
                          {item.source_type === "text" && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-emerald-605 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/30 px-1.5 py-0.2 rounded">
                              Text
                            </span>
                          )}
                          {item.source_type === "pdf" && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/30 px-1.5 py-0.2 rounded">
                              PDF
                            </span>
                          )}
                          {item.source_type === "url" && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-violet-600 bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900/30 px-1.5 py-0.2 rounded">
                              URL
                            </span>
                          )}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="pb-4">
                        <div className="flex items-center gap-3 text-xs text-zinc-550 dark:text-zinc-400">
                          <span className="flex items-center gap-1">
                            <FileText className="size-3 text-zinc-400 dark:text-zinc-650" />
                            {wc} words
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="size-3 text-zinc-400 dark:text-zinc-655" />
                            Saved: {item.reading_time_saved} minutes
                          </span>
                        </div>
                      </CardContent>

                      <CardFooter className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-900/20 px-4 py-2.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(item)}
                          disabled={isPendingAction}
                          className="h-8 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-xs cursor-pointer flex items-center gap-1 px-2.5"
                        >
                          <Eye className="size-3.5" />
                          View
                        </Button>

                        <div className="flex items-center gap-1.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleFavorite(item.id, !item.favorite)}
                            disabled={isPendingAction}
                            className={`h-8 text-xs cursor-pointer flex items-center gap-1 px-2.5 ${item.favorite
                                ? "text-rose-500 hover:text-rose-450 hover:bg-rose-950/10"
                                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/30"
                              }`}
                          >
                            <Heart className={`size-3.5 ${item.favorite ? "fill-rose-500 text-rose-500" : "text-zinc-400"}`} />
                            <span className="hidden sm:inline">{item.favorite ? "Starred" : "Star"}</span>
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => confirmDeleteSummary(item.id)}
                            disabled={isPendingAction}
                            className="h-8 text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs cursor-pointer flex items-center gap-1 px-2.5"
                          >
                            <Trash2 className="size-3.5" />
                            <span className="hidden sm:inline">Delete</span>
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Section (Analytics Suite Dashboard) */}
        <div className="xl:col-span-4 space-y-6">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="size-5 text-indigo-400" />
            Analytics Dashboard
          </h2>

          {/* Quick Actions Card */}
          <Card className="border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950/40 backdrop-blur-md shadow-md p-5 space-y-4">
            <h3 className="text-xs text-zinc-500 dark:text-zinc-450 uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <Zap className="size-3.5 text-indigo-400" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Button
                onClick={triggerNewTextSummary}
                variant="outline"
                className="h-9 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white justify-start text-[11px] px-2.5 cursor-pointer shadow-sm"
              >
                <FileText className="size-3.5 text-emerald-455 mr-1.5 shrink-0" />
                Text Input
              </Button>
              <GatedButton
                onClick={triggerSummarizeUrl}
                variant="outline"
                locked
                className="h-9 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white justify-start text-[11px] px-2.5 cursor-pointer shadow-sm"
              >
                <Link2 className="size-3.5 text-violet-500 mr-1.5 shrink-0" />
                Summarize URL
              </GatedButton>
              <GatedButton
                onClick={triggerUploadPdf}
                variant="outline"
                locked
                className="h-9 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white justify-start text-[11px] px-2.5 cursor-pointer shadow-sm"
              >
                <Upload className="size-3.5 text-indigo-500 mr-1.5 shrink-0" />
                Upload PDF
              </GatedButton>
              <Button
                onClick={() => router.push("/dashboard/favorites")}
                variant="outline"
                className="h-9 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white justify-start text-[11px] px-2.5 cursor-pointer shadow-sm"
              >
                <Heart className="size-3.5 text-rose-500 mr-1.5 shrink-0" />
                Favorites
              </Button>
              <Button
                onClick={() => router.push("/dashboard/history")}
                variant="outline"
                className="h-9 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white justify-start text-[11px] px-2.5 col-span-2 cursor-pointer flex items-center justify-between shadow-sm"
              >
                <span className="flex items-center">
                  <HistoryIcon className="size-3.5 text-zinc-500 dark:text-zinc-400 mr-1.5 shrink-0" />
                  View All History
                </span>
                <ArrowRight className="size-3 text-zinc-500" />
              </Button>
            </div>
          </Card>

          {/* Core Analytics Metrics (Grid format for overview stats) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4">
            {/* Total Summaries */}
            <Card className="border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950/30 backdrop-blur-md shadow-md p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <FileText className="size-4.5" />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">Total Summaries</p>
                  <p className="text-xl font-bold text-zinc-900 dark:text-white mt-0.5">{totalSummaries}</p>
                </div>
              </div>
              <span className="text-[10px] bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 rounded-full text-zinc-600 dark:text-zinc-500 font-medium">Live</span>
            </Card>

            {/* Favorite Summaries */}
            <Card className="border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950/30 backdrop-blur-md shadow-md p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-450">
                  <Heart className="size-4.5" />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">Favorites</p>
                  <p className="text-xl font-bold text-zinc-900 dark:text-white mt-0.5">{favoriteSummaries}</p>
                </div>
              </div>
            </Card>

            {/* Reading Time Saved */}
            <Card className="border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950/30 backdrop-blur-md shadow-md p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-455">
                  <BookOpen className="size-4.5" />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">Time Saved</p>
                  <p className="text-xl font-bold text-zinc-900 dark:text-white mt-0.5">{hoursSaved} <span className="text-xs text-zinc-550 dark:text-zinc-500 font-normal">hrs</span></p>
                </div>
              </div>
            </Card>

            {/* Monthly Usage Analytics Card */}
            <Card className="border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950/40 backdrop-blur-md p-4 sm:p-5 rounded-xl shadow-xs hover:border-purple-500/30 dark:hover:border-purple-500/30 transition-all duration-200 ease-out group flex flex-col justify-between">
              <div>
                {/* Top Row: Icon + Title Left, Large Bold Number Right */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0">
                      <Zap className="size-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        Monthly Usage
                      </p>
                      <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                        Text Summaries Used
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight leading-none">
                      {plan === "pro" ? "Unlimited" : `${usageInfo.monthlyUsage} / 10`}
                    </p>
                    <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mt-1">
                      {plan === "pro" ? "Pro Plan" : `${Math.max(0, 10 - usageInfo.monthlyUsage)} summaries left`}
                    </p>
                  </div>
                </div>

                {/* Progress Bar & Subtext */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between items-center text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                    <span>Usage</span>
                    <span>{plan === "pro" ? "100%" : `${Math.min(100, Math.round((usageInfo.monthlyUsage / 10) * 100))}%`}</span>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-full h-[6px] overflow-hidden border border-zinc-200/60 dark:border-zinc-800">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500 ease-out",
                        plan === "pro" || usageInfo.monthlyUsage <= 6
                          ? "bg-purple-600"
                          : usageInfo.monthlyUsage <= 8
                          ? "bg-amber-500"
                          : usageInfo.monthlyUsage === 9
                          ? "bg-orange-500"
                          : "bg-red-500"
                      )}
                      style={{ width: plan === "pro" ? "100%" : `${Math.min(100, Math.max(0, (usageInfo.monthlyUsage / 10) * 100))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Footer Reset Date */}
              <div className="mt-3.5 pt-2.5 border-t border-zinc-100 dark:border-zinc-850 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                <span className="font-medium">Next Reset</span>
                <span className="text-zinc-700 dark:text-zinc-300 font-semibold">
                  {(() => {
                    try {
                      return new Date(usageInfo.usageResetAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                    } catch {
                      return "Monthly";
                    }
                  })()}
                </span>
              </div>
            </Card>
          </div>

          {/* Breakdown percentages */}
          <Card className="border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950/30 backdrop-blur-md shadow-md p-5 space-y-4">
            <h3 className="text-xs text-zinc-550 dark:text-zinc-500 uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <Activity className="size-3.5 text-indigo-400" />
              Summary Breakdown
            </h3>
            <div className="space-y-3.5">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold">
                  <span className="text-zinc-650 dark:text-zinc-400">Text Summaries</span>
                  <span className="text-emerald-600 dark:text-emerald-450">{textPercent}% ({textSummaries})</span>
                </div>
                <div className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-full h-1.5 overflow-hidden border border-zinc-200 dark:border-zinc-850">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${textPercent}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold">
                  <span className="text-zinc-655 dark:text-zinc-400">PDFs Summarized</span>
                  <span className="text-indigo-600 dark:text-indigo-455">{pdfPercent}% ({pdfsSummarized})</span>
                </div>
                <div className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-full h-1.5 overflow-hidden border border-zinc-200 dark:border-zinc-850">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${pdfPercent}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold">
                  <span className="text-zinc-655 dark:text-zinc-400">URLs Summarized</span>
                  <span className="text-violet-605 dark:text-violet-400">{urlPercent}% ({urlsSummarized})</span>
                </div>
                <div className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-full h-1.5 overflow-hidden border border-zinc-200 dark:border-zinc-850">
                  <div className="bg-violet-500 h-full rounded-full" style={{ width: `${urlPercent}%` }} />
                </div>
              </div>
            </div>
          </Card>

          {/* Productivity Card */}
          <Card className="border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950/30 backdrop-blur-md shadow-md p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs text-zinc-550 dark:text-zinc-500 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <TrendingUp className="size-3.5 text-indigo-400" />
                Productivity Metrics
              </h3>
              <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950/50 text-indigo-650 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/30 px-2 py-0.5 rounded font-semibold shadow-sm">This Month</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-850 p-2.5 rounded-lg space-y-0.5 shadow-sm">
                <p className="text-[10px] text-zinc-500 font-medium">Created</p>
                <p className="text-base font-bold text-zinc-900 dark:text-white">{summariesCreatedThisMonth}</p>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-850 p-2.5 rounded-lg space-y-0.5 shadow-sm">
                <p className="text-[10px] text-zinc-500 font-medium">Time Saved</p>
                <p className="text-base font-bold text-zinc-900 dark:text-white">{timeSavedThisMonth} <span className="text-[10px] font-normal text-zinc-500 dark:text-zinc-400">mins</span></p>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-850 p-2.5 rounded-lg space-y-0.5 shadow-sm">
                <p className="text-[10px] text-zinc-500 font-medium">Avg Length</p>
                <p className="text-base font-bold text-zinc-900 dark:text-white">{averageSummaryLengthThisMonth} <span className="text-[10px] font-normal text-zinc-500 dark:text-zinc-400">wds</span></p>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-850 p-2.5 rounded-lg space-y-0.5 shadow-sm">
                <p className="text-[10px] text-zinc-500 font-medium">Favorite Source</p>
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 truncate mt-1">{mostUsedSourceThisMonth}</p>
              </div>
            </div>
          </Card>

          {/* Recent Activity Card */}
          <Card className="border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950/30 backdrop-blur-md shadow-md p-5 space-y-4">
            <h3 className="text-xs text-zinc-550 dark:text-zinc-500 uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <Clock className="size-3.5 text-indigo-400" />
              Recent Activity
            </h3>
            {activities.length === 0 ? (
              <p className="text-xs text-zinc-500">No recent activity.</p>
            ) : (
              <div className="space-y-3">
                {activities.map((act) => (
                  <div key={act.id} className="flex items-start justify-between gap-3 text-[11px] border-b border-zinc-200 dark:border-zinc-900/50 pb-2 last:border-0 last:pb-0">
                    <span className="text-zinc-700 dark:text-zinc-300 font-medium truncate max-w-[200px]" title={act.text}>
                      {act.text}
                    </span>
                    <span className="text-[9px] text-zinc-500 shrink-0 mt-0.5">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="max-w-md w-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/90 backdrop-blur-md shadow-2xl p-6 space-y-6">
            <CardHeader className="p-0">
              <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-white">Delete Summary?</CardTitle>
              <CardDescription className="text-zinc-500 dark:text-zinc-400 text-sm mt-2">
                Are you sure you want to delete this summary? This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => setDeletingId(null)}
                disabled={isPendingAction}
                className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 h-9 px-4 text-sm cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={isPendingAction}
                className="bg-red-650 hover:bg-red-650/80 text-white font-medium flex items-center gap-1.5 h-9 px-4 text-sm cursor-pointer"
              >
                {isPendingAction && <Loader2 className="size-3.5 animate-spin" />}
                Delete
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* User Feedback Modal */}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        onSubmit={handleFeedbackSubmit}
        onRemindLater={handleFeedbackRemindLater}
        onSkip={handleFeedbackSkip}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex h-full w-full items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="size-8 animate-spin text-zinc-400" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
