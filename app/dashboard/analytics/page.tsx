"use client";

import { useState, useEffect } from "react";
import { 
  BarChart3, 
  Sparkles, 
  Clock, 
  Heart, 
  FileText, 
  Link2, 
  Calendar, 
  Globe, 
  Tag, 
  TrendingUp, 
  Loader2, 
  Award, 
  AlertCircle 
} from "lucide-react";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { fetchAllSummariesAction } from "../actions";
import { SummaryRecord } from "@/types";
import { useDashboard } from "../layout";
import { GatedButton } from "@/components/shared/plan-gate";

// Language detection helper
const detectLanguage = (text: string): string => {
  if (!text) return "English";
  const lowercase = text.toLowerCase();
  
  if (/[\u0900-\u097F]/.test(text)) return "Hindi";
  if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text)) return "Japanese";
  if (/[\uAC00-\uD7AF\u1100-\u11FF]/.test(text)) return "Korean";

  const spanishWords = ["y", "el", "la", "de", "que", "en", "un", "una", "es", "con", "para", "por", "los", "las"];
  const frenchWords = ["et", "le", "la", "de", "que", "en", "un", "une", "est", "dans", "pour", "par", "les", "des"];
  const germanWords = ["und", "der", "die", "das", "von", "in", "ist", "mit", "für", "den", "dem", "ein", "eine"];

  const words = lowercase.split(/\s+/);
  let esCount = 0;
  let frCount = 0;
  let deCount = 0;

  words.forEach(w => {
    if (spanishWords.includes(w)) esCount++;
    if (frenchWords.includes(w)) frCount++;
    if (germanWords.includes(w)) deCount++;
  });

  if (esCount > frCount && esCount > deCount && esCount > 1) return "Spanish";
  if (frCount > esCount && frCount > deCount && frCount > 1) return "French";
  if (deCount > esCount && deCount > frCount && deCount > 1) return "German";

  return "English";
};

export default function AnalyticsPage() {
  const [summaries, setSummaries] = useState<SummaryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { openChat } = useDashboard();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const result = await fetchAllSummariesAction();
      if (result.success && result.data) {
        setSummaries(result.data);
      } else if (!result.success) {
        toast.error(result.error || "Failed to load summaries data.");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Overview metrics
  const totalSummaries = summaries.length;
  const totalFavorites = summaries.filter(s => s.favorite).length;
  const totalReadingTimeSavedMin = summaries.reduce((acc, curr) => acc + (curr.reading_time_saved || 0), 0);
  const totalReadingTimeSavedHours = (totalReadingTimeSavedMin / 60).toFixed(1);
  
  const pdfCount = summaries.filter(s => s.source_type === "pdf").length;
  const urlCount = summaries.filter(s => s.source_type === "url").length;
  const textCount = summaries.filter(s => s.source_type === "text").length;

  // 2. This Month metrics
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const summariesThisMonth = summaries.filter(s => {
    const d = new Date(s.created_at);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const createdThisMonth = summariesThisMonth.length;
  const timeSavedThisMonthMin = summariesThisMonth.reduce((acc, curr) => acc + (curr.reading_time_saved || 0), 0);
  const favoritesThisMonth = summariesThisMonth.filter(s => s.favorite).length;

  // 3. Weekly Activity Chart (Last 7 Days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d;
  }).reverse();

  const chartData = last7Days.map(date => {
    const dayStr = date.toLocaleDateString("en-US", { weekday: "short" });
    const count = summaries.filter(s => {
      const sDate = new Date(s.created_at);
      return sDate.toDateString() === date.toDateString();
    }).length;
    return { dayStr, count };
  });

  const maxWeeklyCount = Math.max(...chartData.map(d => d.count), 1);

  // 4. Source Breakdown percentages
  const totalSourceCount = pdfCount + urlCount + textCount || 1;
  const pdfPercent = Math.round((pdfCount / totalSourceCount) * 100);
  const urlPercent = Math.round((urlCount / totalSourceCount) * 100);
  const textPercent = Math.round((textCount / totalSourceCount) * 100);

  // 5. Most Used Language
  const languageFrequencies: Record<string, number> = {};
  summaries.forEach(s => {
    const lang = detectLanguage(s.summary);
    languageFrequencies[lang] = (languageFrequencies[lang] || 0) + 1;
  });
  
  let mostUsedLanguage = "English";
  let maxLangCount = 0;
  Object.entries(languageFrequencies).forEach(([lang, count]) => {
    if (count > maxLangCount) {
      maxLangCount = count;
      mostUsedLanguage = lang;
    }
  });

  // 6. Most Used Keywords (Top 10)
  const keywordFrequencies: Record<string, number> = {};
  summaries.forEach(s => {
    const kwArray = Array.isArray(s.keywords) 
      ? s.keywords 
      : JSON.parse((s.keywords as any) || "[]");
    
    kwArray.forEach((kw: string) => {
      const cleanKw = kw.trim().toLowerCase();
      if (cleanKw) {
        keywordFrequencies[cleanKw] = (keywordFrequencies[cleanKw] || 0) + 1;
      }
    });
  });

  const topKeywords = Object.entries(keywordFrequencies)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // 7. Top Summary (Most reading time saved)
  let topSummary: SummaryRecord | null = null;
  if (summaries.length > 0) {
    topSummary = summaries.reduce((prev, curr) => {
      const prevSaved = prev.reading_time_saved || 0;
      const currSaved = curr.reading_time_saved || 0;
      return currSaved > prevSaved ? curr : prev;
    }, summaries[0]);
  }

  const getLanguageFlag = (lang: string) => {
    switch (lang) {
      case "Hindi": return "🇮🇳";
      case "Spanish": return "🇪🇸";
      case "French": return "🇫🇷";
      case "German": return "🇩🇪";
      case "Japanese": return "🇯🇵";
      case "Korean": return "🇰🇷";
      default: return "🇺🇸";
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-200 dark:to-zinc-500 bg-clip-text text-transparent flex items-center gap-3">
          <BarChart3 className="size-8 text-indigo-400" />
          Analytics
        </h1>
        <p className="text-zinc-550 dark:text-zinc-400">
          Track your summarization activity and productivity.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="size-10 animate-spin text-indigo-500" />
          <p className="text-sm text-zinc-550 dark:text-zinc-400">Loading summaries analytics...</p>
        </div>
      ) : totalSummaries === 0 ? (
        <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/50 shadow-md p-8 text-center space-y-4 max-w-md mx-auto mt-12">
          <AlertCircle className="size-12 text-zinc-400 dark:text-zinc-600 mx-auto animate-pulse" />
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">No data available</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-455 leading-relaxed">
              Start summarizing texts, PDFs, or website URLs to see real-time productivity metrics.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Overview Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: "Total Summaries", val: totalSummaries, color: "text-indigo-600 dark:text-indigo-400" },
              { label: "Total Favorites", val: totalFavorites, color: "text-rose-600 dark:text-rose-400" },
              { label: "Hours Saved", val: totalReadingTimeSavedHours, color: "text-emerald-600 dark:text-emerald-400" },
              { label: "PDFs Summarized", val: pdfCount, color: "text-amber-600 dark:text-amber-400" },
              { label: "URLs Summarized", val: urlCount, color: "text-violet-600 dark:text-violet-400" },
              { label: "Text Summaries", val: textCount, color: "text-sky-600 dark:text-sky-400" }
            ].map((stat, idx) => (
              <Card key={idx} className="border border-zinc-205 dark:border-zinc-850 bg-white dark:bg-zinc-950/50 p-4 flex flex-col justify-between space-y-1.5 shadow-sm hover:shadow transition-shadow">
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider leading-tight">{stat.label}</span>
                <span className={`text-2xl font-bold tracking-tight ${stat.color}`}>{stat.val}</span>
              </Card>
            ))}
          </div>

          {/* Productivity & Weekly Activity section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* This Month Metrics */}
            <Card className="border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950/50 shadow-md dark:shadow-lg flex flex-col justify-between">
              <CardHeader className="pb-3 flex flex-row items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Calendar className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-white">Productivity This Month</CardTitle>
                  <CardDescription className="text-[11px] text-zinc-500 dark:text-zinc-400">Current billing cycle KPIs.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 py-4 border-t border-zinc-200 dark:border-zinc-900/60 flex-1 flex flex-col justify-center">
                <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-900 shadow-sm">
                  <span className="text-xs text-zinc-550 dark:text-zinc-400">Summaries Created</span>
                  <span className="text-sm font-bold text-zinc-900 dark:text-white">{createdThisMonth}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-900 shadow-sm">
                  <span className="text-xs text-zinc-550 dark:text-zinc-400">Reading Time Saved</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">~{timeSavedThisMonthMin} min</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-900 shadow-sm">
                  <span className="text-xs text-zinc-550 dark:text-zinc-400">Favorites Added</span>
                  <span className="text-sm font-bold text-rose-600 dark:text-rose-455">{favoritesThisMonth}</span>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Activity (Last 7 Days Chart) */}
            <Card className="border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950/50 shadow-md dark:shadow-lg lg:col-span-2">
              <CardHeader className="pb-3 flex flex-row items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <TrendingUp className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-white">Weekly Summary Activity</CardTitle>
                  <CardDescription className="text-[11px] text-zinc-550 dark:text-zinc-500">Number of summaries generated over the last 7 days.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="border-t border-zinc-200 dark:border-zinc-900/60 px-6 py-4">
                <div className="flex items-end justify-between gap-4 h-44 pt-6">
                  {chartData.map((d, index) => {
                    const heightPercent = (d.count / maxWeeklyCount) * 100;
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                        <div className="relative w-full flex justify-center">
                          {/* Hover Tooltip */}
                          <span className="absolute -top-7 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[9px] text-indigo-600 dark:text-indigo-400 font-semibold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md">
                            {d.count}
                          </span>
                        </div>
                        {/* Bar Graphic */}
                        <div 
                          className="w-full rounded-t bg-gradient-to-t from-violet-600/60 to-indigo-500/80 group-hover:from-violet-500 group-hover:to-indigo-400 transition-all duration-300 relative"
                          style={{ height: `${Math.max(4, heightPercent)}%` }}
                        >
                          <div className="absolute inset-x-0 top-0 h-px bg-indigo-300/30" />
                        </div>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wider mt-1">{d.dayStr}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Breakdown & Keywords & Language */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Source Breakdown */}
            <Card className="border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950/50 shadow-md dark:shadow-lg">
              <CardHeader className="pb-3 flex flex-row items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400">
                  <FileText className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-white">Source Breakdown</CardTitle>
                  <CardDescription className="text-[11px] text-zinc-500 dark:text-zinc-400">Distribution by input types.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="border-t border-zinc-200 dark:border-zinc-900/60 p-6 space-y-4">
                {/* Text Summaries */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    <span className="flex items-center gap-1.5"><FileText className="size-3 text-sky-505 dark:text-sky-400" /> Text</span>
                    <span>{textPercent}% ({textCount})</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-500 rounded-full" style={{ width: `${textPercent}%` }} />
                  </div>
                </div>

                {/* PDF Summaries */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    <span className="flex items-center gap-1.5"><Award className="size-3 text-amber-600 dark:text-amber-400" /> PDF Files</span>
                    <span>{pdfPercent}% ({pdfCount})</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pdfPercent}%` }} />
                  </div>
                </div>

                {/* URL Summaries */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium text-zinc-700 dark:text-zinc-305">
                    <span className="flex items-center gap-1.5"><Link2 className="size-3 text-violet-600 dark:text-violet-400" /> Web Links</span>
                    <span>{urlPercent}% ({urlCount})</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500 rounded-full" style={{ width: `${urlPercent}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Most Used Language */}
            <Card className="border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950/50 shadow-md dark:shadow-lg">
              <CardHeader className="pb-3 flex flex-row items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-405">
                  <Globe className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-white">Most Used Language</CardTitle>
                  <CardDescription className="text-[11px] text-zinc-500 dark:text-zinc-400">Top selected summary language.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="border-t border-zinc-200 dark:border-zinc-900/60 p-6 flex flex-col items-center justify-center text-center space-y-3 h-[180px]">
                <div className="text-5xl">{getLanguageFlag(mostUsedLanguage)}</div>
                <h4 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">{mostUsedLanguage}</h4>
                <p className="text-[10px] text-zinc-550 dark:text-zinc-500 font-semibold uppercase tracking-wider">
                  Used in {maxLangCount} generated summaries
                </p>
              </CardContent>
            </Card>

            {/* Keyword Tag Cloud */}
            <Card className="border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950/50 shadow-md dark:shadow-lg">
              <CardHeader className="pb-3 flex flex-row items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                  <Tag className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-white">Top 10 Keywords</CardTitle>
                  <CardDescription className="text-[11px] text-zinc-550 dark:text-zinc-500">Most frequent topics generated by AI.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="border-t border-zinc-200 dark:border-zinc-900/60 p-6 flex flex-wrap gap-2 justify-center items-center h-[180px] overflow-y-auto">
                {topKeywords.length === 0 ? (
                  <p className="text-xs text-zinc-500">No keyword tags found.</p>
                ) : (
                  topKeywords.map(([keyword, freq]) => {
                    const sizeClass = freq > 4 ? "text-xs px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/40 font-semibold shadow-sm" 
                                    : freq > 2 ? "text-[11px] px-2.5 py-1 bg-zinc-100 dark:bg-zinc-900/80 text-zinc-700 dark:text-zinc-350 border-zinc-200 dark:border-zinc-800 shadow-sm"
                                    : "text-[10px] px-2 py-0.5 bg-zinc-50 dark:bg-zinc-900/30 text-zinc-500 dark:text-zinc-500 border-zinc-205 dark:border-zinc-900/60";
                    return (
                      <span key={keyword} className={`inline-flex items-center gap-1 border rounded-full transition-colors hover:border-zinc-400 dark:hover:border-zinc-700 cursor-default ${sizeClass}`}>
                        {keyword}
                      </span>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Summary Card (Saved the most time) */}
          {topSummary && (
            <Card className="border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950/50 shadow-md dark:shadow-lg overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-20 pointer-events-none" />
              <CardHeader className="pb-3 border-b border-zinc-200 dark:border-zinc-900/60 flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <Award className="size-5" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-white">Top Summary (Max Time Saved)</CardTitle>
                    <CardDescription className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Saved you {topSummary.reading_time_saved} minutes.
                    </CardDescription>
                  </div>
                </div>

                <GatedButton
                  onClick={() => openChat({
                    title: topSummary?.title || topSummary?.page_title || "Top Summary",
                    summary: topSummary?.summary || "",
                    originalText: topSummary?.original_text || topSummary?.summary || "",
                    keyPoints: Array.isArray(topSummary?.key_points) ? topSummary?.key_points : JSON.parse(topSummary?.key_points as any || "[]"),
                    keywords: Array.isArray(topSummary?.keywords) ? topSummary?.keywords : JSON.parse(topSummary?.keywords as any || "[]")
                  })}
                  variant="ghost"
                  size="sm"
                  locked
                  className="h-8 rounded-xl text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-305 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm border border-zinc-200 dark:border-transparent bg-white dark:bg-transparent"
                >
                  <Sparkles className="size-3.5" />
                  Ask AI
                </GatedButton>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                <h4 className="text-base font-bold text-zinc-900 dark:text-white">{topSummary.title || topSummary.page_title}</h4>
                <p className="text-xs text-zinc-650 dark:text-zinc-350 leading-relaxed max-w-4xl line-clamp-3">{topSummary.summary}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
