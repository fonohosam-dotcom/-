const fs = require('fs');

let legacy = fs.readFileSync('src/server/routes/legacy.routes.ts', 'utf8');

const securityStart = legacy.indexOf('app.get("/api/health"');
const securityEnd = legacy.indexOf('const registerSchema = z.object({');

if (securityStart !== -1 && securityEnd !== -1) {
  let securityBlock = legacy.substring(securityStart, securityEnd);
  
  securityBlock = securityBlock.replace(/app\.post\("\/api\//g, 'router.post("/');
  securityBlock = securityBlock.replace(/app\.get\("\/api\//g, 'router.get("/');
  
  const securityRoutesCode = `
import { Router } from "express";
import crypto from "crypto";
import { state, liveThreatLogs, auditLedger, municipalityGeoFences } from "../lib/legacyState.js";

const router = Router();

${securityBlock}

export default router;
`;

  fs.writeFileSync('src/server/routes/security.routes.ts', securityRoutesCode);

  legacy = legacy.substring(0, securityStart) + legacy.substring(securityEnd);
  fs.writeFileSync('src/server/routes/legacy.routes.ts', legacy);
  console.log("Security extracted");
}
