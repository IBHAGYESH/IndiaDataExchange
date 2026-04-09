import { Request } from "express";

export interface AuthUser {
  walletAddress: string;
  userId: string;
  isAdmin: boolean;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}
