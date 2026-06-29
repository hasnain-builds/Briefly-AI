import { GoogleGenAI } from "@google/genai";

export interface SummaryResult {
  summary: string;
  keyPoints: string[];
  keywords: string[];
  readingTimeSaved: string;
}

/**
 * Generates an AI summary, key points, keywords, and estimated reading time saved
 * using the official Google Gemini 2.5 Flash model, supporting multilingual output.
 * Never exposes the API key on the client side.
 * 
 * @param text The input text to be summarized.
 * @param outputLanguage The desired output language (e.g., "Auto Detect", "English", "Hindi", etc.)
 * @returns A promise that resolves to the SummaryResult.
 */
export async function generateAISummary(text: string, outputLanguage: string = "Auto Detect"): Promise<SummaryResult> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not defined in environment variables");
  }

  const ai = new GoogleGenAI({ apiKey });

  let languageInstruction = "";
  if (!outputLanguage || outputLanguage === "Auto Detect") {
    languageInstruction = "Detect the language of the input text automatically and generate the entire output (summary, key points, and keywords) in that SAME detected language.";
  } else {
    languageInstruction = `Regardless of the input text language, generate the entire output (summary, key points, and keywords) in ${outputLanguage}, translating the content if the input text is in a different language.`;
  }

  const prompt = `You are an expert summarizer.
Create a concise summary.
${languageInstruction}

Return:
* Summary
* Exactly 5 Key Points
* Important Keywords
* Estimated Reading Time Saved (e.g., "5 minutes", "2 minutes")

Text to summarize:
${text}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          summary: { type: "STRING" },
          key_points: {
            type: "ARRAY",
            items: { type: "STRING" },
          },
          keywords: {
            type: "ARRAY",
            items: { type: "STRING" },
          },
          reading_time_saved: { type: "STRING" },
        },
        required: ["summary", "key_points", "keywords", "reading_time_saved"],
      },
    },
  });

  const responseText = response.text;
  if (!responseText) {
    throw new Error("Empty response received from Gemini API");
  }

  try {
    const parsed = JSON.parse(responseText);
    return {
      summary: parsed.summary,
      keyPoints: parsed.key_points,
      keywords: parsed.keywords,
      readingTimeSaved: parsed.reading_time_saved,
    };
  } catch (err) {
    throw new Error("Failed to parse Gemini response as structured JSON");
  }
}
