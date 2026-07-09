const fs = require('fs');

let legacy = fs.readFileSync('src/server/routes/legacy.routes.ts', 'utf8');

const casesStart = legacy.indexOf('app.post("/api/cases", async (req, res) => {');
const reportsStart = legacy.indexOf('app.post("/api/reports", async (req, res) => {');

if (casesStart !== -1 && reportsStart !== -1) {
  let casesBlock = legacy.substring(casesStart, reportsStart);
  
  casesBlock = casesBlock.replace(/app\.post\("\/api\/(cases|civil-registry|bank|analytics|donations)\//g, 'router.post("/$1/');
  casesBlock = casesBlock.replace(/app\.get\("\/api\/(cases|civil-registry|bank|analytics|donations)\//g, 'router.get("/$1/');
  casesBlock = casesBlock.replace(/app\.put\("\/api\/(cases|civil-registry|bank|analytics|donations)\//g, 'router.put("/$1/');
  casesBlock = casesBlock.replace(/app\.delete\("\/api\/(cases|civil-registry|bank|analytics|donations)\//g, 'router.delete("/$1/');
  casesBlock = casesBlock.replace(/app\.post\("\/api\/(cases|donations)"/g, 'router.post("/$1"');
  casesBlock = casesBlock.replace(/app\.get\("\/api\/(cases|donations)"/g, 'router.get("/$1"');
  
  const casesRoutesCode = `
import { Router } from "express";
import { z } from "zod";
import { state, TransactionManager, logAudit, calculateNeedScore, determinePriorityLevel, auditLedger } from "../lib/legacyState.js";
import { Case, Family, LedgerEntry } from "../types/index.js";
import { logger } from "../lib/logger.js";

const router = Router();

// Define schemas that were used in legacy for cases
const familySchema = z.object({
  headId: z.string().optional(),
  spouseCount: z.number().min(0).default(0),
  childrenCount: z.number().min(0).default(0),
  dependentsCount: z.number().min(0).default(0),
  notes: z.string().optional()
});

const newCaseSchema = z.object({
  userId: z.string(),
  family: familySchema,
  needTypes: z.array(z.string()).min(1),
  description: z.string().min(10),
  amountRequired: z.number().min(0),
  municipality: z.string(),
  latitude: z.number(),
  longitude: z.number()
});

${casesBlock}

export default router;
`;

  fs.writeFileSync('src/server/routes/cases.routes.ts', casesRoutesCode);

  legacy = legacy.substring(0, casesStart) + legacy.substring(reportsStart);
  fs.writeFileSync('src/server/routes/legacy.routes.ts', legacy);
  console.log("Cases extracted");
} else {
  console.log("Failed to find boundaries");
}
