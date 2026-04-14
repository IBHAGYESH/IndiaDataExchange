import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ideGetDataset, ideListDatasets, type ListDatasetsQuery } from "./ideApi.js";

function getIdeBaseUrl(): string {
  const u = process.env.IDE_API_BASE_URL?.trim();
  if (!u) throw new Error("IDE_API_BASE_URL is required");
  return u;
}

export function createIdeMcpServer(): McpServer {
  const server = new McpServer(
    {
      name: "india-data-exchange-ide-mcp",
      version: "0.1.0",
    },
    { capabilities: { tools: {} } }
  );

  server.registerTool(
    "ide_list_datasets",
    {
      description:
        "List datasets from the India Data Exchange IDE API. Returns a JSON string of the API payload (datasets, total, page, totalPages).",
      inputSchema: {
        limit: z.number().int().positive().max(200).optional(),
        page: z.number().int().positive().optional(),
        search: z.string().optional(),
        category: z.string().optional(),
        tags: z.string().optional(),
        format: z.string().optional(),
        minPrice: z.string().optional(),
        maxPrice: z.string().optional(),
        sortBy: z.string().optional(),
        sortOrder: z.string().optional(),
      },
    },
    async (args) => {
      const ideBaseUrl = getIdeBaseUrl();
      const q: ListDatasetsQuery = { ...args };
      const data = await ideListDatasets(ideBaseUrl, q);
      return {
        content: [{ type: "text", text: JSON.stringify(data) }],
      };
    }
  );

  server.registerTool(
    "ide_get_dataset",
    {
      description:
        "Get one dataset by Mongo _id from the IDE API. Returns a JSON string of { dataset }.",
      inputSchema: {
        datasetId: z.string().min(1).describe("Dataset _id"),
      },
    },
    async ({ datasetId }) => {
      const ideBaseUrl = getIdeBaseUrl();
      const data = await ideGetDataset(ideBaseUrl, datasetId);
      return {
        content: [{ type: "text", text: JSON.stringify(data) }],
      };
    }
  );

  return server;
}
