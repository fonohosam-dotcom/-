const fs = require('fs');

const stateFile = 'src/server/lib/legacyState.ts';
let code = fs.readFileSync(stateFile, 'utf8');

// Ensure functions are exported
code = code.replace(/function TransactionManager/g, 'export class TransactionManager');
code = code.replace(/function hashPassword/g, 'export function hashPassword');
code = code.replace(/function verifyPassword/g, 'export function verifyPassword');
code = code.replace(/function logAudit/g, 'export function logAudit');
code = code.replace(/function calculateNeedScore/g, 'export function calculateNeedScore');
code = code.replace(/function determinePriorityLevel/g, 'export function determinePriorityLevel');

fs.writeFileSync(stateFile, code);

const routesFile = 'src/server/routes/legacy.routes.ts';
let routesCode = fs.readFileSync(routesFile, 'utf8');

routesCode = routesCode.replace(
  /import \{ state, draftState, saveState \} from "\.\.\/lib\/legacyState\.js";/,
  `import { state, draftState, saveState, hashPassword, verifyPassword, logAudit, calculateNeedScore, determinePriorityLevel, TransactionManager } from "../lib/legacyState.js";`
);

// Add missing Zod and type imports
routesCode = routesCode.replace(
  /import \{ logger \} from "\.\.\/lib\/logger\.js";/,
  `import { logger } from "../lib/logger.js";\nimport { z } from "zod";\nimport { User, Case, MajorProject, OmniTransaction, LedgerEntry, Fund, SkillOffering, CommunityReport, Family, AppNotification, NotificationPreferences } from "../types/index.js";`
);

fs.writeFileSync(routesFile, routesCode);
