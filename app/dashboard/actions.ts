"use server";

import { generateSummaryWithAI } from "@/services/ai";
import { createSummary, fetchRecentSummaries, removeSummary, updateFavoriteSummary, fetchAllSummaries, fetchProfileUsage, incrementUserMonthlyUsage } from "@/services/summary";


export async function generateAndSaveSummaryAction(
  text: string, 
  outputLanguage: string = "Auto Detect",
  sourceType: string = "text",
  sourceUrl?: string,
  pageTitle?: string
) {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return {
        success: false,
        error: "Unauthorized: Please log in to summarize.",
      };
    }

    const usageInfo = await fetchProfileUsage(user.id);

    if (usageInfo.plan === "free") {
      if (sourceType === "pdf" && usageInfo.pdfUsage >= (usageInfo.pdfLimit ?? 2)) {
        return {
          success: false,
          error: "You've reached the monthly limit for PDF summaries.",
          code: "LIMIT_REACHED",
          feature: "PDF Summaries",
          usageResetAt: usageInfo.usageResetAt,
        };
      }

      if (sourceType === "url" && usageInfo.urlUsage >= (usageInfo.urlLimit ?? 2)) {
        return {
          success: false,
          error: "You've reached the monthly limit for URL summaries.",
          code: "LIMIT_REACHED",
          feature: "URL Summaries",
          usageResetAt: usageInfo.usageResetAt,
        };
      }

      if (sourceType === "text" && usageInfo.textUsage >= (usageInfo.textLimit ?? 10)) {
        return {
          success: false,
          error: "You've reached your monthly limit of 10 free text summaries.",
          code: "LIMIT_REACHED",
          feature: "Text Summaries",
          usageResetAt: usageInfo.usageResetAt,
        };
      }
    }

    // 1. Generate summary using the AI Service
    const geminiResponse = await generateSummaryWithAI(text, outputLanguage);
    
    // 2. Automatically save the result to Supabase using the Summary Service
    const savedRecord = await createSummary({
      originalText: text,
      summary: geminiResponse.summary,
      keyPoints: geminiResponse.keyPoints,
      keywords: geminiResponse.keywords,
      readingTimeSaved: geminiResponse.readingTimeSaved,
      sourceType,
      sourceUrl,
      title: geminiResponse.title,
      pageTitle: sourceType === "url" ? pageTitle : undefined,
    });

    // 3. Increment feature usage ONLY AFTER summary is generated and saved successfully
    await incrementUserMonthlyUsage(user.id, sourceType);
    
    return {
      success: true,
      data: savedRecord,
    };
  } catch (error: any) {
    const { normalizeAIError } = await import("@/lib/ai/errors");
    const normalized = normalizeAIError(error, "generateAndSaveSummaryAction");
    return {
      success: false,
      code: normalized.code,
      error: normalized.message,
      isTransient: normalized.isTransient,
    };
  }
}

export async function fetchProfileUsageAction() {
  try {
    const data = await fetchProfileUsage();
    return {
      success: true,
      data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch usage info.",
    };
  }
}

export async function extractTextFromURLAction(url: string) {
  try {
    const { extractTextFromURL, isValidUrl } = await import("@/services/url");

    if (!isValidUrl(url)) {
      return {
        success: false,
        error: "Invalid URL. Please enter a valid http:// or https:// URL.",
      };
    }

    const result = await extractTextFromURL(url);

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Unable to extract readable content from this website.",
    };
  }
}

export async function fetchRecentSummariesAction() {
  try {
    const data = await fetchRecentSummaries();
    return {
      success: true,
      data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch recent summaries.",
    };
  }
}

export async function deleteSummaryAction(id: string) {
  try {
    await removeSummary(id);
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to delete summary.",
    };
  }
}

export async function toggleFavoriteSummaryAction(id: string, isFavorite: boolean) {
  try {
    await updateFavoriteSummary(id, isFavorite);
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to update favorite status.",
    };
  }
}

export async function fetchAllSummariesAction() {
  try {
    const data = await fetchAllSummaries();
    return {
      success: true,
      data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch summaries.",
    };
  }
}

export async function askAIAboutSummaryAction(
  question: string,
  context: {
    originalText: string;
    summary: string;
    keyPoints: string[];
    keywords: string[];
  }
) {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return {
        success: false,
        error: "Unauthorized: Please log in to ask AI.",
      };
    }

    const usageInfo = await fetchProfileUsage(user.id);
    if (usageInfo.plan === "free" && usageInfo.askAiUsage >= (usageInfo.askAiLimit ?? 2)) {
      return {
        success: false,
        error: "You've reached your free monthly limit.",
        code: "LIMIT_REACHED",
        feature: "ASK_AI",
        usageResetAt: usageInfo.usageResetAt,
      };
    }

    const { askGeminiAboutSummary } = await import("@/lib/ai/gemini");
    const response = await askGeminiAboutSummary(question, context);

    // Consume credit ONLY AFTER successful AI response
    await incrementUserMonthlyUsage(user.id, "ASK_AI");

    return {
      success: true,
      data: response,
    };
  } catch (error: any) {
    const { normalizeAIError } = await import("@/lib/ai/errors");
    const normalized = normalizeAIError(error, "askAIAboutSummaryAction");
    return {
      success: false,
      code: normalized.code,
      error: normalized.message,
      isTransient: normalized.isTransient,
    };
  }
}

export async function incrementFeatureUsageAction(featureKey: string) {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    const usageInfo = await fetchProfileUsage(user.id);
    if (usageInfo.plan === "free") {
      const feat = featureKey.toUpperCase();
      let used = 0;
      let limit = 2;

      if (feat === "EXPORT_PDF") {
        used = usageInfo.exportPdfUsage;
        limit = usageInfo.exportPdfLimit ?? 2;
      } else if (feat === "EXPORT_MD") {
        used = usageInfo.exportMdUsage;
        limit = usageInfo.exportMdLimit ?? 2;
      } else if (feat === "EXPORT_TXT") {
        used = usageInfo.exportTxtUsage;
        limit = usageInfo.exportTxtLimit ?? 2;
      } else if (feat === "SHARE") {
        used = usageInfo.shareUsage;
        limit = usageInfo.shareLimit ?? 2;
      } else if (feat === "ASK_AI") {
        used = usageInfo.askAiUsage;
        limit = usageInfo.askAiLimit ?? 2;
      } else if (feat === "PDF" || feat === "PDF_SUMMARY") {
        used = usageInfo.pdfUsage;
        limit = usageInfo.pdfLimit ?? 2;
      } else if (feat === "URL" || feat === "URL_SUMMARY") {
        used = usageInfo.urlUsage;
        limit = usageInfo.urlLimit ?? 2;
      } else if (feat === "TEXT" || feat === "TEXT_SUMMARY") {
        used = usageInfo.textUsage;
        limit = usageInfo.textLimit ?? 10;
      }

      if (used >= limit) {
        return {
          success: false,
          code: "LIMIT_REACHED",
          feature: featureKey,
          usageResetAt: usageInfo.usageResetAt,
        };
      }
    }

    await incrementUserMonthlyUsage(user.id, featureKey);
    const updatedUsage = await fetchProfileUsage(user.id);
    return {
      success: true,
      data: updatedUsage,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to increment usage.",
    };
  }
}

export async function submitUserFeedbackAction(rating: number, feedback?: string) {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        error: "Unauthorized: Please log in to submit feedback.",
      };
    }

    // 1. Insert row into feedback table
    const { error: insertErr } = await supabase.from("feedback").insert({
      user_id: user.id,
      rating,
      feedback: feedback?.trim() || null,
      app_version: "1.0",
    });

    if (insertErr && insertErr.code !== "42P01") {
      console.error("Error inserting feedback:", insertErr);
    }

    // 2. Mark profile feedback_completed = true
    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ feedback_completed: true })
      .eq("id", user.id);

    if (updateErr && updateErr.code !== "42703") {
      console.error("Error updating profile feedback_completed:", updateErr);
    }

    return {
      success: true,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "An error occurred while submitting feedback.",
    };
  }
}

export async function setFeedbackReminderAction(targetSummaryCount: number) {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    const { error } = await supabase
      .from("profiles")
      .update({ feedback_remind_after: targetSummaryCount })
      .eq("id", user.id);

    if (error && error.code !== "42703") {
      console.error("Error setting feedback_remind_after:", error);
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function checkUserFeedbackStatusAction() {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, feedbackCompleted: false };
    }

    // Direct check against public.feedback table
    const { count, error: feedbackErr } = await supabase
      .from("feedback")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (!feedbackErr && count && count > 0) {
      return { success: true, feedbackCompleted: true };
    }

    // Fallback check against public.profiles table
    const { data: profile } = await supabase
      .from("profiles")
      .select("feedback_completed")
      .eq("id", user.id)
      .maybeSingle();

    return {
      success: true,
      feedbackCompleted: profile?.feedback_completed ?? false,
    };
  } catch (error: any) {
    return { success: false, feedbackCompleted: false };
  }
}
