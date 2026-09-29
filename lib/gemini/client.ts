// lib/gemini/client.ts
// Gemini SDK singleton — server-side only.
// Exports the configured GoogleGenerativeAI instance and model names.

import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY environment variable.");
}

export const geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Model identifiers — change here to upgrade models globally
export const CHAT_MODEL = "gemini-2.0-flash";
export const EMBEDDING_MODEL = "text-embedding-004";
export const EMBEDDING_DIMENSIONS = 768;
