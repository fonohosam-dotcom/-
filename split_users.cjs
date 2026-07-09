const fs = require('fs');

let legacy = fs.readFileSync('src/server/routes/legacy.routes.ts', 'utf8');

const usersStart = legacy.indexOf('// Users & Role-Based Access Control (RBAC) API');
const casesStart = legacy.indexOf('app.post("/api/cases", async (req, res) => {');

if (usersStart !== -1 && casesStart !== -1) {
  let usersBlock = legacy.substring(usersStart, casesStart);
  
  usersBlock = usersBlock.replace(/app\.post\("\/api\/(users|feature-flags|notifications)\//g, 'router.post("/$1/');
  usersBlock = usersBlock.replace(/app\.get\("\/api\/(users|feature-flags|notifications)\//g, 'router.get("/$1/');
  usersBlock = usersBlock.replace(/app\.put\("\/api\/(users|feature-flags|notifications)\//g, 'router.put("/$1/');
  usersBlock = usersBlock.replace(/app\.delete\("\/api\/(users|feature-flags|notifications)\//g, 'router.delete("/$1/');
  usersBlock = usersBlock.replace(/app\.post\("\/api\/(users|feature-flags|notifications)"/g, 'router.post("/$1"');
  usersBlock = usersBlock.replace(/app\.get\("\/api\/(users|feature-flags|notifications)"/g, 'router.get("/$1"');
  usersBlock = usersBlock.replace(/app\.put\("\/api\/(users|feature-flags|notifications)"/g, 'router.put("/$1"');

  const usersRoutesCode = `
import { Router } from "express";
import { state, TransactionManager, logAudit } from "../lib/legacyState.js";
import { User, AppNotification } from "../types/index.js";
import { logger } from "../lib/logger.js";

const router = Router();

${usersBlock}

export default router;
`;

  fs.writeFileSync('src/server/routes/users.routes.ts', usersRoutesCode);

  legacy = legacy.substring(0, usersStart) + legacy.substring(casesStart);
  fs.writeFileSync('src/server/routes/legacy.routes.ts', legacy);
  console.log("Users/Notifs extracted");
}
