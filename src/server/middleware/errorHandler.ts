import { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger.js";
import { env } from "../config/env.ts";

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(`Error processing request ${req.method} ${req.url}`, err);
  
  res.status(err.status || 500).json({
    success: false,
    message: "Internal Server Error",
    error: env.NODE_ENV === "development" ? err.message : undefined
  });
};
