import type { Response } from "express";
import type { SsePayload } from "./types.js";

export function initSse(res: Response): void {
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  if (typeof (res as unknown as { flushHeaders?: () => void }).flushHeaders === "function") {
    (res as unknown as { flushHeaders: () => void }).flushHeaders();
  }
}

export function writeSse(res: Response, payload: SsePayload): void {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

export function createEmit(res: Response): (payload: SsePayload) => void {
  return (payload) => writeSse(res, payload);
}
