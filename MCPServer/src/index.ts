import "dotenv/config";
import { randomUUID } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { createIdeMcpServer } from "./createIdeMcpServer.js";

const transports: Record<string, StreamableHTTPServerTransport> = {};

function requireMcpApiKey(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.MCP_API_KEY?.trim();
  if (!expected) {
    next();
    return;
  }
  const auth = req.headers.authorization;
  const bearer =
    typeof auth === "string" && auth.startsWith("Bearer ")
      ? auth.slice("Bearer ".length).trim()
      : undefined;
  const headerKey =
    typeof req.headers["x-mcp-api-key"] === "string"
      ? req.headers["x-mcp-api-key"].trim()
      : undefined;
  if (bearer === expected || headerKey === expected) {
    next();
    return;
  }
  res.status(401).json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Unauthorized" },
    id: null,
  });
}

const bindHost = process.env.BIND_HOST?.trim() || "0.0.0.0";
const app = createMcpExpressApp({ host: bindHost });

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "ide-mcp-server" });
});

const mcpPostHandler = async (req: Request, res: Response) => {
  const sessionIdHeader = req.headers["mcp-session-id"];
  const sessionId =
    typeof sessionIdHeader === "string" ? sessionIdHeader : undefined;
  try {
    let transport: StreamableHTTPServerTransport;
    if (sessionId && transports[sessionId]) {
      transport = transports[sessionId];
    } else if (!sessionId && isInitializeRequest(req.body)) {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sid) => {
          transports[sid] = transport;
        },
      });
      transport.onclose = () => {
        const sid = transport.sessionId;
        if (sid && transports[sid]) {
          delete transports[sid];
        }
      };
      const server = createIdeMcpServer();
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      return;
    } else {
      res.status(400).json({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Bad Request: No valid session ID provided",
        },
        id: null,
      });
      return;
    }
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("MCP POST error:", err);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  }
};

const mcpGetHandler = async (req: Request, res: Response) => {
  const sessionIdHeader = req.headers["mcp-session-id"];
  const sessionId =
    typeof sessionIdHeader === "string" ? sessionIdHeader : undefined;
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send("Invalid or missing session ID");
    return;
  }
  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
};

const mcpDeleteHandler = async (req: Request, res: Response) => {
  const sessionIdHeader = req.headers["mcp-session-id"];
  const sessionId =
    typeof sessionIdHeader === "string" ? sessionIdHeader : undefined;
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send("Invalid or missing session ID");
    return;
  }
  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
};

app.post("/mcp", requireMcpApiKey, mcpPostHandler);
app.get("/mcp", requireMcpApiKey, mcpGetHandler);
app.delete("/mcp", requireMcpApiKey, mcpDeleteHandler);

const port = Number(process.env.PORT) || 5056;
app.listen(port, bindHost, () => {
  console.log(`IDE MCP server http://${bindHost}:${port} (POST /mcp)`);
});

process.on("SIGINT", async () => {
  for (const sid of Object.keys(transports)) {
    try {
      await transports[sid]?.close();
      delete transports[sid];
    } catch {
      /* ignore */
    }
  }
  process.exit(0);
});
