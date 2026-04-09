import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { appConfig } from "@/config";
import { AppError } from "@middlewares/error.middleware";
import { AuthRequest, AuthUser } from "@utils/interface";

const getToken = (req: AuthRequest): string | null => {
  const header = req.header("Authorization");
  if (header && header.startsWith("Bearer ")) {
    return header.split("Bearer ")[1];
  }
  if (req.cookies?.Authorization) {
    return req.cookies.Authorization;
  }
  return null;
};

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = getToken(req);
    if (!token) {
      return next(new AppError("AuthError", 401, "Authentication token missing", true));
    }

    const decoded = jwt.verify(token, appConfig.jwt.secret) as AuthUser;
    req.user = decoded;
    next();
  } catch {
    return next(new AppError("AuthError", 401, "Invalid or expired token", true));
  }
};

export const optionalAuth = (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const token = getToken(req);
    if (token) {
      const decoded = jwt.verify(token, appConfig.jwt.secret) as AuthUser;
      req.user = decoded;
    }
  } catch {
    // Silently ignore invalid tokens for optional auth
  }
  next();
};

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) {
    return next(new AppError("AuthError", 403, "Admin access required", true));
  }
  next();
};
