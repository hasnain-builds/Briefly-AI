import { GoogleGenAI } from "@google/genai";

export interface SummaryResult {
  title: string;
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
    languageInstruction = "Detect the language of the input text automatically and generate the entire output (title, summary, key points, and keywords) in that SAME detected language.";
  } else {
    languageInstruction = `Regardless of the input text language, generate the entire output (title, summary, key points, and keywords) in ${outputLanguage}, translating the content if the input text is in a different language.`;
  }

  const prompt = `You are a professional content editor and summarizer.
Analyze the provided text and perform two tasks:
1. Generate a concise, professional title that sounds like a blog/article heading.
   - The title MUST be created independently by you.
   - Maximum 8 words.
   - Do NOT use the first sentence of the text as the title.
   - Do NOT repeat the summary.
   - Do NOT simply truncate the text.
   - Do NOT use generic titles like "Summary" or "PDF Document Summary" or "Website Summary".
   - Examples: "The Incredible Survival of Cockroaches", "Extracurriculars: Key to Student Growth", "Japan: Where Tradition Meets Innovation".
2. Create a high-quality, concise summary.

${languageInstruction}

Return a structured JSON object:
{
  "title": "<The generated title>",
  "summary": "<The generated summary>",
  "keyPoints": ["<Key Point 1>", ...],
  "keywords": ["<Keyword 1>", ...]
}

Text to analyze:
${text}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          summary: { type: "STRING" },
          keyPoints: {
            type: "ARRAY",
            items: { type: "STRING" },
          },
          keywords: {
            type: "ARRAY",
            items: { type: "STRING" },
          },
        },
        required: ["title", "summary", "keyPoints", "keywords"],
      },
    },
  });

  const responseText = response.text;
  if (!responseText) {
    throw new Error("Empty response received from Gemini API");
  }

  try {
    const parsed = JSON.parse(responseText);
    console.log("DEBUG [generateAISummary] Full parsed JSON:", parsed);
    console.log("DEBUG [generateAISummary] parsed.title:", parsed.title);

    // Compute reading time saved programmatically
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const originalReadingTime = Math.ceil(wordCount / 200);
    const summaryWordCount = parsed.summary.split(/\s+/).filter(Boolean).length;
    const summaryReadingTime = Math.max(1, Math.ceil(summaryWordCount / 200));
    const timeSavedMin = Math.max(1, originalReadingTime - summaryReadingTime);
    const readingTimeSaved = `${timeSavedMin} minutes`;

    return {
      title: parsed.title,
      summary: parsed.summary,
      keyPoints: parsed.keyPoints,
      keywords: parsed.keywords,
      readingTimeSaved: readingTimeSaved,
    };
  } catch (err) {
    throw new Error("Failed to parse Gemini response as structured JSON");
  }
}

export async function askGeminiAboutSummary(
  question: string,
  context: {
    originalText: string;
    summary: string;
    keyPoints: string[];
    keywords: string[];
  }
): Promise<string> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not defined in environment variables");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are Briefly AI, a helpful, precise AI assistant.
Your task is to answer the user's question about the summary and context provided below.
Rules:
1. Answer the question based ONLY on the provided summary and original article context.
2. Be concise, direct and helpful.
3. If the answer cannot be found in the provided details, politely explain that you can only answer questions related to the current summary and its source content.

Provided Context:
- Original Text:
${context.originalText}

- Generated Summary:
${context.summary}

- Key Points:
${(context.keyPoints || []).join("\n")}

- Keywords:
${(context.keywords || []).join(", ")}

User Question:
${question}

Answer:`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  return response.text || "No response received.";
}
