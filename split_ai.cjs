const fs = require('fs');

let legacy = fs.readFileSync('src/server/routes/legacy.routes.ts', 'utf8');

const aiStart = legacy.indexOf('app.post("/api/ai/fatwa"');
// The rest is AI
if (aiStart !== -1) {
  let aiBlock = legacy.substring(aiStart);
  // remove trailing module.exports or export default router if any
  const exportMatch = aiBlock.indexOf('export default router;');
  if (exportMatch !== -1) {
    aiBlock = aiBlock.substring(0, exportMatch);
  }

  aiBlock = aiBlock.replace(/app\.post\("\/api\/(ai|generate-image)/g, 'router.post("/$1');

  const aiRoutesCode = `
import { Router } from "express";
import { getGenAI } from "../services/ai.service.js";
import { logger } from "../lib/logger.js";

const router = Router();

${aiBlock}

export default router;
`;

  fs.writeFileSync('src/server/routes/ai.routes.ts', aiRoutesCode);

  legacy = legacy.substring(0, aiStart) + '\nexport default router;\n';
  fs.writeFileSync('src/server/routes/legacy.routes.ts', legacy);
  console.log("AI extracted");
}
