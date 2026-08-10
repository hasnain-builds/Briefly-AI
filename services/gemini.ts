import { GeminiSummaryResponse } from "@/types";
import { AppAIError, withAIRetry } from "@/lib/ai/errors";

export async function generateSummary(text: string): Promise<GeminiSummaryResponse> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new AppAIError("AI_CONFIGURATION_ERROR", "GOOGLE_GENERATIVE_AI_API_KEY is not defined in environment variables.");
  }

  const prompt = `You are an expert summarizer.
Create a concise summary.
Return:
* Summary
* Exactly 5 Key Points
* Important Keywords
* Estimated Reading Time Saved

Text to summarize:
${text}`;

  return withAIRetry(async () => {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                summary: { type: "STRING" },
                key_points: {
                  type: "ARRAY",
                  items: { type: "STRING" },
                },
                reading_time_saved: { type: "STRING" },
                keywords: {
                  type: "ARRAY",
                  items: { type: "STRING" },
                },
              },
              required: ["summary", "key_points", "reading_time_saved", "keywords"],
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      throw new AppAIError("AI_INVALID_RESPONSE", "Invalid response format received from Gemini API");
    }

    try {
      const parsed: GeminiSummaryResponse = JSON.parse(rawText);
      return parsed;
    } catch {
      throw new AppAIError("AI_INVALID_RESPONSE", "Failed to parse Gemini response as JSON");
    }
  }, "generateSummary");
}
