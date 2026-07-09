
import express from "express";
import { env } from "./config/env.ts";
import { 
  securityHeaders, 
  corsMiddleware, 
  apiLimiter, 
  decryptBodyMiddleware,
  sanitizeBodyMiddleware 
} from "./middleware/security.ts";
import { errorHandler } from "./middleware/errorHandler.ts";
import { logger } from "./lib/logger.js";
import appRoutes from "./routes/index.ts";

const app = express();

app.set("trust proxy", 1);
app.use(securityHeaders);
app.use(corsMiddleware);

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
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
