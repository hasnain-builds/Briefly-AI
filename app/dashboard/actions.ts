"use server";

import { generateAISummary } from "@/lib/ai";
import { saveSummary, getRecentSummaries } from "@/services/supabase";

export async function generateAndSaveSummaryAction(text: string, outputLanguage: string = "Auto Detect") {
  try {
    // 1. Generate summary using Gemini SDK with the target output language
    const geminiResponse = await generateAISummary(text, outputLanguage);
    
    // 2. Automatically save the result to Supabase summaries table
    const savedRecord = await saveSummary({
      originalText: text,
      summary: geminiResponse.summary,
      keyPoints: geminiResponse.keyPoints,
      keywords: geminiResponse.keywords,
      readingTimeSaved: geminiResponse.readingTimeSaved,
    });
    
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

export async function fetchRecentSummariesAction() {
  try {
    const data = await getRecentSummaries();
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
