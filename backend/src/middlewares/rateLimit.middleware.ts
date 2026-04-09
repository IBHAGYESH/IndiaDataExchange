import rateLimit from "express-rate-limit";
import { appConfig } from "@/config";

export const globalRateLimiter = rateLimit({
  windowMs: appConfig.security.rateLimitWindowMs,
  max: appConfig.security.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});
