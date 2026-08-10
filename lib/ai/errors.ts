/**
 * Centralized AI Error Normalization System
 * Normalizes all AI provider (Gemini/GoogleGenAI) errors into safe, structured application error objects.
 * Prevents raw provider JSON, status codes, API keys, or stack traces from reaching the browser.
 */

export type AIErrorCode =
  | "AI_TEMPORARILY_UNAVAILABLE"
  | "AI_RATE_LIMITED"
  | "AI_PROVIDER_QUOTA_EXCEEDED"
  | "AI_AUTHENTICATION_ERROR"
  | "AI_CONFIGURATION_ERROR"
  | "AI_INVALID_REQUEST"
  | "AI_CONTENT_BLOCKED"
  | "AI_INPUT_TOO_LARGE"
  | "AI_TIMEOUT"
  | "AI_NETWORK_ERROR"
  | "AI_INVALID_RESPONSE"
  | "AI_UNKNOWN_ERROR";

export interface NormalizedAIError {
  code: AIErrorCode;
  message: string;
  isTransient: boolean;
  status?: number;
}

export const AI_ERROR_MESSAGES: Record<AIErrorCode, string> = {
  AI_TEMPORARILY_UNAVAILABLE: "AI service is temporarily busy. Please try again in a moment.",
  AI_RATE_LIMITED: "Too many requests right now. Please wait a moment and try again.",
  AI_PROVIDER_QUOTA_EXCEEDED: "AI service is temporarily unavailable. Please try again later.",
  AI_AUTHENTICATION_ERROR: "AI service is currently unavailable. Please try again later.",
  AI_CONFIGURATION_ERROR: "AI service is currently unavailable. Please try again later.",
  AI_INVALID_REQUEST: "We couldn't process this request. Please check your input and try again.",
  AI_CONTENT_BLOCKED: "This content couldn't be processed. Please try different content.",
  AI_INPUT_TOO_LARGE: "This content is too large to process. Please use a smaller file or shorter text.",
  AI_TIMEOUT: "The AI request took too long to complete. Please try again.",
  AI_NETWORK_ERROR: "We couldn't connect to the AI service. Please check your connection and try again.",
  AI_INVALID_RESPONSE: "The AI service returned an unexpected response. Please try again.",
  AI_UNKNOWN_ERROR: "Something went wrong while generating your response. Please try again.",
};

export class AppAIError extends Error {
  code: AIErrorCode;
  isTransient: boolean;
  status?: number;

  constructor(code: AIErrorCode, customMessage?: string, status?: number) {
    const message = customMessage || AI_ERROR_MESSAGES[code] || AI_ERROR_MESSAGES.AI_UNKNOWN_ERROR;
    super(message);
    this.name = "AppAIError";
    this.code = code;
    this.status = status;
    this.isTransient = [
      "AI_TEMPORARILY_UNAVAILABLE",
      "AI_RATE_LIMITED",
      "AI_TIMEOUT",
      "AI_NETWORK_ERROR",
      "AI_INVALID_RESPONSE",
    ].includes(code);
  }
}

/**
 * Server-side centralized error normalization for AI provider errors.
 * Inspects status codes, SDK errors, JSON structures, and raw error messages,
 * mapping them into safe, structured application error objects.
 */
export function normalizeAIError(error: unknown, operationName: string = "AI_OPERATION"): NormalizedAIError {
  if (error instanceof AppAIError) {
    console.error(`[AI PROVIDER ERROR] ${operationName}`, {
      code: error.code,
      status: error.status || "N/A",
      message: error.message,
    });
    return {
      code: error.code,
      message: error.message,
      isTransient: error.isTransient,
      status: error.status,
    };
  }

  let status: number | undefined;
  let rawMessage = "";
  let fullPayloadStr = "";

  if (typeof error === "string") {
    rawMessage = error;
    fullPayloadStr = error;
  } else if (error && typeof error === "object") {
    const errObj = error as any;
    status = errObj.status || errObj.statusCode || errObj.code || errObj.response?.status;
    rawMessage = errObj.message || errObj.errorText || errObj.toString() || "";

    try {
      fullPayloadStr = JSON.stringify(errObj);
    } catch {
      fullPayloadStr = rawMessage;
    }

    // Handle nested error object e.g. { error: { code: 503, message: "...", status: "UNAVAILABLE" } }
    if (errObj.error && typeof errObj.error === "object") {
      if (errObj.error.code && typeof errObj.error.code === "number") {
        status = errObj.error.code;
      }
      if (errObj.error.message) {
        rawMessage += " " + errObj.error.message;
      }
      if (errObj.error.status) {
        rawMessage += " " + errObj.error.status;
      }
    }
  }

  const searchStr = (rawMessage + " " + fullPayloadStr).toLowerCase();

  let code: AIErrorCode = "AI_UNKNOWN_ERROR";

  // 1. Timeout / Abort errors
  if (
    status === 408 ||
    searchStr.includes("timeout") ||
    searchStr.includes("deadline_exceeded") ||
    searchStr.includes("aborterror") ||
    searchStr.includes("etimedout")
  ) {
    code = "AI_TIMEOUT";
  }
  // 2. Temporary unavailability / High demand (503, 502, 504, 500, UNAVAILABLE, high demand)
  else if (
    status === 503 ||
    status === 502 ||
    status === 504 ||
    status === 500 ||
    searchStr.includes("503") ||
    searchStr.includes("unavailable") ||
    searchStr.includes("high demand") ||
    searchStr.includes("overloaded") ||
    searchStr.includes("temporarily busy") ||
    searchStr.includes("bad gateway") ||
    searchStr.includes("gateway timeout") ||
    searchStr.includes("service unavailable")
  ) {
    code = "AI_TEMPORARILY_UNAVAILABLE";
  }
  // 3. Rate Limit / Quota Exceeded (429, RESOURCE_EXHAUSTED, rate limit)
  else if (
    status === 429 ||
    searchStr.includes("429") ||
    searchStr.includes("resource_exhausted") ||
    searchStr.includes("rate limit") ||
    searchStr.includes("too many requests")
  ) {
    if (searchStr.includes("quota_exceeded") || searchStr.includes("billing") || searchStr.includes("quota limit")) {
      code = "AI_PROVIDER_QUOTA_EXCEEDED";
    } else {
      code = "AI_RATE_LIMITED";
    }
  }
  // 4. Authentication / Invalid API key (401, unauthenticated, invalid api key)
  else if (
    status === 401 ||
    searchStr.includes("401") ||
    searchStr.includes("unauthenticated") ||
    searchStr.includes("api_key_invalid") ||
    searchStr.includes("invalid api key") ||
    searchStr.includes("api key not valid") ||
    searchStr.includes("google_generative_ai_api_key")
  ) {
    code = "AI_AUTHENTICATION_ERROR";
  }
  // 5. Configuration / Permission Denied (403, permission_denied)
  else if (
    status === 403 ||
    searchStr.includes("403") ||
    searchStr.includes("permission_denied") ||
    searchStr.includes("forbidden")
  ) {
    code = "AI_CONFIGURATION_ERROR";
  }
  // 6. Content / Safety Blocked (safety, blocked, finishReason: SAFETY)
  else if (
    searchStr.includes("safety") ||
    searchStr.includes("blocked") ||
    searchStr.includes("finishreason") ||
    searchStr.includes("harm_category") ||
    searchStr.includes("candidate_blocked")
  ) {
    code = "AI_CONTENT_BLOCKED";
  }
  // 7. Input / Payload too large (413, context length, token limit)
  else if (
    status === 413 ||
    searchStr.includes("413") ||
    searchStr.includes("payload too large") ||
    searchStr.includes("token limit") ||
    searchStr.includes("context length") ||
    searchStr.includes("input too large")
  ) {
    code = "AI_INPUT_TOO_LARGE";
  }
  // 8. Invalid Request (400, bad request, invalid argument)
  else if (
    status === 400 ||
    searchStr.includes("400") ||
    searchStr.includes("invalid_argument") ||
    searchStr.includes("bad request")
  ) {
    code = "AI_INVALID_REQUEST";
  }
  // 9. Network Errors (fetch failed, econnreset, enotfound)
  else if (
    searchStr.includes("fetch failed") ||
    searchStr.includes("econnreset") ||
    searchStr.includes("enotfound") ||
    searchStr.includes("networkerror") ||
    searchStr.includes("failed to fetch")
  ) {
    code = "AI_NETWORK_ERROR";
  }
  // 10. Malformed JSON / Invalid Response
  else if (
    searchStr.includes("json") ||
    searchStr.includes("invalid response format") ||
    searchStr.includes("empty response") ||
    searchStr.includes("unexpected response")
  ) {
    code = "AI_INVALID_RESPONSE";
  }

  const userFacingMessage = AI_ERROR_MESSAGES[code];
  const isTransient = [
    "AI_TEMPORARILY_UNAVAILABLE",
    "AI_RATE_LIMITED",
    "AI_TIMEOUT",
    "AI_NETWORK_ERROR",
    "AI_INVALID_RESPONSE",
  ].includes(code);

  // SERVER-SIDE STRUCTURED LOGGING ONLY (secrets redacted)
  console.error("AI PROVIDER ERROR", {
    operation: operationName,
    provider: "Gemini",
    status: status || "N/A",
    normalizedCode: code,
    userFacingMessage,
    rawErrorSnippet: rawMessage.slice(0, 200),
  });

  return {
    code,
    message: userFacingMessage,
    isTransient,
    status,
  };
}

/**
 * Bounded retry strategy for transient AI provider errors.
 * Max retries: 2 (total 3 attempts).
 * Delays exponentially: 1000ms, 2000ms.
 * Never retries non-transient errors (invalid request, auth error, content blocked).
 */
export async function withAIRetry<T>(
  fn: () => Promise<T>,
  operationName: string = "AI_OPERATION",
  maxRetries: number = 2
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err: unknown) {
      attempt++;
      const normalized = normalizeAIError(err, `${operationName} (Attempt ${attempt})`);

      if (normalized.isTransient && attempt <= maxRetries) {
        const delayMs = 1000 * Math.pow(2, attempt - 1);
        console.warn(
          `[AI RETRY] ${operationName}: Transient error (${normalized.code}). Retrying in ${delayMs}ms (Attempt ${attempt}/${maxRetries})...`
        );
        await new Promise((res) => setTimeout(res, delayMs));
        continue;
      }

      throw new AppAIError(normalized.code, normalized.message, normalized.status);
    }
  }
}
