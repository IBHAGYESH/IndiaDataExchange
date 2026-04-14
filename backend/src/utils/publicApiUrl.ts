import type { Request } from "express";

/**
 * Public origin for building absolute API URLs in JSON responses.
 * Prefer API_PUBLIC_BASE_URL behind reverse proxies; otherwise use Host / X-Forwarded-*.
 */
export function getPublicApiOrigin(req: Request): string {
  const fromEnv = process.env.API_PUBLIC_BASE_URL?.trim().replace(/\/+$/, "");
  if (fromEnv) return fromEnv;

  const xfProto = req.headers["x-forwarded-proto"];
  const proto =
    (Array.isArray(xfProto) ? xfProto[0] : xfProto) || req.protocol || "http";
  const xfHost = req.headers["x-forwarded-host"];
  const host =
    (Array.isArray(xfHost) ? xfHost[0] : xfHost) ||
    req.headers.host ||
    `localhost:${process.env.PORT || "5001"}`;
  return `${proto}://${host}`;
}

/** Full URL for x402-protected GET .../download (initiate purchase / signed download). */
export function buildDatasetPurchaseApiUrl(origin: string, datasetId: string): string {
  const base = origin.replace(/\/+$/, "");
  const id = encodeURIComponent(datasetId);
  return `${base}/api/datasets/${id}/download`;
}
