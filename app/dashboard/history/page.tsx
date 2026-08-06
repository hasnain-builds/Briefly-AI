"use client";

import { useState, useEffect } from "react";
import {
  History as HistoryIcon,
  Search,
  X,
  FileText,
  Clock,
  Heart,
  Trash2,
  Eye,
  Loader2,
  Copy,
  FileDown,
  Share2,
  FileCode,
  Sparkles,
  Tag,
  MoreVertical
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  fetchAllSummariesAction,
  deleteSummaryAction,
  toggleFavoriteSummaryAction
} from "../actions";
import { SummaryRecord } from "@/types";
import { exportToPDF, exportToMarkdown, exportToTxt, shareSummaryContent } from "@/lib/export";
import { useSearch, useDashboard } from "../layout";
import { GatedButton, usePlanGate } from "@/components/shared/plan-gate";
import { cn } from "@/lib/utils";

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

export default function HistoryPage() {
  const { plan, openUpgradeModal } = usePlanGate();
  const [summaries, setSummaries] = useState<SummaryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { searchQuery } = useSearch();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPendingAction, setIsPendingAction] = useState(false);
  const [viewingSummary, setViewingSummary] = useState<SummaryRecord | null>(null);
  const { openChat, closeChat } = useDashboard();

  // Filter & Sorting state
  const [filterType, setFilterType] = useState<"all" | "text" | "pdf" | "url">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  useEffect(() => {
    loadSummaries();
  }, []);

  const loadSummaries = async () => {
    setIsLoading(true);
    try {
      const result = await fetchAllSummariesAction();
      if (result.success && result.data) {
        setSummaries(result.data);
      } else if (!result.success) {
        toast.error(result.error || "Failed to load summaries");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFavorite = async (id: string, isFavorite: boolean) => {
    try {
      setSummaries(prev => prev.map(item => item.id === id ? { ...item, favorite: isFavorite } : item));
      if (viewingSummary && viewingSummary.id === id) {
        setViewingSummary(prev => prev ? { ...prev, favorite: isFavorite } : null);
      }

      const result = await toggleFavoriteSummaryAction(id, isFavorite);
      if (!result.success) {
        setSummaries(prev => prev.map(item => item.id === id ? { ...item, favorite: !isFavorite } : item));
        if (viewingSummary && viewingSummary.id === id) {
          setViewingSummary(prev => prev ? { ...prev, favorite: !isFavorite } : null);
        }
        toast.error(result.error || "Failed to update favorite status");
      } else {
        toast.success(isFavorite ? "Added to favorites!" : "Removed from favorites!");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setIsPendingAction(true);
    try {
      const result = await deleteSummaryAction(deletingId);
      if (result.success) {
        toast.success("Summary deleted successfully.");
        if (viewingSummary && viewingSummary.id === deletingId) {
          setViewingSummary(null);
        }
        setSummaries(prev => prev.filter(item => item.id !== deletingId));
        setDeletingId(null);
      } else {
        toast.error(result.error || "Failed to delete summary");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setIsPendingAction(false);
    }
  };

  // Client-side search and filters
  const filteredAndSortedSummaries = summaries
    .filter((item) => {
      // 1. Search Query filter (instantly client-side)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const title = (item.title || item.page_title || getSummaryTitle(item.summary) || "").toLowerCase();
        const summary = (item.summary || "").toLowerCase();

        let keywordsStr = "";
        if (item.keywords) {
          if (Array.isArray(item.keywords)) {
            keywordsStr = item.keywords.join(" ").toLowerCase();
          } else {
            try {
              const parsed = JSON.parse(item.keywords as any);
              if (Array.isArray(parsed)) {
                keywordsStr = parsed.join(" ").toLowerCase();
              }
            } catch { }
          }
        }

        const matchesSearch = title.includes(query) || summary.includes(query) || keywordsStr.includes(query);
        if (!matchesSearch) return false;
      }

      // 2. Source Type filter
      if (filterType !== "all" && item.source_type !== filterType) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      // 4. Sort order
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortBy === "newest" ? dateB - dateA : dateA - dateB;
    });

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    } catch {
      return "Recent";
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Summary copied to clipboard!");
    } catch {
      toast.error("Failed to copy summary");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#111827] dark:bg-gradient-to-r dark:from-white dark:via-zinc-200 dark:to-zinc-500 dark:bg-clip-text dark:text-transparent flex items-center gap-3">
            <HistoryIcon className="size-8 text-indigo-600 dark:text-indigo-400" />
            History
          </h1>
          <p className="text-[#4B5563] dark:text-zinc-400">
            View and manage all your AI-generated summaries.
          </p>
        </div>
      </div>

      {/* Filter and Sort Pills Row */}
      {!isLoading && summaries.length > 0 && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-50 dark:bg-zinc-900/10 border border-[#D1D5DB] dark:border-zinc-900/60 p-4 rounded-xl backdrop-blur-md">
          {/* Source Type Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {(["all", "text", "pdf", "url"] as const).map((type) => (
              <Button
                key={type}
                onClick={() => setFilterType(type)}
                variant="ghost"
                size="sm"
                className={`h-8 rounded-full px-4 text-xs font-medium cursor-pointer transition-all ${filterType === type
                    ? "bg-indigo-600 dark:bg-indigo-650 text-white shadow-md shadow-indigo-500/15"
                    : "text-[#374151] dark:text-zinc-400 hover:text-[#111827] dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/30"
                  }`}
              >
                {type === "all" ? "All" : type === "text" ? "Text" : type === "pdf" ? "PDF" : "URL"}
              </Button>
            ))}
          </div>

          {/* Sorting controls */}
          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            {/* Sort pills */}
            <div className="flex items-center rounded-lg border border-[#D1D5DB] dark:border-zinc-850 bg-white dark:bg-zinc-900/20 p-0.5">
              {(["newest", "oldest"] as const).map((order) => (
                <Button
                  key={order}
                  onClick={() => setSortBy(order)}
                  variant="ghost"
                  size="sm"
                  className={`h-7 rounded-md px-3 text-[11px] font-medium cursor-pointer transition-all ${sortBy === order
                      ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
                      : "text-[#4B5563] dark:text-zinc-400 hover:text-[#111827] dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-transparent"
                    }`}
                >
                  {order === "newest" ? "Newest" : "Oldest"}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Grid List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
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
        <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/50 shadow-md dark:shadow-lg p-12 text-center flex flex-col items-center justify-center">
          <div className="relative mb-4">
            <div className="absolute inset-0 size-12 bg-indigo-500/10 rounded-full blur-xl animate-pulse" />
            <FileText className="size-12 text-zinc-400 dark:text-zinc-600 relative z-10" />
          </div>
          <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-white">No summaries yet</CardTitle>
          <CardDescription className="text-zinc-550 dark:text-zinc-500 mt-2 max-w-sm text-sm">
            Generate your first AI summary to see it here.
          </CardDescription>
        </Card>
      ) : filteredAndSortedSummaries.length === 0 ? (
        <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/50 shadow-md dark:shadow-lg p-12 text-center flex flex-col items-center justify-center">
          <Search className="size-12 text-zinc-400 dark:text-zinc-600 mb-3" />
          <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-white">No summaries found.</CardTitle>
          <CardDescription className="text-zinc-550 dark:text-zinc-500 mt-1">
            Try searching for a different keyword or title.
          </CardDescription>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAndSortedSummaries.map((item) => {
            const wc = item.original_text ? item.original_text.trim().split(/\s+/).length : 0;
            const titleText = item.title || item.page_title || getSummaryTitle(item.summary);
            return (
              <Card
                key={item.id}
                className="border border-[#D1D5DB] dark:border-zinc-850 bg-white dark:bg-zinc-950/40 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-all duration-300 group shadow-md dark:shadow-lg flex flex-col justify-between"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-bold text-[#111827] dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate flex-1" title={titleText}>
                      {titleText}
                    </CardTitle>
                  </div>
                  <CardDescription className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-2 mt-0.5">
                    {formatDate(item.created_at)}
                    {item.source_type === "text" && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-emerald-605 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/30 px-1.5 py-0.2 rounded">
                        Text
                      </span>
                    )}
                    {item.source_type === "pdf" && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/30 px-1.5 py-0.2 rounded">
                        PDF
                      </span>
                    )}
                    {item.source_type === "url" && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-violet-605 bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900/30 px-1.5 py-0.2 rounded">
                        URL
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pb-4">
                  <p className="text-xs text-[#374151] dark:text-zinc-400 line-clamp-3 mb-3">
                    {item.summary}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-[#6B7280] dark:text-zinc-400">
                    <span className="flex items-center gap-1">
                      <FileText className="size-3 text-[#6B7280] dark:text-zinc-500" />
                      {wc} words
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3 text-[#6B7280] dark:text-zinc-500" />
                      Saved: {item.reading_time_saved}m
                    </span>
                  </div>
                </CardContent>

                <CardFooter className="flex items-center justify-between border-t border-[#D1D5DB] dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-900/20 px-4 py-2.5 relative">
                  {/* Left: View Details */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewingSummary(item)}
                    disabled={isPendingAction}
                    className="h-8 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-xs cursor-pointer flex items-center gap-1 px-2.5"
                  >
                    <Eye className="size-3.5" />
                    Open
                  </Button>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1.5">
                    {/* Favorite/Star Toggle */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleFavorite(item.id, !item.favorite)}
                      disabled={isPendingAction}
                      className={`h-8 w-8 p-0 cursor-pointer flex items-center justify-center rounded-lg ${item.favorite
                          ? "text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/10"
                          : "text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/30"
                        }`}
                      title={item.favorite ? "Unstar" : "Star"}
                    >
                      <Heart className={`size-3.5 ${item.favorite ? "fill-rose-500 text-rose-500" : "text-zinc-400"}`} />
                    </Button>

                    {/* Delete Toggle */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingId(item.id)}
                      disabled={isPendingAction}
                      className="h-8 w-8 p-0 text-zinc-500 dark:text-zinc-400 hover:text-red-650 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg cursor-pointer flex items-center justify-center"
                      title="Delete"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>

                    {/* More dropdown container */}
                    <div className="relative">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdownId(activeDropdownId === item.id ? null : item.id);
                        }}
                        disabled={isPendingAction}
                        className="h-8 w-8 p-0 text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/30 rounded-lg cursor-pointer flex items-center justify-center"
                        title="More actions"
                      >
                        <MoreVertical className="size-3.5" />
                      </Button>

                      {activeDropdownId === item.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setActiveDropdownId(null)}
                          />
                          <div className="absolute right-0 bottom-full mb-2 w-44 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950 p-1 shadow-2xl z-20 space-y-0.5 text-xs text-left">
                            <button
                              onClick={() => {
                                handleCopy(item.summary);
                                setActiveDropdownId(null);
                              }}
                              className="flex items-center gap-2 w-full px-3 py-2 rounded text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-105 dark:hover:bg-zinc-900 text-left cursor-pointer"
                            >
                              <Copy className="size-3.5 text-zinc-400 dark:text-zinc-505" />
                              Copy
                            </button>
                            <button
                              onClick={() => {
                                if (plan === "free") {
                                  openUpgradeModal();
                                  setActiveDropdownId(null);
                                  return;
                                }
                                shareSummaryContent({
                                  title: item.title,
                                  summary: item.summary,
                                  page_title: item.page_title,
                                  keywords: Array.isArray(item.keywords) ? item.keywords : JSON.parse(item.keywords as any || "[]"),
                                  source_url: item.source_url
                                });
                                setActiveDropdownId(null);
                              }}
                              className={cn(
                                "flex items-center justify-between w-full px-3 py-2 rounded text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 text-left transition-colors duration-200 select-none",
                                plan === "free" ? "cursor-not-allowed" : "cursor-pointer"
                              )}
                            >
                              <span className="flex items-center gap-2">
                                <Share2 className="size-3.5 text-zinc-400 dark:text-zinc-500" />
                                Share
                              </span>
                              {plan === "free" && (
                                <span className="inline-flex items-center rounded-full bg-violet-600/10 dark:bg-violet-500/15 px-1.5 py-0.2 text-[8px] font-extrabold tracking-wide text-violet-750 dark:text-violet-300 border border-violet-200/50 dark:border-violet-500/30">
                                  PRO
                                </span>
                              )}
                            </button>
                            <div className="h-px bg-zinc-200 dark:bg-zinc-900 my-1" />
                            <button
                              onClick={() => {
                                if (plan === "free") {
                                  openUpgradeModal();
                                  setActiveDropdownId(null);
                                  return;
                                }
                                exportToPDF({
                                  title: item.title,
                                  summary: item.summary,
                                  page_title: item.page_title,
                                  keywords: Array.isArray(item.keywords) ? item.keywords : JSON.parse(item.keywords as any || "[]"),
                                  keyPoints: Array.isArray(item.key_points) ? item.key_points : JSON.parse(item.key_points as any || "[]"),
                                  created_at: item.created_at
                                });
                                setActiveDropdownId(null);
                              }}
                              className={cn(
                                "flex items-center justify-between w-full px-3 py-2 rounded text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 text-left transition-colors duration-200 select-none",
                                plan === "free" ? "cursor-not-allowed" : "cursor-pointer"
                              )}
                            >
                              <span className="flex items-center gap-2">
                                <FileDown className="size-3.5" />
                                Export PDF
                              </span>
                              {plan === "free" && (
                                <span className="inline-flex items-center rounded-full bg-violet-600/10 dark:bg-violet-500/15 px-1.5 py-0.2 text-[8px] font-extrabold tracking-wide text-violet-750 dark:text-violet-300 border border-violet-200/50 dark:border-violet-500/30">
                                  PRO
                                </span>
                              )}
                            </button>
                            <button
                              onClick={() => {
                                if (plan === "free") {
                                  openUpgradeModal();
                                  setActiveDropdownId(null);
                                  return;
                                }
                                exportToMarkdown({
                                  title: item.title,
                                  summary: item.summary,
                                  page_title: item.page_title,
                                  keywords: Array.isArray(item.keywords) ? item.keywords : JSON.parse(item.keywords as any || "[]"),
                                  keyPoints: Array.isArray(item.key_points) ? item.key_points : JSON.parse(item.key_points as any || "[]"),
                                  created_at: item.created_at
                                });
                                setActiveDropdownId(null);
                              }}
                              className={cn(
                                "flex items-center justify-between w-full px-3 py-2 rounded text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 text-left transition-colors duration-200 select-none",
                                plan === "free" ? "cursor-not-allowed" : "cursor-pointer"
                              )}
                            >
                              <span className="flex items-center gap-2">
                                <FileText className="size-3.5 text-zinc-400 dark:text-zinc-500" />
                                Export Markdown
                              </span>
                              {plan === "free" && (
                                <span className="inline-flex items-center rounded-full bg-violet-600/10 dark:bg-violet-500/15 px-1.5 py-0.2 text-[8px] font-extrabold tracking-wide text-violet-755 dark:text-violet-300 border border-violet-200/50 dark:border-violet-500/30">
                                  PRO
                                </span>
                              )}
                            </button>
                            <button
                              onClick={() => {
                                if (plan === "free") {
                                  openUpgradeModal();
                                  setActiveDropdownId(null);
                                  return;
                                }
                                exportToTxt({
                                  title: item.title,
                                  summary: item.summary,
                                  page_title: item.page_title,
                                  keywords: Array.isArray(item.keywords) ? item.keywords : JSON.parse(item.keywords as any || "[]"),
                                  keyPoints: Array.isArray(item.key_points) ? item.key_points : JSON.parse(item.key_points as any || "[]"),
                                  created_at: item.created_at
                                });
                                setActiveDropdownId(null);
                              }}
                              className={cn(
                                "flex items-center justify-between w-full px-3 py-2 rounded text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 text-left transition-colors duration-200 select-none",
                                plan === "free" ? "cursor-not-allowed" : "cursor-pointer"
                              )}
                            >
                              <span className="flex items-center gap-2">
                                <FileCode className="size-3.5 text-zinc-400 dark:text-zinc-500" />
                                Export TXT
                              </span>
                              {plan === "free" && (
                                <span className="inline-flex items-center rounded-full bg-violet-600/10 dark:bg-violet-500/15 px-1.5 py-0.2 text-[8px] font-extrabold tracking-wide text-violet-755 dark:text-violet-300 border border-violet-200/50 dark:border-violet-500/30">
                                  PRO
                                </span>
                              )}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Overlay */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="max-w-md w-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/90 backdrop-blur-md shadow-2xl p-6 space-y-6">
            <CardHeader className="p-0">
              <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-white">Delete Summary?</CardTitle>
              <CardDescription className="text-zinc-550 dark:text-zinc-400 text-sm mt-2">
                Are you sure you want to delete this summary? This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => setDeletingId(null)}
                disabled={isPendingAction}
                className="h-9 px-4 text-sm cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={isPendingAction}
                className="bg-red-600 hover:bg-red-700 text-white font-medium flex items-center gap-1.5 h-9 px-4 text-sm cursor-pointer dark:bg-red-600 dark:hover:bg-red-700"
              >
                {isPendingAction && <Loader2 className="size-3.5 animate-spin" />}
                Delete
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Viewing Summary Overlay Modal */}
      {viewingSummary && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <Card className="max-w-3xl w-full border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950/95 backdrop-blur-md shadow-2xl relative overflow-hidden flex flex-col my-8 max-h-[85vh]">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-30 pointer-events-none" />

            <CardHeader className="pb-3 border-b border-zinc-200 dark:border-zinc-850 flex flex-row items-center justify-between sticky top-0 bg-white dark:bg-zinc-950 z-10">
              <div>
                <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2 pr-8">
                  <Sparkles className="size-4 text-indigo-400 shrink-0" />
                  <span className="truncate">{viewingSummary.title || viewingSummary.page_title || "AI Summary Details"}</span>
                </CardTitle>
                <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2 mt-1">
                  <span>Generated on {formatDate(viewingSummary.created_at)}</span>
                  {viewingSummary.source_type === "text" && (
                    <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/30 px-1 py-0.2 rounded font-semibold">Text</span>
                  )}
                  {viewingSummary.source_type === "pdf" && (
                    <span className="text-[10px] text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/30 px-1 py-0.2 rounded font-semibold">PDF</span>
                  )}
                  {viewingSummary.source_type === "url" && (
                    <span className="text-[10px] text-violet-605 bg-violet-50 dark:text-violet-400 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900/30 px-1 py-0.2 rounded font-semibold">URL</span>
                  )}
                </CardDescription>
              </div>
              <button
                onClick={() => {
                  setViewingSummary(null);
                  closeChat();
                }}
                className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white bg-zinc-105 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 transition-colors cursor-pointer shadow-sm"
                title="Close"
              >
                <X className="size-4" />
              </button>
            </CardHeader>

            <CardContent className="space-y-6 py-5 overflow-y-auto flex-1 pr-6">
              <div className="space-y-2">
                <h3 className="text-xs text-zinc-500 dark:text-zinc-450 uppercase tracking-wider font-semibold">Summary</h3>
                <p className="text-sm text-zinc-800 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-900 px-4 py-3 rounded-lg shadow-inner">
                  {viewingSummary.summary}
                </p>
              </div>

              {viewingSummary.key_points && (
                <div className="space-y-2">
                  <h3 className="text-xs text-zinc-500 dark:text-zinc-455 uppercase tracking-wider font-semibold">Key Highlights</h3>
                  <ul className="space-y-2 pl-4 list-disc text-sm text-zinc-705 dark:text-zinc-305">
                    {(Array.isArray(viewingSummary.key_points)
                      ? viewingSummary.key_points
                      : JSON.parse((viewingSummary.key_points as any) || "[]")
                    ).map((point: string, idx: number) => (
                      <li key={idx} className="leading-relaxed pl-1 marker:text-indigo-400">
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {viewingSummary.keywords && (
                <div className="space-y-2">
                  <h3 className="text-xs text-zinc-500 dark:text-zinc-455 uppercase tracking-wider font-semibold">Keywords</h3>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {(Array.isArray(viewingSummary.keywords)
                      ? viewingSummary.keywords
                      : JSON.parse((viewingSummary.keywords as any) || "[]")
                    ).map((tag: string, idx: number) => (
                      <span key={idx} className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-650 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2.5 py-0.5 rounded-full shadow-sm">
                        <Tag className="size-2.5 text-zinc-505" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {viewingSummary.source_url && (
                <div className="text-xs text-zinc-600 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-900/50 p-3 rounded-lg flex items-center justify-between">
                  <span className="truncate pr-4">Source: {viewingSummary.source_url}</span>
                  <a
                    href={viewingSummary.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-305 font-medium shrink-0"
                  >
                    Open Link
                  </a>
                </div>
              )}
            </CardContent>

            <CardFooter className="border-t border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-900/30 px-6 py-4 flex flex-wrap items-center justify-between gap-3 sticky bottom-0 z-10">
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleCopy(viewingSummary.summary)}
                  variant="ghost"
                  size="sm"
                  className="h-9 text-zinc-650 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-105 dark:hover:bg-zinc-900 flex items-center gap-1.5 px-3 text-xs cursor-pointer shadow-sm bg-white dark:bg-zinc-900"
                >
                  <Copy className="size-3.5" />
                  Copy
                </Button>

                <GatedButton
                  onClick={() => shareSummaryContent({
                    title: viewingSummary.title,
                    summary: viewingSummary.summary,
                    page_title: viewingSummary.page_title,
                    keywords: Array.isArray(viewingSummary.keywords) ? viewingSummary.keywords : JSON.parse(viewingSummary.keywords as any || "[]"),
                    source_url: viewingSummary.source_url
                  })}
                  variant="ghost"
                  size="sm"
                  locked
                  className="h-9 text-zinc-650 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-105 dark:hover:bg-zinc-900 flex items-center gap-1.5 px-3 text-xs cursor-pointer shadow-sm bg-white dark:bg-zinc-900"
                >
                  <Share2 className="size-3.5" />
                  Share
                </GatedButton>

                <GatedButton
                  onClick={() => openChat({
                    title: viewingSummary.title || viewingSummary.page_title || "AI Summary",
                    summary: viewingSummary.summary,
                    originalText: viewingSummary.summary,
                    keyPoints: Array.isArray(viewingSummary.key_points) ? viewingSummary.key_points : JSON.parse(viewingSummary.key_points as any || "[]"),
                    keywords: Array.isArray(viewingSummary.keywords) ? viewingSummary.keywords : JSON.parse(viewingSummary.keywords as any || "[]")
                  })}
                  variant="ghost"
                  size="sm"
                  locked
                  className="h-9 rounded-xl text-indigo-650 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-305 border border-indigo-200 dark:border-indigo-950/50 bg-indigo-50/50 dark:bg-indigo-950/20 flex items-center gap-1.5 px-3 text-xs cursor-pointer font-semibold shadow-sm"
                >
                  <Sparkles className="size-3.5" />
                  Ask AI
                </GatedButton>
              </div>

              <div className="flex items-center gap-2">
                <GatedButton
                  onClick={() => exportToTxt({
                    title: viewingSummary.title,
                    summary: viewingSummary.summary,
                    page_title: viewingSummary.page_title,
                    keywords: Array.isArray(viewingSummary.keywords) ? viewingSummary.keywords : JSON.parse(viewingSummary.keywords as any || "[]"),
                    keyPoints: Array.isArray(viewingSummary.key_points) ? viewingSummary.key_points : JSON.parse(viewingSummary.key_points as any || "[]"),
                    created_at: viewingSummary.created_at
                  })}
                  variant="ghost"
                  size="sm"
                  locked
                  className="h-9 text-zinc-650 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-105 dark:hover:bg-zinc-900 flex items-center gap-1.5 px-3 text-xs cursor-pointer shadow-sm bg-white dark:bg-zinc-900"
                >
                  <FileCode className="size-3.5" />
                  TXT
                </GatedButton>

                <GatedButton
                  onClick={() => exportToMarkdown({
                    title: viewingSummary.title,
                    summary: viewingSummary.summary,
                    page_title: viewingSummary.page_title,
                    keywords: Array.isArray(viewingSummary.keywords) ? viewingSummary.keywords : JSON.parse(viewingSummary.keywords as any || "[]"),
                    keyPoints: Array.isArray(viewingSummary.key_points) ? viewingSummary.key_points : JSON.parse(viewingSummary.key_points as any || "[]"),
                    created_at: viewingSummary.created_at
                  })}
                  variant="ghost"
                  size="sm"
                  locked
                  className="h-9 text-zinc-650 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-105 dark:hover:bg-zinc-900 flex items-center gap-1.5 px-3 text-xs cursor-pointer shadow-sm bg-white dark:bg-zinc-900"
                >
                  <FileText className="size-3.5" />
                  Markdown
                </GatedButton>

                <GatedButton
                  onClick={() => exportToPDF({
                    title: viewingSummary.title,
                    summary: viewingSummary.summary,
                    page_title: viewingSummary.page_title,
                    keywords: Array.isArray(viewingSummary.keywords) ? viewingSummary.keywords : JSON.parse(viewingSummary.keywords as any || "[]"),
                    keyPoints: Array.isArray(viewingSummary.key_points) ? viewingSummary.key_points : JSON.parse(viewingSummary.key_points as any || "[]"),
                    created_at: viewingSummary.created_at
                  })}
                  variant="ghost"
                  size="sm"
                  locked
                  className="h-9 text-zinc-650 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-105 dark:hover:bg-zinc-900 flex items-center gap-1.5 px-3 text-xs cursor-pointer shadow-sm bg-white dark:bg-zinc-900"
                >
                  <FileDown className="size-3.5" />
                  PDF
                </GatedButton>
              </div>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
