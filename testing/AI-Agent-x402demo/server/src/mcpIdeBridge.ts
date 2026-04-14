import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { DatasetSummary } from "./types.js";

export function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

function getIdeMcpBaseUrl(): string {
  const u = process.env.IDE_MCP_BASE_URL?.trim();
  if (!u) throw new Error("IDE_MCP_BASE_URL is required");
  return stripTrailingSlash(u);
}

function mcpHeaders(): HeadersInit {
  const key = process.env.IDE_MCP_API_KEY?.trim();
  if (!key) return {};
  return { Authorization: `Bearer ${key}` };
}

function firstTextContent(result: unknown): string {
  const r = result as {
    content?: Array<{ type: string; text?: string }>;
    isError?: boolean;
  };
  const block = r.content?.[0];
  if (block?.type === "text" && typeof block.text === "string") {
    return block.text;
  }
  throw new Error("MCP tool returned no text content");
}

export interface IdeMcpBridge {
  listDatasets(params?: Record<string, unknown>): Promise<DatasetSummary[]>;
  getDataset(datasetId: string): Promise<{ dataset?: DatasetSummary }>;
  close(): Promise<void>;
}

export async function createIdeMcpBridge(): Promise<IdeMcpBridge> {
  const base = getIdeMcpBaseUrl();
  const mcpUrl = new URL(`${base}/mcp`);
  const transport = new StreamableHTTPClientTransport(mcpUrl, {
    requestInit: { headers: mcpHeaders() },
  });
  const client = new Client({ name: "ide-ai-agent", version: "0.1.0" });
  await client.connect(transport);

  const listDatasets = async (
    params?: Record<string, unknown>
  ): Promise<DatasetSummary[]> => {
    const raw = await client.callTool({
      name: "ide_list_datasets",
      arguments: params ?? {},
    });
    const text = firstTextContent(raw);
    const data = JSON.parse(text) as { datasets?: DatasetSummary[] };
    return Array.isArray(data.datasets) ? data.datasets : [];
  };

  const getDataset = async (
    datasetId: string
  ): Promise<{ dataset?: DatasetSummary }> => {
    const raw = await client.callTool({
      name: "ide_get_dataset",
      arguments: { datasetId },
    });
    const text = firstTextContent(raw);
    return JSON.parse(text) as { dataset?: DatasetSummary };
  };

  return {
    listDatasets,
    getDataset,
    close: () => client.close(),
  };
}
