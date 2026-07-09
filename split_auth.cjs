const fs = require('fs');

let legacy = fs.readFileSync('src/server/routes/legacy.routes.ts', 'utf8');

// We'll extract everything between app.post("/api/auth/register" and the next section.
const authStart = legacy.indexOf('app.post("/api/auth/register"');
const authEnd = legacy.indexOf('// Users & Role-Based Access Control (RBAC) API');

if (authStart !== -1 && authEnd !== -1) {
  let authBlock = legacy.substring(authStart, authEnd);
  
  // replace app.post("/api/auth/ with router.post("/
  authBlock = authBlock.replace(/app\.post\("\/api\/auth\//g, 'router.post("/');
  authBlock = authBlock.replace(/app\.get\("\/api\/auth\//g, 'router.get("/');
  authBlock = authBlock.replace(/app\.put\("\/api\/auth\//g, 'router.put("/');
  authBlock = authBlock.replace(/app\.delete\("\/api\/auth\//g, 'router.delete("/');

  const authRoutesCode = `
import { Router } from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { state, draftState, saveState, hashPassword, verifyPassword, logAudit, TransactionManager } from "../lib/legacyState.js";
import { User } from "../types/index.js";

const router = Router();
const JWT_SECRET = env.JWT_SECRET;

const registerSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
  fullName: z.string().min(3, "الاسم الرباعي مطلوب"),
  phone: z.string().optional(),
  role: z.enum(["citizen", "donor", "charity", "admin", "researcher"]).default("donor"),
  municipality: z.string().optional(),
  nationalId: z.string().optional(),
  address: z.string().optional(),
});

${authBlock}

export default router;
`;

  fs.writeFileSync('src/server/routes/auth.routes.ts', authRoutesCode);

  // Remove from legacy
  legacy = legacy.substring(0, authStart) + legacy.substring(authEnd);
  fs.writeFileSync('src/server/routes/legacy.routes.ts', legacy);
  console.log("Auth extracted");
}
