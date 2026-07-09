import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";

let aiClient: GoogleGenAI | null = null;

export function getGenAI(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey !== "") {
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          }
        }
      });
    }
  }
  return aiClient;
}
