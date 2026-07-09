import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.string().default("3000"),
  JWT_SECRET: z.string().default("super-secret-takaful-key"),
  AES_SECRET_KEY: z.string().default("d3b07384d113edec49eaa6238ad5ff0022f4c028b3e89cd3000b1a03efcb773d"),
  GEMINI_API_KEY: z.string().optional(),
  APP_URL: z.string().default("http://localhost:3000"),
});

export const env = envSchema.parse(process.env);
