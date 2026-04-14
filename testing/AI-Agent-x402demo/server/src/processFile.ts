import type { DownloadSuccessBody } from "./types.js";

const DEFAULT_MAX_BYTES = 1024 * 1024;

function looksCsv(name: string, sample: string): boolean {
  const n = name.toLowerCase();
  if (n.endsWith(".csv") || n.endsWith(".tsv")) return true;
  const lines = sample.split(/\r?\n/).filter(Boolean).slice(0, 5);
  if (lines.length < 2) return false;
  const delim = lines[0].includes("\t") ? "\t" : ",";
  const counts = lines.map((l) => l.split(delim).length);
  return counts.every((c) => c === counts[0] && c > 1);
}

function looksJson(sample: string): boolean {
  const t = sample.trim();
  return (t.startsWith("{") && t.endsWith("}")) || (t.startsWith("[") && t.endsWith("]"));
}

export async function processDownloadedFile(
  downloadUrl: string,
  fileName: string,
  maxBytes = DEFAULT_MAX_BYTES
): Promise<string> {
  const res = await fetch(downloadUrl, { redirect: "follow" });
  if (!res.ok) {
    return `Could not fetch file bytes: HTTP ${res.status}`;
  }
  const len = res.headers.get("content-length");
  if (len && Number(len) > maxBytes) {
    return `File too large for demo (${len} bytes; cap ${maxBytes}). Metadata: ${fileName}`;
  }
  const buf = new Uint8Array(await res.arrayBuffer());
  const slice = buf.slice(0, maxBytes);
  const isTruncated = buf.byteLength > maxBytes;
  const text = new TextDecoder("utf-8", { fatal: false }).decode(slice);

  const printableRatio =
    slice.length === 0
      ? 0
      : [...slice].filter((b) => b === 9 || b === 10 || b === 13 || (b >= 32 && b < 127)).length /
        slice.length;

  if (printableRatio < 0.85) {
    return `Binary or non-text content (${fileName}), ${buf.byteLength} bytes${isTruncated ? ` (read first ${maxBytes} only)` : ""}. Skipped text analysis.`;
  }

  if (looksJson(text.trim())) {
    try {
      const parsed = JSON.parse(text) as unknown;
      if (Array.isArray(parsed)) {
        const n = Math.min(5, parsed.length);
        return `JSON array with ${parsed.length} items (showing first ${n}): ${JSON.stringify(parsed.slice(0, n)).slice(0, 2000)}${isTruncated ? " [truncated]" : ""}`;
      }
      if (parsed && typeof parsed === "object") {
        const keys = Object.keys(parsed as object).slice(0, 30);
        return `JSON object, keys: ${keys.join(", ")}. Sample: ${JSON.stringify(parsed).slice(0, 2000)}${isTruncated ? " [truncated]" : ""}`;
      }
      return `JSON primitive: ${String(parsed)}`;
    } catch {
      return `JSON-like but invalid (${fileName}). First 800 chars:\n${text.slice(0, 800)}`;
    }
  }

  if (looksCsv(fileName, text)) {
    const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
    const header = lines[0] ?? "";
    const rowCount = Math.max(0, lines.length - 1);
    const preview = lines.slice(0, 11).join("\n");
    return `CSV/TSV-style (${fileName}): columns/header: ${header.slice(0, 500)}\n~${rowCount} data rows in sample. First rows:\n${preview.slice(0, 2500)}${isTruncated ? "\n[file truncated at byte cap]" : ""}`;
  }

  return `Plain text (${fileName}), ${buf.byteLength} bytes. Excerpt:\n${text.slice(0, 3500)}${isTruncated ? "\n[truncated]" : ""}`;
}

export function parsePurchaseBody(json: string): DownloadSuccessBody | null {
  try {
    return JSON.parse(json) as DownloadSuccessBody;
  } catch {
    return null;
  }
}
