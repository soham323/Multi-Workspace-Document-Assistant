// lib/gemini/client.ts
// Gemini SDK singleton — server-side only.
// Exports the configured GoogleGenerativeAI instance and model names.

import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY environment variable.");
}

export const geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Model identifiers — change here to upgrade models globally
export const CHAT_MODEL = process.env.GEMINI_CHAT_MODEL || "gemini-3.5-flash";
export const FALLBACK_CHAT_MODELS = [
  CHAT_MODEL,
  "gemini-3.5-flash-lite",
  "gemini-2.5-flash",
].filter((m, idx, arr) => arr.indexOf(m) === idx);
export const EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";
export const EMBEDDING_DIMENSIONS = 768;

