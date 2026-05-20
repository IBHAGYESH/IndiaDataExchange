import serverless from "serverless-http";
import { expressApp } from "./server";

let ready: Promise<void> | null = null;
let cachedHandler: ReturnType<typeof serverless> | null = null;

/** Connect MongoDB once per serverless container (or before local listen). */
export function ensureReady(): Promise<void> {
  if (!ready) {
    ready = expressApp.init();
  }
  return ready;
}

const SERVERLESS_BINARY = [
  "application/octet-stream",
  "multipart/form-data",
  "application/pdf",
  "application/zip",
  "application/gzip",
  "text/csv",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

export async function getServerlessHandler() {
  await ensureReady();
  if (!cachedHandler) {
    cachedHandler = serverless(expressApp.getServer(), {
      binary: SERVERLESS_BINARY,
    });
  }
  return cachedHandler;
}
