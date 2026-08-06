"use server";

import { generateSummaryWithAI } from "@/services/ai";
import { createSummary, fetchRecentSummaries, removeSummary, updateFavoriteSummary, fetchAllSummaries, fetchProfileUsage, incrementUserMonthlyUsage } from "@/services/summary";
import { extractTextFromURL, isValidUrl } from "@/services/url";

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
    return {
      success: false,
      error: error.message || "An error occurred during summarization.",
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
    if (usageInfo.plan !== "pro") {
      return {
        success: false,
        error: "Ask AI is a Briefly AI Pro feature. Please upgrade to Pro.",
        code: "PRO_REQUIRED",
      };
    }

    const { askGeminiAboutSummary } = await import("@/lib/ai/gemini");
    const response = await askGeminiAboutSummary(question, context);
    return {
      success: true,
      data: response,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to get response from AI.",
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
