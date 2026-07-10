import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";

let ai: GoogleGenAI | null = null;

export function getGenAI(): GoogleGenAI | null {
  if (!ai && env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }
  return ai;
}
