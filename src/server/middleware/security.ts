import { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import Redis from "ioredis";
import DOMPurify from "isomorphic-dompurify";
import { env } from "../config/env.js";
import { decryptObjectValues } from "../lib/encryption.ts";
import { logger } from "../../lib/logger.ts";

let redisClient: Redis | null = null;

if (env.REDIS_URL) {
  try {
    redisClient = new Redis(env.REDIS_URL);
    redisClient.on("error", (err) => logger.error("Redis connection error:", err));
    logger.info("Redis initialized for rate limiting");
  } catch (err) {
    logger.error("Failed to initialize Redis:", err);
  }
}

const getStore = () => {
  if (redisClient) {
    return new RedisStore({
      // @ts-expect-error - ioredis types don't exactly match rate-limit-redis expected types, but it works at runtime
      sendCommand: (...args: string[]) => redisClient!.call(args[0], ...args.slice(1)),
    });
  }
  return undefined; // Fallback to memory store if no Redis client
};

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://maps.googleapis.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://*"],
      connectSrc: ["'self'", "https://*", "wss://*"]
    }
  },
  crossOriginEmbedderPolicy: false,
});

export const corsMiddleware = cors({
  origin: env.APP_URL,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: 'Content-Type, Authorization',
});

// Flexible limit for public browsing
export const apiLimiter = rateLimit({
  store: getStore(),
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true, 
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again after 15 minutes.",
  validate: { xForwardedForHeader: false, trustProxy: false }
});

// Strict limit for Auth routes
export const authLimiter = rateLimit({
  store: getStore(),
  windowMs: 15 * 60 * 1000,
  max: 10, // Max 10 attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many authentication attempts from this IP, please try again later.",
  validate: { xForwardedForHeader: false, trustProxy: false }
});

export const decryptBodyMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    try {
      req.body = decryptObjectValues(req.body, env.AES_SECRET_KEY);
    } catch (e) {
      console.error("Decryption error", e);
    }
  }
  next();
};

export const sanitizeBodyMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    const sanitizeObj = (obj: any) => {
      for (const key in obj) {
        if (typeof obj[key] === 'string') {
          obj[key] = DOMPurify.sanitize(obj[key]);
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObj(obj[key]);
        }
      }
    };
    sanitizeObj(req.body);
  }
  next();
};
