// lib/gemini/errorHandler.ts
// Translates raw Google Generative AI provider errors into clear, user-friendly messages

export function humanizeGeminiError(err: unknown): string {
  if (!err) return "An unexpected error occurred while communicating with the AI service.";

  const rawMsg = err instanceof Error ? err.message : String(err);

  // 1. Google 503: Model experiencing high demand
  if (
    rawMsg.includes("503") ||
    rawMsg.toLowerCase().includes("high demand") ||
    rawMsg.toLowerCase().includes("service unavailable")
  ) {
    return "Google Gemini is temporarily experiencing high server demand (503 Service Unavailable). Your question has been safely preserved — please wait a few seconds and click 'Retry'.";
  }

  // 2. Google 429: Rate limit / Quota exceeded
  if (
    rawMsg.includes("429") ||
    rawMsg.toLowerCase().includes("rate limit") ||
    rawMsg.toLowerCase().includes("resource exhausted") ||
    rawMsg.toLowerCase().includes("quota")
  ) {
    return "AI API rate limit reached (429 Too Many Requests). Please wait a moment before sending another question.";
  }

  // 3. Timeout
  if (rawMsg.toLowerCase().includes("timed out")) {
    return "The AI response timed out after 30 seconds. Your question has been saved — click 'Retry' to try again.";
  }

  // 4. Connection / Network errors
  if (
    rawMsg.toLowerCase().includes("fetch failed") ||
    rawMsg.toLowerCase().includes("network error") ||
    rawMsg.toLowerCase().includes("econnreset") ||
    rawMsg.toLowerCase().includes("wsasend")
  ) {
    return "Network connection to the AI service was interrupted. Please check your network and click 'Retry'.";
  }

  // 5. Clean up any raw URLs or stack traces from other errors
  const cleaned = rawMsg
    .replace(/https?:\/\/[^\s]+/g, "")
    .replace(/\[GoogleGenerativeAI Error\]:?/g, "")
    .trim();

  return cleaned || "The AI service encountered an issue. Your question has been preserved — please try again.";
}
