# IDE MCP server (Streamable HTTP)

HTTP-deployable [Model Context Protocol](https://modelcontextprotocol.io) server that **proxies read-only IDE APIs** so any MCP client can discover datasets without talking to the IDE HTTP surface directly.

**Purchases are not implemented here.** Paid downloads use x402 on `GET /api/datasets/:id/download`; the **buyer’s wallet** must sign those transactions. Each integrator (e.g. this repo’s AI-Agent) calls that endpoint from a process that holds the payer key — not from this platform MCP service.

## Tools

| Name | Purpose |
|------|---------|
| `ide_list_datasets` | `GET /api/datasets` with optional filters; returns JSON string |
| `ide_get_dataset` | `GET /api/datasets/:id`; returns JSON string of `{ dataset }` |

## Environment

Copy `.env.example` to `.env`.

- **`IDE_API_BASE_URL`** — IDE backend origin (e.g. `http://localhost:5001`).
- **`PORT`** — Listen port (default `5056`).
- **`BIND_HOST`** — Default `0.0.0.0` for PaaS; use `127.0.0.1` for strict local binding with DNS rebinding middleware from the SDK.
- **`MCP_API_KEY`** (optional) — If set, clients must send `Authorization: Bearer <key>` or `X-MCP-API-Key: <key>` on `/mcp`.

## Run locally

```bash
npm install
npm run dev
```

Health: `GET http://localhost:5056/health`  
MCP endpoint: `POST http://localhost:5056/mcp` (Streamable HTTP; session id in `mcp-session-id` after initialize).

## Deploy

- Run as a separate Node service; terminate TLS at your reverse proxy.
- Set **`IDE_API_BASE_URL`** to the internal URL of the IDE API.
- Optional **`MCP_API_KEY`** for trusted clients only.
- **Scaling**: Sessions are stored in memory per process; use sticky sessions or a single instance unless you add shared session state.

## Security

- Restrict network access to `/mcp` (firewall / API key) in production.
- This server holds **no** payment keys.
