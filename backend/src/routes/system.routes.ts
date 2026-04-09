import { Router, Request, Response } from "express";
import { getDbConnected } from "@/state";

const systemRouter = Router();

systemRouter.get("/healthz", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

systemRouter.get("/readyz", (_req: Request, res: Response) => {
  if (!getDbConnected()) {
    return res.status(503).json({ status: "not ready", reason: "Database not connected" });
  }
  return res.status(200).json({ status: "ready" });
});

export { systemRouter };
