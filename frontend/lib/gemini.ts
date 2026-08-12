import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

if (!API_KEY) {
  console.warn("WARNING: No Gemini API key found. Set GEMINI_API_KEY in .env.local");
}

export const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;
