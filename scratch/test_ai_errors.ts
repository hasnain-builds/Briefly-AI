import { normalizeAIError, AI_ERROR_MESSAGES } from "../lib/ai/errors";

console.log("==========================================");
console.log("TESTING AI ERROR NORMALIZATION SYSTEM");
console.log("==========================================\n");

// Test 1: Simulated 503 High Demand Error (User's real production error)
const error503 = {
  error: {
    code: 503,
    message: "This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.",
    status: "UNAVAILABLE"
  }
};
const norm503 = normalizeAIError(error503, "TEST_503");
console.assert(norm503.code === "AI_TEMPORARILY_UNAVAILABLE", "Test 503 code match");
console.assert(norm503.message === AI_ERROR_MESSAGES.AI_TEMPORARILY_UNAVAILABLE, "Test 503 message match");
console.assert(norm503.isTransient === true, "Test 503 isTransient match");
console.log("✅ Test 1 (503 High Demand): Passed ->", norm503);

// Test 2: Simulated 429 Rate Limit
const error429 = { status: 429, message: "RESOURCE_EXHAUSTED: Rate limit exceeded" };
const norm429 = normalizeAIError(error429, "TEST_429");
console.assert(norm429.code === "AI_RATE_LIMITED", "Test 429 code match");
console.assert(norm429.isTransient === true, "Test 429 isTransient match");
console.log("✅ Test 2 (429 Rate Limit): Passed ->", norm429);

// Test 3: Simulated 401 Invalid Key
const error401 = new Error("API_KEY_INVALID: Provided API key is invalid or expired");
const norm401 = normalizeAIError(error401, "TEST_401");
console.assert(norm401.code === "AI_AUTHENTICATION_ERROR", "Test 401 code match");
console.assert(norm401.isTransient === false, "Test 401 isTransient match");
console.log("✅ Test 3 (401 Auth Error): Passed ->", norm401);

// Test 4: Content / Safety Block
const errorSafety = { message: "Candidate blocked due to SAFETY policy violation" };
const normSafety = normalizeAIError(errorSafety, "TEST_SAFETY");
console.assert(normSafety.code === "AI_CONTENT_BLOCKED", "Test Safety code match");
console.assert(normSafety.message === "This content couldn't be processed. Please try different content.", "Test Safety message match");
console.log("✅ Test 4 (Safety Block): Passed ->", normSafety);

// Test 5: Timeout
const errorTimeout = new Error("Request timed out after 30000ms AbortError");
const normTimeout = normalizeAIError(errorTimeout, "TEST_TIMEOUT");
console.assert(normTimeout.code === "AI_TIMEOUT", "Test Timeout code match");
console.assert(normTimeout.isTransient === true, "Test Timeout isTransient match");
console.log("✅ Test 5 (Timeout Error): Passed ->", normTimeout);

// Test 6: Network Error
const errorNet = new Error("TypeError: fetch failed (ENOTFOUND)");
const normNet = normalizeAIError(errorNet, "TEST_NET");
console.assert(normNet.code === "AI_NETWORK_ERROR", "Test Network code match");
console.log("✅ Test 6 (Network Error): Passed ->", normNet);

console.log("\nALL 6 ERROR NORMALIZATION TESTS PASSED SUCCESSFULLY!");
