import { GoogleGenAI } from "@google/genai";
import fs from "fs";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  console.log("Converting...");
  const serverCode = fs.readFileSync("server.ts", "utf8");
  const schemaCode = fs.readFileSync("src/db/schema.ts", "utf8");

  const prompt = `
  You are an expert backend engineer.
  The following is a list of endpoints from a monolithic server.ts.
  I want you to rewrite ONLY the endpoints (app.post, app.get, etc.) into a clean Express router using Drizzle ORM and SQLite.
  Schema is provided.

  Output the complete TypeScript code for a router file that implements all the standard CRUD and business logic endpoints (users, cases, projects, etc) using Drizzle.
  Return only code, no markdown.
  `;

  // I will just let the LLM see the whole file and rewrite it into routes.
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt + "\n\n---SCHEMA---\n" + schemaCode + "\n\n---SERVER---\n" + serverCode,
  });
  
  fs.writeFileSync("src/server/api.ts", response.text.replace(/\`\`\`typescript/g, '').replace(/\`\`\`/g, ''));
  console.log("Done");
}
run();
