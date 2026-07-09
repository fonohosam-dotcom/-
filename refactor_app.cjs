const fs = require('fs');
const path = require('path');

let appTs = fs.readFileSync('src/server/app.ts', 'utf8');

// The goal is to move the logic into files without losing anything.
// We'll create a legacy routes file that contains ALL routes from app.ts for now,
// but sets up the exact middleware and structure requested.

const newAppTs = `
import express from "express";
import { env } from "./config/env.js";
import { 
  securityHeaders, 
  corsMiddleware, 
  apiLimiter, 
  decryptBodyMiddleware,
  sanitizeBodyMiddleware 
} from "./middleware/security.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { logger } from "./lib/logger.js";
import appRoutes from "./routes/index.js";

const app = express();

app.set("trust proxy", 1);
app.use(securityHeaders);
app.use(corsMiddleware);

app.use((req, res, next) => {
  logger.info(\`\${req.method} \${req.url}\`);
  next();
});

app.use(express.json({ limit: "50mb" }));
app.use(decryptBodyMiddleware);
app.use(sanitizeBodyMiddleware);

// Global API rate limiting
app.use("/api/", apiLimiter);

// Mount all modular routes
app.use("/api", appRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;
`;

fs.writeFileSync('src/server/index.ts', newAppTs);

