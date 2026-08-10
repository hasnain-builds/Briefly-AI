"use client";

import { useState, useEffect } from "react";
import { 
  Heart, 
  Search, 
  X, 
  FileText, 
  Clock, 
  Trash2, 
  Eye,
  Loader2,
  Copy,
  FileDown,
  Share2,
  FileCode,
  Sparkles,
  Tag
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
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  fetchAllSummariesAction, 
  deleteSummaryAction, 
  toggleFavoriteSummaryAction,
  fetchProfileUsageAction,
  incrementFeatureUsageAction
} from "../actions";
import { SummaryRecord, UsageInfo } from "@/types";
import { exportToPDF, exportToMarkdown, exportToTxt, shareSummaryContent } from "@/lib/export";
import { useSearch } from "../layout";
import { GatedButton, usePlanGate } from "@/components/shared/plan-gate";

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

export default function FavoritesPage() {
  const { plan, openUpgradeModal, openLimitReachedModal } = usePlanGate();
  const [summaries, setSummaries] = useState<SummaryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { searchQuery, setSearchQuery } = useSearch();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPendingAction, setIsPendingAction] = useState(false);
  const [viewingSummary, setViewingSummary] = useState<SummaryRecord | null>(null);

  // Feature usage info
  const [usageInfo, setUsageInfo] = useState<UsageInfo>({
    plan: "free",
    textUsage: 0,
    textLimit: 10,
    pdfUsage: 0,
    pdfLimit: 2,
    urlUsage: 0,
    urlLimit: 2,
    exportPdfUsage: 0,
    exportPdfLimit: 2,
    exportMdUsage: 0,
    exportMdLimit: 2,
    exportTxtUsage: 0,
    exportTxtLimit: 2,
    askAiUsage: 0,
    askAiLimit: 2,
    shareUsage: 0,
    shareLimit: 2,
    monthlyUsage: 0,
    monthlyLimit: 10,
    usageResetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    remaining: 10,
  });

  const isExportPdfLimitReached = plan === "free" && (usageInfo.exportPdfUsage ?? 0) >= (usageInfo.exportPdfLimit ?? 2);
  const isExportMdLimitReached = plan === "free" && (usageInfo.exportMdUsage ?? 0) >= (usageInfo.exportMdLimit ?? 2);
  const isExportTxtLimitReached = plan === "free" && (usageInfo.exportTxtUsage ?? 0) >= (usageInfo.exportTxtLimit ?? 2);
  const isShareLimitReached = plan === "free" && (usageInfo.shareUsage ?? 0) >= (usageInfo.shareLimit ?? 2);

  useEffect(() => {
    loadSummaries();
    loadUsage();
  }, []);

  const loadUsage = async () => {
    try {
      const res = await fetchProfileUsageAction();
      if (res.success && res.data) {
        setUsageInfo(res.data);
      }
    } catch (err) {
      console.error("Failed to load usage in favorites page:", err);
    }
  };

  const loadSummaries = async () => {
    setIsLoading(true);
    try {
      const result = await fetchAllSummariesAction();
      if (result.success && result.data) {
        // Only keep favorited items
        setSummaries(result.data.filter(s => s.favorite));
      } else if (!result.success) {
        toast.error(result.error || "Failed to load favorites");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFavorite = async (id: string, isFavorite: boolean) => {
    try {
      // Since this is the favorites page, toggling it off should remove it from the list!
      setSummaries(prev => prev.filter(item => item.id !== id));
      if (viewingSummary && viewingSummary.id === id) {
        setViewingSummary(null);
      }
      
      const result = await toggleFavoriteSummaryAction(id, isFavorite);
      if (!result.success) {
        // Re-load to revert properly
        loadSummaries();
        toast.error(result.error || "Failed to update favorite status");
      } else {
        toast.success("Removed from favorites!");
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
        toast.success("Summary deleted successfully!");
        if (viewingSummary && viewingSummary.id === deletingId) {
          setViewingSummary(null);
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
          const parsed = JSON.parse(item.keywords as any);
          if (Array.isArray(parsed)) {
            keywordsStr = parsed.join(" ").toLowerCase();
          }
        } catch {}
      }
    }
    return title.includes(query) || summary.includes(query) || keywordsStr.includes(query);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-200 dark:to-zinc-500 bg-clip-text text-transparent">
            Favorites
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Access all your starred summaries.
          </p>
        </div>
      </div>

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
          <Heart className="size-12 text-zinc-400 dark:text-zinc-600 mb-3 animate-pulse" />
          <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-white">No Favorites Yet</CardTitle>
          <CardDescription className="text-zinc-550 dark:text-zinc-500 mt-1 max-w-sm">
            Bookmark summaries by clicking the Star icon in the Dashboard or History page to access them quickly here.
          </CardDescription>
        </Card>
      ) : filteredSummaries.length === 0 ? (
        <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/50 shadow-md dark:shadow-lg p-12 text-center flex flex-col items-center justify-center">
          <Search className="size-12 text-zinc-400 dark:text-zinc-600 mb-3" />
          <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-white">No summaries found.</CardTitle>
          <CardDescription className="text-zinc-550 dark:text-zinc-500 mt-1">
            Try searching for a different keyword or title.
          </CardDescription>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSummaries.map((item) => {
            const wc = item.original_text ? item.original_text.trim().split(/\s+/).length : 0;
            const titleText = item.title || item.page_title || getSummaryTitle(item.summary);
            return (
              <Card 
                key={item.id}
                className="border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950/40 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-all duration-300 group shadow-md dark:shadow-lg flex flex-col justify-between"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start">
                    <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate flex-1" title={titleText}>
                      {titleText}
                    </CardTitle>
                  </div>
                  <CardDescription className="text-[11px] text-zinc-550 dark:text-zinc-450 flex items-center gap-2 mt-0.5">
                    {formatDate(item.created_at)}
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
                  <p className="text-xs text-zinc-650 dark:text-zinc-400 line-clamp-3 mb-3">
                    {item.summary}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1">
                      <FileText className="size-3 text-zinc-400 dark:text-zinc-500" />
                      {wc} words
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3 text-zinc-400 dark:text-zinc-500" />
                      Saved: {item.reading_time_saved}m
                    </span>
                  </div>
                </CardContent>

                <CardFooter className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-900/20 px-4 py-2.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewingSummary(item)}
                    disabled={isPendingAction}
                    className="h-8 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-xs cursor-pointer flex items-center gap-1 px-2.5"
                  >
                    <Eye className="size-3.5" />
                    View Details
                  </Button>

                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleFavorite(item.id, false)}
                      disabled={isPendingAction}
                      className="h-8 text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-955/10 text-xs cursor-pointer flex items-center gap-1 px-2.5"
                    >
                      <Heart className={`size-3.5 ${item.favorite ? "fill-rose-500 text-rose-500" : "text-rose-500"}`} />
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingId(item.id)}
                      disabled={isPendingAction}
                      className="h-8 text-zinc-500 dark:text-zinc-400 hover:text-red-650 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-955/20 text-xs cursor-pointer flex items-center gap-1 px-2.5"
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

      {/* Delete Confirmation Overlay */}
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
                className="text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 h-9 px-4 text-sm"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={isPendingAction}
                className="bg-red-650 hover:bg-red-650/80 text-white font-medium flex items-center gap-1.5 h-9 px-4 text-sm"
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
                  {viewingSummary.source_type === "pdf" && (
                    <span className="text-[10px] text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/30 px-1 py-0.2 rounded font-semibold">PDF</span>
                  )}
                  {viewingSummary.source_type === "url" && (
                    <span className="text-[10px] text-violet-605 bg-violet-50 dark:text-violet-400 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900/30 px-1 py-0.2 rounded font-semibold">URL</span>
                  )}
                </CardDescription>
              </div>
              <button 
                onClick={() => setViewingSummary(null)}
                className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 transition-colors shadow-sm"
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
                  <h3 className="text-xs text-zinc-500 dark:text-zinc-450 uppercase tracking-wider font-semibold">Key Highlights</h3>
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
                        <Tag className="size-2.5 text-zinc-500" />
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
                  className="h-9 text-zinc-650 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 bg-white dark:bg-zinc-900 flex items-center gap-1.5 px-3 text-xs shadow-sm"
                >
                  <Copy className="size-3.5" />
                  Copy
                </Button>

                <GatedButton
                  onClick={async () => {
                    if (isShareLimitReached) {
                      openLimitReachedModal("SHARE", usageInfo.usageResetAt);
                      return;
                    }
                    try {
                      const res = await shareSummaryContent({
                        title: viewingSummary.title,
                        summary: viewingSummary.summary,
                        page_title: viewingSummary.page_title,
                        keywords: Array.isArray(viewingSummary.keywords) ? viewingSummary.keywords : JSON.parse(viewingSummary.keywords as any || "[]"),
                        source_url: viewingSummary.source_url
                      });
                      if (res === "copied" || res === "shared") {
                        toast.success(res === "copied" ? "Shareable summary copied to clipboard!" : "Summary shared!");
                        const incRes = await incrementFeatureUsageAction("SHARE");
                        if (incRes.success && incRes.data) setUsageInfo(incRes.data);
                      }
                    } catch (err: any) {
                      if (err.name !== "AbortError") toast.error("Failed to share summary.");
                    }
                  }}
                  variant="ghost"
                  size="sm"
                  locked={isShareLimitReached}
                  featureKey="SHARE"
                  showLockIcon={isShareLimitReached}
                  className="h-9 text-zinc-650 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 bg-white dark:bg-zinc-900 flex items-center gap-1.5 px-3 text-xs shadow-sm"
                >
                  <Share2 className="size-3.5" />
                  Share
                </GatedButton>
              </div>

              <div className="flex items-center gap-2">
                <GatedButton
                  onClick={async () => {
                    if (isExportTxtLimitReached) {
                      openLimitReachedModal("EXPORT_TXT", usageInfo.usageResetAt);
                      return;
                    }
                    try {
                      exportToTxt({
                        title: viewingSummary.title,
                        summary: viewingSummary.summary,
                        page_title: viewingSummary.page_title,
                        keywords: Array.isArray(viewingSummary.keywords) ? viewingSummary.keywords : JSON.parse(viewingSummary.keywords as any || "[]"),
                        keyPoints: Array.isArray(viewingSummary.key_points) ? viewingSummary.key_points : JSON.parse(viewingSummary.key_points as any || "[]"),
                        created_at: viewingSummary.created_at
                      });
                      toast.success("TXT exported successfully!");
                      const incRes = await incrementFeatureUsageAction("EXPORT_TXT");
                      if (incRes.success && incRes.data) setUsageInfo(incRes.data);
                    } catch (err: any) {
                      toast.error(err.message || "Failed to export TXT.");
                    }
                  }}
                  variant="ghost"
                  size="sm"
                  locked={isExportTxtLimitReached}
                  featureKey="EXPORT_TXT"
                  showLockIcon={isExportTxtLimitReached}
                  className="h-9 text-zinc-650 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 bg-white dark:bg-zinc-900 flex items-center gap-1.5 px-3 text-xs shadow-sm"
                >
                  <FileCode className="size-3.5" />
                  TXT
                </GatedButton>

                <GatedButton
                  onClick={async () => {
                    if (isExportMdLimitReached) {
                      openLimitReachedModal("EXPORT_MD", usageInfo.usageResetAt);
                      return;
                    }
                    try {
                      exportToMarkdown({
                        title: viewingSummary.title,
                        summary: viewingSummary.summary,
                        page_title: viewingSummary.page_title,
                        keywords: Array.isArray(viewingSummary.keywords) ? viewingSummary.keywords : JSON.parse(viewingSummary.keywords as any || "[]"),
                        keyPoints: Array.isArray(viewingSummary.key_points) ? viewingSummary.key_points : JSON.parse(viewingSummary.key_points as any || "[]"),
                        created_at: viewingSummary.created_at
                      });
                      toast.success("Markdown exported successfully!");
                      const incRes = await incrementFeatureUsageAction("EXPORT_MD");
                      if (incRes.success && incRes.data) setUsageInfo(incRes.data);
                    } catch (err: any) {
                      toast.error(err.message || "Failed to export Markdown.");
                    }
                  }}
                  variant="ghost"
                  size="sm"
                  locked={isExportMdLimitReached}
                  featureKey="EXPORT_MD"
                  showLockIcon={isExportMdLimitReached}
                  className="h-9 text-zinc-650 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 bg-white dark:bg-zinc-900 flex items-center gap-1.5 px-3 text-xs shadow-sm"
                >
                  <FileText className="size-3.5" />
                  Markdown
                </GatedButton>

                <GatedButton
                  onClick={async () => {
                    if (isExportPdfLimitReached) {
                      openLimitReachedModal("EXPORT_PDF", usageInfo.usageResetAt);
                      return;
                    }
                    try {
                      exportToPDF({
                        title: viewingSummary.title,
                        summary: viewingSummary.summary,
                        page_title: viewingSummary.page_title,
                        keywords: Array.isArray(viewingSummary.keywords) ? viewingSummary.keywords : JSON.parse(viewingSummary.keywords as any || "[]"),
                        keyPoints: Array.isArray(viewingSummary.key_points) ? viewingSummary.key_points : JSON.parse(viewingSummary.key_points as any || "[]"),
                        created_at: viewingSummary.created_at
                      });
                      toast.success("PDF exported successfully!");
                      const incRes = await incrementFeatureUsageAction("EXPORT_PDF");
                      if (incRes.success && incRes.data) setUsageInfo(incRes.data);
                    } catch (err: any) {
                      toast.error(err.message || "Failed to export PDF.");
                    }
                  }}
                  variant="ghost"
                  size="sm"
                  locked={isExportPdfLimitReached}
                  featureKey="EXPORT_PDF"
                  showLockIcon={isExportPdfLimitReached}
                  className="h-9 text-zinc-650 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 bg-white dark:bg-zinc-900 flex items-center gap-1.5 px-3 text-xs shadow-sm"
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
