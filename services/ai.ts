import { generateAISummary, SummaryResult } from "@/lib/ai/gemini";

/**
 * AI Service for content summarization.
 * Wraps the Gemini AI generation logic.
 */
export async function generateSummaryWithAI(
  text: string,
  outputLanguage: string = "Auto Detect"
): Promise<SummaryResult> {
  return generateAISummary(text, outputLanguage);
}
