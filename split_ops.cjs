const fs = require('fs');

let legacy = fs.readFileSync('src/server/routes/legacy.routes.ts', 'utf8');

const reportsStart = legacy.indexOf('app.post("/api/reports"');
const aiStart = legacy.indexOf('// AI & Smart Features (Mocked for Demo)');

if (reportsStart !== -1 && aiStart !== -1) {
  let opsBlock = legacy.substring(reportsStart, aiStart);
  
  opsBlock = opsBlock.replace(/app\.post\("\/api\//g, 'router.post("/');
  opsBlock = opsBlock.replace(/app\.get\("\/api\//g, 'router.get("/');
  opsBlock = opsBlock.replace(/app\.put\("\/api\//g, 'router.put("/');
  opsBlock = opsBlock.replace(/app\.delete\("\/api\//g, 'router.delete("/');

  const opsRoutesCode = `
import { Router } from "express";
import { state, TransactionManager, logAudit } from "../lib/legacyState.js";
import { CommunityReport, SkillOffering, MajorProject, AppNotification } from "../types/index.js";
import { logger } from "../lib/logger.js";

const router = Router();

${opsBlock}

export default router;
`;

  fs.writeFileSync('src/server/routes/operations.routes.ts', opsRoutesCode);

  legacy = legacy.substring(0, reportsStart) + legacy.substring(aiStart);
  fs.writeFileSync('src/server/routes/legacy.routes.ts', legacy);
  console.log("Operations extracted");
}
