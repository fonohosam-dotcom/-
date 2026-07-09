import { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import DOMPurify from "isomorphic-dompurify";
import { env } from "../config/env.ts";
import { decryptObjectValues } from "../lib/encryption.ts";

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

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true, 
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again after 15 minutes.",
  validate: { xForwardedForHeader: false, trustProxy: false }
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again later.",
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
