# AI-Agent demo (LangGraph + React + IDE MCP + x402)

End-to-end demo: a small **Express** backend runs a **LangGraph** flow that discovers datasets via the **IDE MCP server** (`ide_list_datasets` / `ide_get_dataset`), asks **OpenAI `gpt-4o-mini`** to pick candidates, and — **only after you confirm in the UI** — pays with **x402 / USDC** from the **agent wallet** against **`IDE_API_BASE_URL`** (`GET .../datasets/:id/download`), same pattern as the marketplace `DatasetPurchaseButton`. The agent then downloads the file from the returned URL, builds a bounded text/CSV/JSON summary, and returns a final answer. The **MCP server does not pay**; it is a read-only API layer. For goals that need more than one dataset, the graph **asks for confirmation again before every additional purchase**. Step updates stream over **SSE** (`POST /api/chat`). The **Vite + React** UI shows steps and **Confirm / Decline** cards inline in the chat.

## Prerequisites

1. **India Data Exchange backend** running (IDE API), e.g. `http://localhost:5001`.
2. **IDE MCP server** (`IndiaDataExchange/MCPServer`) at **`IDE_MCP_BASE_URL`** — proxies catalog APIs only (no payment keys).
3. **OpenAI API key** with access to `gpt-4o-mini`.
4. **Agent Algorand wallet** on **testnet** with ALGO + USDC for x402 (see `AGENT_ALGOD_MNEMONIC` / `AGENT_PRIVATE_KEY`).

## Configuration

### Server (`server/`)

Copy `server/.env.example` to `server/.env` and set:

| Variable | Required | Description |
|----------|----------|-------------|
| `IDE_API_BASE_URL` | Yes | IDE API origin for paid download (`x402`), e.g. `http://localhost:5001` |
| `IDE_MCP_BASE_URL` | Yes | MCP server origin (no trailing slash), e.g. `http://localhost:5056` |
| `OPENAI_API_KEY` | Yes | OpenAI key |
| `AGENT_ALGOD_MNEMONIC` | One of mnemonic / key | Buyer (agent) wallet for x402 |
| `AGENT_PRIVATE_KEY` | One of mnemonic / key | Base64 64-byte Algorand secret key |
| `IDE_MCP_API_KEY` | No | Bearer token if the MCP server has `MCP_API_KEY` set |
| `PORT` | No | Default `5055` |
| `CORS_ORIGIN` | No | Default `*`; set to your Vite origin in dev, e.g. `http://localhost:5173` |
| `IDE_FRONTEND_BASE_URL` | No | Next.js marketplace origin for confirm-card links, default `http://localhost:3000` |
| `MAX_DATASET_PRICE_USDC` | No | Skip expensive datasets in the catalog passed to the LLM |
| `MAX_DOWNLOAD_BYTES` | No | Max bytes read from the purchased file (default ~1 MiB in code) |
| `MCP_LIST_DATASETS_LIMIT` | No | `limit` passed to `ide_list_datasets` (default `50`) |

### Web (`web/`)

Copy `web/.env.example` to `web/.env` if needed:

- `VITE_AGENT_API_URL` — agent server URL, default in code `http://localhost:5055`

## Run order

1. Start the **IDE backend** and confirm `GET {IDE_API_BASE_URL}/api/datasets` works.
2. Start the **MCP server** (`IndiaDataExchange/MCPServer`) with `IDE_API_BASE_URL` only — see that package’s README.
3. Start the **agent server**:

   ```bash
   cd server
   npm install
   npm run dev
   ```

4. Start the **web UI** (separate terminal):

   ```bash
   cd web
   npm install
   npm run dev
   ```

5. Open the Vite URL (usually `http://localhost:5173`), send a message, confirm or decline each purchase when prompted, then read the final reply. Use **New chat** for a new `threadId` (new LangGraph checkpoint).

Health check: `GET http://localhost:5055/api/health`

## Human confirmation & API contract

- The server uses **LangGraph `interrupt` + `MemorySaver`** (in-memory). Restarting the Node process clears checkpoints.
- **Start a run:** `POST /api/chat` with `{ "message": string, "threadId"?: string }`. If `threadId` is omitted, the server generates one and echoes it in a `thread` SSE event.
- **Resume after interrupt:** `POST /api/chat` with `{ "threadId": string, "resume": { "confirm": true | false } }`. `true` continues to **agent-wallet x402** payment for the proposed dataset; `false` cancels that purchase and the graph answers with a short explanation.
- SSE may include `pending_confirmation` (title, price, public URL) before `done` with `"awaitingConfirmation": true`. The demo web app handles this automatically.

Set **`IDE_FRONTEND_BASE_URL`** so listing links match your IDE (paths are `/marketplace/:datasetId`).

## How discovery vs purchase is split

- **MCP**: `ide_list_datasets`, `ide_get_dataset` → no secrets beyond optional `MCP_API_KEY`.
- **Agent**: `wrapFetchWithPayment` + **`AGENT_*`** → `GET {IDE_API_BASE_URL}/api/datasets/:id/download` with `x-payment-wallet`.

## Limitations (demo scope)

- **Wallet funding**: x402 fails if the **agent** wallet lacks USDC/ALGO on testnet.
- **File size / type**: Processing is **capped** and best-effort for text/CSV/JSON; large or binary files are summarized lightly to avoid OOM.
- **LLM choice**: The model may pick a suboptimal or pricier dataset; use `MAX_DATASET_PRICE_USDC` and clearer prompts to steer it.
- **No IDE user JWT**: Agent demo is wallet + x402 only, not logged-in human session.
- **Checkpoint storage**: In-memory only; server restart loses in-flight threads.
- **One mission per `threadId`**: After a completed run, start a **new** `threadId` (the web UI’s **New chat**) before sending another user goal; reusing a finished thread is not supported.
- **No auth / rate limits**: Single-session demo only.

## Scripts

| App | Dev | Build |
|-----|-----|--------|
| `server/` | `npm run dev` | `npm run build` then `npm start` |
| `web/` | `npm run dev` | `npm run build` |
