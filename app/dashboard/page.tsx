"use client";

import { useState, useEffect } from "react";
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
  Heart
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
import { toast } from "sonner";
import { generateAndSaveSummaryAction, fetchRecentSummariesAction } from "./actions";
import { SummaryRecord } from "@/types";

interface SummaryView {
  summary: string;
  keyPoints: string[];
  keywords: string[];
  readingTimeSaved: string;
}

export default function DashboardPage() {
  const [text, setText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [summaries, setSummaries] = useState<SummaryRecord[]>([]);
  const [currentSummary, setCurrentSummary] = useState<SummaryView | null>(null);
  const [outputLanguage, setOutputLanguage] = useState("Auto Detect");

  // Load summaries on mount
  useEffect(() => {
    loadSummaries();
  }, []);

  const loadSummaries = async () => {
    setIsLoadingHistory(true);
    try {
      const result = await fetchRecentSummariesAction();
      if (result.success && result.data) {
        setSummaries(result.data);
      } else if (!result.success) {
        toast.error(result.error || "Failed to load recent summaries");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred loading summaries");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Calculations for current input
  const wordCount = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  const estimatedReadingTime = Math.ceil(wordCount / 200);

  // Real-time Overview & Stats calculations
  const totalSummaries = summaries.length;
  const pdfsUploaded = 0; // PDF upload not implemented yet
  const creditsRemaining = Math.max(0, 100 - totalSummaries);

  const totalMinutesSaved = summaries.reduce((acc, item) => {
    return acc + (item.reading_time_saved || 0);
  }, 0);
  const hoursSaved = (totalMinutesSaved / 60).toFixed(1);

  const handleGenerateSummary = async () => {
    if (!text.trim()) {
      toast.error("Please enter some text.");
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const result = await generateAndSaveSummaryAction(text, outputLanguage);
      
      if (!result.success || !result.data) {
        toast.error(result.error || "Failed to generate summary");
        return;
      }

      const record = result.data;
      
      toast.success("Summary generated and saved successfully!");

      // Parse JSON array / fields safely from DB response
      const keyPoints = Array.isArray(record.key_points) 
        ? record.key_points 
        : JSON.parse((record.key_points as any) || "[]");
        
      const keywords = Array.isArray(record.keywords) 
        ? record.keywords 
        : JSON.parse((record.keywords as any) || "[]");

      setCurrentSummary({
        summary: record.summary,
        keyPoints,
        keywords,
        readingTimeSaved: record.reading_time_saved + " minutes",
      });

      // Clear input
      setText("");
      
      // Refresh summaries list immediately
      await loadSummaries();
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleView = (item: SummaryRecord) => {
    const keyPoints = Array.isArray(item.key_points) 
      ? item.key_points 
      : JSON.parse((item.key_points as any) || "[]");
      
    const keywords = Array.isArray(item.keywords) 
      ? item.keywords 
      : JSON.parse((item.keywords as any) || "[]");

    setCurrentSummary({
      summary: item.summary,
      keyPoints,
      keywords,
      readingTimeSaved: item.reading_time_saved + " minutes",
    });

    // Scroll to the summary card viewer smoothly
    const element = document.getElementById("summary-viewer");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
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

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Hero Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight lg:text-4xl bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
          Summarize Anything with AI
        </h1>
        <p className="text-zinc-400 max-w-2xl text-base lg:text-lg">
          Paste articles, blogs, reports or upload PDFs and get concise AI-powered summaries instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Left Section (Main content) */}
        <div className="xl:col-span-8 space-y-8">
          {/* Summary Input Card */}
          <Card className="border border-zinc-800 bg-zinc-950/50 backdrop-blur-md shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 via-transparent to-transparent opacity-50 pointer-events-none" />
            
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <Sparkles className="size-4 text-indigo-400" />
                Input Source
              </CardTitle>
              <CardDescription className="text-zinc-500">
                Paste your content to generate an AI summary.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste your article here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={isGenerating}
                className="min-h-[220px] bg-zinc-900/40 border-zinc-800 text-white placeholder-zinc-500 focus-visible:border-zinc-700 focus-visible:ring-1 focus-visible:ring-zinc-700/50 text-base"
              />

              {/* Status and Actions row */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-4 text-xs text-zinc-400">
                  <span className="bg-zinc-900 border border-zinc-800/80 px-2.5 py-1 rounded-md">
                    <strong>{wordCount}</strong> words
                  </span>
                  {wordCount > 0 && (
                    <span className="bg-zinc-900 border border-zinc-800/80 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                      <Clock className="size-3 text-zinc-500" />
                      ~{estimatedReadingTime} min read
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:text-white hover:bg-zinc-900 cursor-pointer flex items-center gap-2"
                    onClick={() => toast.info("PDF upload is a premium feature (Demo Mode)")}
                  >
                    <Upload className="size-4" />
                    Upload PDF
                  </Button>

                  <select
                    value={outputLanguage}
                    onChange={(e) => setOutputLanguage(e.target.value)}
                    disabled={isGenerating}
                    className="h-10 px-3 py-2 text-sm rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 outline-none focus:border-zinc-700 transition cursor-pointer disabled:opacity-50"
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

                  <Button
                    type="button"
                    onClick={handleGenerateSummary}
                    disabled={isGenerating || !text.trim()}
                    className="h-10 bg-white text-black hover:bg-zinc-200 transition-colors font-semibold px-5 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="size-4 text-black animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-4 text-black" />
                        Generate Summary
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Summary Result Viewer */}
          {currentSummary && (
            <Card id="summary-viewer" className="border border-zinc-850 bg-zinc-950/70 backdrop-blur-md shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-30 pointer-events-none" />
              
              <CardHeader className="pb-3 border-b border-zinc-850 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                    <Sparkles className="size-4 text-indigo-400" />
                    AI Summary Results
                  </CardTitle>
                  <CardDescription className="text-zinc-500">
                    Generated summary with key takeaways.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentSummary(null)}
                  className="text-zinc-500 hover:text-white hover:bg-zinc-900 cursor-pointer h-8 w-8 p-0"
                >
                  <X className="size-4" />
                </Button>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* Summary Paragraph */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">Summary Overview</h3>
                  <p className="text-zinc-200 text-base leading-relaxed">{currentSummary.summary}</p>
                </div>

                {/* Key Points */}
                {currentSummary.keyPoints && currentSummary.keyPoints.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">Key Takeaways</h3>
                    <ul className="space-y-2">
                      {currentSummary.keyPoints.map((point, index) => (
                        <li key={index} className="flex items-start gap-2.5 text-zinc-300 text-sm">
                          <CheckCircle2 className="size-4 text-indigo-500 shrink-0 mt-0.5" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Keywords & Reading Time Saved */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-zinc-850">
                  {currentSummary.keywords && currentSummary.keywords.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      {currentSummary.keywords.map((kw, index) => (
                        <span 
                          key={index}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full"
                        >
                          <Tag className="size-2.5 text-zinc-500" />
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}

                  {currentSummary.readingTimeSaved && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/30 border border-emerald-900/50 px-3 py-1 rounded-lg">
                      <Clock className="size-3.5" />
                      Estimated Time Saved: ~{currentSummary.readingTimeSaved}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Summaries Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Clock className="size-5 text-indigo-400" />
              Recent Summaries
            </h2>
            
            {isLoadingHistory ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
                {[1, 2].map((i) => (
                  <Card key={i} className="border border-zinc-850 bg-zinc-950/20 shadow-lg p-5 space-y-4">
                    <div className="space-y-2">
                      <div className="h-4 bg-zinc-850 rounded w-3/4"></div>
                      <div className="h-3 bg-zinc-900 rounded w-1/4"></div>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-3 bg-zinc-900 rounded w-16"></div>
                      <div className="h-3 bg-zinc-900 rounded w-16"></div>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-zinc-850">
                      <div className="h-8 bg-zinc-900 rounded w-16"></div>
                      <div className="h-8 bg-zinc-900 rounded w-16"></div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : summaries.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 border border-dashed border-zinc-850 rounded-xl bg-zinc-950/20 text-center">
                <FileText className="size-10 text-zinc-600 mb-3" />
                <p className="text-zinc-400 font-medium">No summaries yet.</p>
                <p className="text-zinc-500 text-xs mt-1">Generate your first AI summary.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {summaries.map((item) => {
                  const wc = item.original_text ? item.original_text.trim().split(/\s+/).length : 0;
                  
                  return (
                    <Card 
                      key={item.id} 
                      className="border border-zinc-850 bg-zinc-950/40 hover:bg-zinc-900/30 transition-all duration-300 group shadow-lg"
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors truncate flex-1">
                            {getSummaryTitle(item.summary)}
                          </CardTitle>
                          {item.is_favorite && (
                            <Heart className="size-4 text-rose-500 fill-rose-500 shrink-0 mt-0.5" />
                          )}
                        </div>
                        <CardDescription className="text-[11px] text-zinc-500">
                          {formatDate(item.created_at)}
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="pb-4">
                        <div className="flex items-center gap-3 text-xs text-zinc-400">
                          <span className="flex items-center gap-1">
                            <FileText className="size-3 text-zinc-600" />
                            {wc} words
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="size-3 text-zinc-600" />
                            Saved: {item.reading_time_saved} minutes
                          </span>
                        </div>
                      </CardContent>

                      <CardFooter className="flex items-center justify-between border-t border-zinc-850 bg-zinc-900/20 px-4 py-2.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(item)}
                          className="h-8 text-zinc-400 hover:text-white text-xs cursor-pointer flex items-center gap-1 px-2.5"
                        >
                          <Eye className="size-3.5" />
                          View
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => toast.info("Delete functionality coming soon")}
                          className="h-8 text-zinc-500 hover:text-red-400 hover:bg-red-950/20 text-xs cursor-pointer flex items-center gap-1 px-2.5"
                        >
                          <Trash2 className="size-3.5" />
                          Delete
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Section (Analytics Panels) */}
        <div className="xl:col-span-4 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="size-5 text-indigo-400" />
            Overview & Stats
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4">
            {/* Total Summaries */}
            <Card className="border border-zinc-850 bg-zinc-950/30 backdrop-blur-md shadow-md p-5 flex items-start gap-4">
              <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400">
                <FileText className="size-5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Total Summaries</p>
                <p className="text-2xl font-bold text-white">{totalSummaries}</p>
                <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span>Tracked in real-time</span>
                </p>
              </div>
            </Card>

            {/* PDFs Uploaded */}
            <Card className="border border-zinc-850 bg-zinc-950/30 backdrop-blur-md shadow-md p-5 flex items-start gap-4">
              <div className="p-3 rounded-lg bg-violet-500/10 text-violet-400">
                <Upload className="size-5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">PDFs Uploaded</p>
                <p className="text-2xl font-bold text-white">{pdfsUploaded}</p>
                <p className="text-[10px] text-zinc-500">Coming soon</p>
              </div>
            </Card>

            {/* AI Credits */}
            <Card className="border border-zinc-850 bg-zinc-950/30 backdrop-blur-md shadow-md p-5 flex items-start gap-4">
              <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400">
                <Coins className="size-5" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">AI Credits</p>
                  <span className="text-[10px] text-amber-400 bg-amber-950/30 border border-amber-900/50 px-1.5 py-0.5 rounded">{creditsRemaining}% left</span>
                </div>
                <p className="text-2xl font-bold text-white">{creditsRemaining} <span className="text-xs text-zinc-500 font-normal">/ 100</span></p>
                <div className="w-full bg-zinc-900 rounded-full h-1.5 mt-2 overflow-hidden border border-zinc-850">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${creditsRemaining}%` }} />
                </div>
              </div>
            </Card>

            {/* Time Saved */}
            <Card className="border border-zinc-850 bg-zinc-950/30 backdrop-blur-md shadow-md p-5 flex items-start gap-4">
              <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400">
                <BookOpen className="size-5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold font-sans">Reading Time Saved</p>
                <p className="text-2xl font-bold text-white">{hoursSaved} <span className="text-xs text-zinc-500 font-normal">hours</span></p>
                <p className="text-[10px] text-zinc-500">Based on avg. reading speeds</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
