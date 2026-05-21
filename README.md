# 🇮🇳 India Data Exchange

**Where Indian knowledge becomes AI fuel.**

India Data Exchange (IDE) is a **decentralized data marketplace** on **Algorand**. Sellers list **India-relevant datasets** with a public sample and a paid full file; buyers pay **USDC** using the **x402** (HTTP 402) payment flow. **Bounties** lock USDC in **on-chain escrow** until a buyer accepts a submission or refunds per rules. **AI agents** discover listings via **MCP**, pay with a **wallet they control** via the same x402 download API as humans—no separate billing stack.

---

## 🔗 Live Links

_Production deployment (Netlify + custom domains)._

| Resource                   | URL                                                                                                            |
| -------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Marketplace (frontend)** | [https://indiadataexchange.ibhagyesh.com](https://indiadataexchange.ibhagyesh.com/)                            |
| **API (backend)**          | [https://ideapi.ibhagyesh.com](https://ideapi.ibhagyesh.com)                                                   |
| **BountyEscrow (testnet)** | [https://lora.algokit.io/testnet/application/758618118](https://lora.algokit.io/testnet/application/758618118) |

_Local development:_ frontend `http://localhost:3000`, API `http://localhost:5001` (see [Quick Start](#-quick-start-core-app)).

---

## ✨ Features

- 🛒 **Dataset marketplace** — Browse, filter, and inspect listings with public IPFS samples before purchase.
- 💵 **USDC + x402** — Machine-readable **HTTP 402** payments via `@x402-avm` and a **facilitator**; same pattern for browser **Pera Wallet** and **headless agents**.
- 🔐 **Sign-In With Algorand (SIWA)** — Nonce challenge → wallet signature → **JWT** for seller and account APIs.
- 📦 **Pinata IPFS** — Public sample files; **private** full files with **time-limited signed URLs** after verified payment.
- 🎯 **Bounty escrow (smart contract)** — `**BountyEscrow`** locks USDC on-chain; **accept** releases to winner; **refund\*\* when rules allow.
- 🌐 **22 UI locales** — India-first languages across marketplace and core UI (e.g. English, Hindi, Tamil, Telugu, and more under `frontend/src/locales/`).
- 📊 **Dashboards** — Listings, purchases, bounties, submissions, account, and **admin** stats (as implemented in App Router pages).
- 📘 **Docs in-app** — REST **API** and **MCP** documentation routes for integrators.
- 🤖 **MCP server** — `ide_list_datasets` / `ide_get_dataset` proxies the catalog (**read-only**; **no payment keys**).
- 🧠 **AI Agent demo** — **LangGraph** + **Vite/React** chat UI: MCP discovery → LLM shortlist → **human confirm** → **agent wallet x402** → file summary → answer (`testing/AI-Agent-x402demo/`).
- 🧪 **Seed data** — Optional `npm run seed` and curated CSV bundles under repo `**DATA/datasets/`\*\* for demos.

---

## 🎯 Why This Platform Is Unique

| Dimension            | Typical data shops / marketplaces | India Data Exchange                                                                   |
| -------------------- | --------------------------------- | ------------------------------------------------------------------------------------- |
| **Settlement**       | Cards, invoices, opaque APIs      | **USDC on Algorand** with **verifiable** on-chain settlement for downloads            |
| **Agents**           | Scraping or bespoke keys          | **x402** + `**wrapFetchWithPayment`** — same **GET …/download\*\* flow as the web app |
| **Discovery vs pay** | One opaque gateway                | **MCP** for catalog; **buyer wallet** pays IDE API — **separation of concerns**       |
| **Custom data**      | Off-platform contracts            | **Bounties** with **escrow** in `**BountyEscrow`\*\* — rules enforced on-chain        |
| **Audience**         | Global-only                       | **India-relevant** categories + **multilingual** UI for local sellers and buyers      |

---

## 💡 Use Cases

### AI & machine learning

- Sell **labeled images**, **tabular**, or **metadata** for models; buyers preview via sample CSVs before paying for full files.
- **Agents** (research tools, copilots) **list → pay → ingest** datasets without manual API keys beyond a funded wallet.

### Research & smart cities

- Traffic, environmental, or **mobility** datasets for planning (**see `DATA/` traffic examples**).
- Agriculture and **healthcare** corpora for India-specific studies with clear licensing via purchase records.

### Language technology

- **ASR/NLP** corpora (metadata and samples); sellers can ship **voice** or text bundles via IPFS size limits.

### Commissioned data (bounties)

- Buyers **lock USDC** in escrow; sellers **compete** with submissions; buyer **accepts** one winner **on-chain**—suited for **one-off** or **hard-to-find** Indian datasets.

### Platform operators

- **Admin** wallet receives configurable visibility for stats; optional **platform fee** via env (see backend sample).

---

## 📂 Data Categories

- 🌾 **Agriculture** — Crop disease, yield, weather-related data
- 🗣️ **Language** — Speech metadata, corpora, code-switching
- 🚗 **Traffic** — Urban mobility, counts, flow
- 🏥 **Healthcare** — Medicinal plants, wellness metadata
- 🎭 **Cultural** — Heritage, festivals, local commerce
- 💰 **Financial** — Market and economic indicators (where permitted)

---

## ⚠️ Important Constraints

- Dataset price: **$0.10 – $100.00** USDC (platform rules)
- Bounty reward: **$1.00 – $1000.00** USDC
- Sample file max: **10 MB** (public IPFS)
- Full file max: **500 MB** (private IPFS)
- **USDC opt-in** required before listing or bounty actions as enforced by app
- Wallet UX targets **Pera** for human flows

---

## 📁 Repository Structure

```
IndiaDataExchange/
├── frontend/                 # Next.js 15 (App Router), MUI v5, RTK Query, Pera Wallet
│   └── netlify.toml        # Frontend site deploy config (@netlify/plugin-nextjs)
├── backend/                  # Express + TypeScript + MongoDB + x402 + Pinata
│   ├── src/                # Auth, datasets, bounties, user, admin (+ lambda.ts)
│   ├── netlify/            # Netlify Functions entry (api.ts → dist/lambda.js)
│   ├── netlify.toml        # API site deploy config
│   ├── .env.sample
│   └── AlgoKit/            # Algorand smart contracts (Puya)
│       └── smart_contracts/
│           └── BountyEscrow/
├── MCPServer/              # MCP Streamable HTTP — catalog tools only
├── testing/
│   └── AI-Agent-x402demo/  # LangGraph agent + Vite web UI (x402 demo)
└── README.md                 # This file
```

Sample dataset files for seeding or manual upload live in the parent repo: `**DATA/datasets/**` (see that folder’s README).

---

## 🚀 Quick Start (Core App)

### Prerequisites

- **Node.js** ≥ 20
- **MongoDB** (local or Atlas)
- **Pinata** account (API key + secret + gateway JWT)
- **[Pera Wallet](https://perawallet.app/)** (browser / mobile for testnet)
- **[AlgoKit](https://github.com/algorandfoundation/algokit-cli)** (for compiling and deploying `BountyEscrow`)
- Testnet **ALGO** + **USDC** on the configured ASA for wallets you use (human + agent demo)

### 1. Backend

```bash
cd backend
npm install
cp .env.sample .env
# Edit .env — see "Environment variables" below
npm run dev
```

Optional demo data:

```bash
npm run seed
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.local.sample .env.local
# Local: NEXT_PUBLIC_API_BASE_URL=http://localhost:5001
# Production: https://ideapi.ibhagyesh.com
npm run dev
```

Open the Next.js dev URL (usually `http://localhost:3000`).

### 3. BountyEscrow (on-chain bounties)

Required to **create / fund / accept / refund** bounties against the contract.

```bash
cd backend/AlgoKit
npm install
algokit compile ts smart_contracts/BountyEscrow/contract.algo.ts
algokit generate client smart_contracts/artifacts/BountyEscrow
```

Deploy to **testnet** (use testnet settings in `AlgoKit/.env`; see **AlgoKit `.env`** below):

```bash
DEPLOYER_MNEMONIC="your 25 word mnemonic" algokit deploy BountyEscrow
```

Copy the deployed **application ID** into `**BOUNTY_CONTRACT_APP_ID`\*\* in `backend/.env` and restart the API.

---

## 🧪 How to Run All Demos (Full Stack)

Run services in this order so ports and URLs line up with the **defaults** in `.env.sample` files.

| Step | Service             | Default URL             | Purpose                                            |
| ---- | ------------------- | ----------------------- | -------------------------------------------------- |
| 0    | MongoDB             | `localhost:27017`       | Persistence                                        |
| 1    | **IDE backend**     | `http://localhost:5001` | REST + x402 + SIWA                                 |
| 2    | **IDE frontend**    | `http://localhost:3000` | Marketplace UI                                     |
| 3    | **MCP server**      | `http://localhost:5056` | `ide_list_datasets` / `ide_get_dataset` for agents |
| 4    | **AI Agent server** | `http://localhost:5055` | LangGraph + SSE chat                               |
| 5    | **AI Agent web**    | `http://localhost:5173` | Vite UI for confirm/decline                        |

**MCP server**

```bash
cd MCPServer
npm install
cp .env.sample .env
# Set IDE_API_BASE_URL=http://localhost:5001 (or your API)
npm run dev
```

Health: `GET http://localhost:5056/health`  
MCP: `POST http://localhost:5056/mcp` (Streamable HTTP)

**AI Agent demo** (needs OpenAI key + **funded testnet agent wallet** with ALGO + USDC)

```bash
cd testing/AI-Agent-x402demo/server
npm install
cp .env.sample .env
# Fill IDE_API_BASE_URL, IDE_MCP_BASE_URL, OPENAI_API_KEY, AGENT_ALGOD_MNEMONIC (or AGENT_PRIVATE_KEY)
npm run dev
```

```bash
cd testing/AI-Agent-x402demo/web
npm install
# Optional: cp .env.example .env — VITE_AGENT_API_URL=http://localhost:5055
npm run dev
```

Use the Vite URL, send a chat message, **confirm** or **decline** purchase prompts, and inspect the final reply. **New chat** starts a fresh LangGraph thread.

> **Note:** The MCP server holds **no** payer keys. The agent demo signs x402 from `**AGENT_ALGOD_MNEMONIC`** / `**AGENT_PRIVATE_KEY\*\*` only.

---

## 🌐 Deploy to Netlify

**Production:** [Marketplace](https://indiadataexchange.ibhagyesh.com/) · [API](https://ideapi.ibhagyesh.com) (custom domains on two Netlify sites).

Netlify does **not** run a 24/7 Node server. The **backend** runs as a **serverless function** (`serverless-http` + Express). The **frontend** uses **`@netlify/plugin-nextjs`** (official Next.js 15 support).

Use **two Netlify sites** from this monorepo (one repo, two base directories):

| Site        | Base directory | Config file             | Role                                |
| ----------- | -------------- | ----------------------- | ----------------------------------- |
| **IDE API** | `backend`      | `backend/netlify.toml`  | Express → `/.netlify/functions/api` |
| **IDE Web** | `frontend`     | `frontend/netlify.toml` | Next.js marketplace                 |

### Backend site (API)

1. Netlify → **Add new site** → Import repo → **Base directory:** `backend`.
2. Build command / publish are read from `backend/netlify.toml` (`npm ci && npm run build`, functions in `netlify/functions/`). `NPM_CONFIG_PRODUCTION=false` ensures TypeScript build tools install.
3. In **Site configuration → Environment variables**, copy every key from `backend/.env.sample`. **Required for production:**
   - `MONGODB_URI` — use **MongoDB Atlas** (serverless cannot use `localhost`).
   - `JWT_SECRET`, Pinata keys, `ADMIN_WALLET_ADDRESS`, Algorand URLs, `USDC_ASSET_ID`, `FACILITATOR_URL`, `BOUNTY_CONTRACT_APP_ID`.
   - **`API_PUBLIC_BASE_URL`** — public API origin, e.g. `https://ideapi.ibhagyesh.com` (no trailing slash). Used in `purchaseApiUrl` for x402. Must match your custom domain or Netlify site URL.
4. `NETLIFY=true` is set in `netlify.toml` automatically → **~6 MB** request/upload limit (Netlify payload cap). Large dataset uploads need a dedicated host or direct Pinata workflow.
5. Deploy. Test: `https://ideapi.ibhagyesh.com/healthz`

If the build fails on **secrets scanning** (public testnet URLs, USDC ASA id, `.env.sample`), `backend/netlify.toml` already sets `SECRETS_SCAN_OMIT_PATHS` / `SECRETS_SCAN_OMIT_KEYS`. Commit that file before redeploying.

### Frontend site (Next.js)

1. **Second Netlify site** → same repo → **Base directory:** `frontend`.
2. **Publish directory:** leave empty in the UI, or set to `.next` — `frontend/netlify.toml` sets `publish = ".next"`. Do **not** set publish to `frontend` or `.` (same as base → plugin error).
3. Env vars from `frontend/.env.local.sample`:
   - **`NEXT_PUBLIC_API_BASE_URL`** = `https://ideapi.ibhagyesh.com` (same origin as backend `API_PUBLIC_BASE_URL`).
   - `NEXT_PUBLIC_ALGORAND_NETWORK`, `NEXT_PUBLIC_USDC_ASSET_ID`, `NEXT_PUBLIC_PINATA_GATEWAY`.
4. Deploy. Custom domain example: [https://indiadataexchange.ibhagyesh.com](https://indiadataexchange.ibhagyesh.com/). Connect Pera (testnet).

### Local vs Netlify

|              | Local (`npm run dev`) | Netlify API                                   |
| ------------ | --------------------- | --------------------------------------------- |
| Process      | Long-running Node     | Lambda per request                            |
| MongoDB      | Local or Atlas        | **Atlas** recommended                         |
| Upload limit | Up to 500 MB (config) | **~6 MB** per request                         |
| Entry        | `src/index.ts`        | `netlify/functions/api.ts` → `dist/lambda.js` |

**MCP** and **AI-Agent** demos still run on a **long-running** host (Railway, Render, Fly.io, or local)—not on this Netlify API function bundle.

---

## 🔐 Environment Variables (Complete Reference)

Copy from each package’s `**.env.sample**` / `**.env.example**`. Never commit real secrets or mnemonics.

### Backend — `backend/.env`

| Variable                                  | Required           | Description                                                                                  |
| ----------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------- |
| `PORT`                                    | Yes                | HTTP port (sample: **5001**).                                                                |
| `NODE_ENV`                                | No                 | e.g. `development` / `production`.                                                           |
| `API_PUBLIC_BASE_URL`                     | **Yes on Netlify** | Public API URL — production: `https://ideapi.ibhagyesh.com`; local: `http://localhost:5001`. |
| `NETLIFY`                                 | Auto on Netlify    | Set in `backend/netlify.toml`; enables serverless upload/body limits.                        |
| `MONGODB_URI`                             | Yes                | Mongo connection string.                                                                     |
| `JWT_SECRET`                              | Yes                | Min ~32 chars; signs SIWA session JWT.                                                       |
| `JWT_EXPIRES_IN`                          | No                 | e.g. `7d`.                                                                                   |
| `ALGORAND_TESTNET_URL`                    | Yes                | Algod REST (e.g. Algonode testnet).                                                          |
| `ALGORAND_INDEXER_URL`                    | Yes                | Indexer base URL (testnet).                                                                  |
| `USDC_ASSET_ID`                           | Yes                | Testnet USDC ASA ID (sample **10458941**).                                                   |
| `BOUNTY_CONTRACT_APP_ID`                  | Yes for bounties   | Deployed **BountyEscrow** app ID; use `0` only if you skip bounties.                         |
| `PINATA_API_KEY`                          | Yes                | Pinata API key.                                                                              |
| `PINATA_API_SECRET`                       | Yes                | Pinata API secret.                                                                           |
| `PINATA_GATEWAY_TOKEN`                    | Yes                | JWT for **private** gateway / signed retrieval (Pinata dashboard).                           |
| `FACILITATOR_URL`                         | Yes                | x402 facilitator (sample: GoPlausible).                                                      |
| `ADMIN_WALLET_ADDRESS`                    | Yes                | Algorand address with **admin** API access.                                                  |
| `PLATFORM_FEE_PERCENTAGE`                 | No                 | Optional platform fee (sample `0`).                                                          |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | No                 | Throttling windows.                                                                          |

### Frontend — `frontend/.env.local`

| Variable                       | Required | Description                                                                                  |
| ------------------------------ | -------- | -------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL`     | Yes      | IDE API origin — production: `https://ideapi.ibhagyesh.com`; local: `http://localhost:5001`. |
| `NEXT_PUBLIC_ALGORAND_NETWORK` | Yes      | e.g. `testnet`.                                                                              |
| `NEXT_PUBLIC_USDC_ASSET_ID`    | Yes      | Same ASA as backend.                                                                         |
| `NEXT_PUBLIC_PINATA_GATEWAY`   | Yes      | Public IPFS gateway prefix for samples (e.g. Pinata gateway).                                |

### MCP server — `MCPServer/.env`

| Variable           | Required | Description                                                                                          |
| ------------------ | -------- | ---------------------------------------------------------------------------------------------------- |
| `IDE_API_BASE_URL` | Yes      | IDE **backend** origin — production: `https://ideapi.ibhagyesh.com`; local: `http://localhost:5001`. |
| `PORT`             | No       | Default **5056**.                                                                                    |
| `BIND_HOST`        | No       | See MCP README (`0.0.0.0` for PaaS).                                                                 |
| `MCP_API_KEY`      | No       | If set, clients send `Authorization: Bearer` or `X-MCP-API-Key`.                                     |

### AI Agent demo — `testing/AI-Agent-x402demo/server/.env`

| Variable                                          | Required | Description                                                                                                                   |
| ------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `PORT`                                            | No       | Default **5055**.                                                                                                             |
| `CORS_ORIGIN`                                     | No       | Vite origin (sample `http://localhost:5173`).                                                                                 |
| `IDE_API_BASE_URL`                                | Yes      | IDE API — **x402** `GET .../api/datasets/:id/download` — production: `https://ideapi.ibhagyesh.com`.                          |
| `IDE_MCP_BASE_URL`                                | Yes      | MCP server (**no** trailing slash).                                                                                           |
| `IDE_MCP_API_KEY`                                 | No       | Must match `MCPServer` `MCP_API_KEY` if enabled.                                                                              |
| `IDE_FRONTEND_BASE_URL`                           | No       | Marketplace for “view listing” links — production: `https://indiadataexchange.ibhagyesh.com`; local: `http://localhost:3000`. |
| `OPENAI_API_KEY`                                  | Yes      | OpenAI API key (`gpt-4o-mini` usage).                                                                                         |
| `AGENT_ALGOD_MNEMONIC` **or** `AGENT_PRIVATE_KEY` | Yes      | **Buyer** wallet for x402 (base64 64-byte secret if using key).                                                               |
| `MAX_DATASET_PRICE_USDC`                          | No       | Caps candidate prices passed to the LLM.                                                                                      |
| `MAX_DOWNLOAD_BYTES`                              | No       | Cap bytes read from purchased file.                                                                                           |
| `MCP_LIST_DATASETS_LIMIT`                         | No       | Page size for `ide_list_datasets`.                                                                                            |

### AI Agent web — `testing/AI-Agent-x402demo/web/.env`

| Variable             | Required | Description                                                  |
| -------------------- | -------- | ------------------------------------------------------------ |
| `VITE_AGENT_API_URL` | No       | Agent server URL (default in code: `http://localhost:5055`). |

### AlgoKit deploy — `backend/AlgoKit/.env`

Used by `**algokit deploy`\*\*, not by the Express app.

| Variable                                | Description                                                                                                                                                             |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DEPLOYER_MNEMONIC`                     | 25-word account that pays deployment and app calls during deploy.                                                                                                       |
| `ALGOD_*` / `INDEXER_*` / `ALGOKIT_ENV` | Point to **testnet** when deploying **BountyEscrow** for IDE testnet. The sample file may show mainnet — **override for testnet** to match `USDC_ASSET_ID` and wallets. |

---

## 🔁 Core Flows

### Authentication (SIWA)

1. `GET /auth/nonce/:walletAddress` → nonce payload
2. User signs with Pera (`signData`)
3. `POST /auth/verify` → JWT
4. `Authorization: Bearer <jwt>` on protected routes

Privacy/terms consent and USDC opt-in flows are integrated in the UI where applicable.

### Dataset purchase (x402)

1. `GET /api/datasets/:id/download` → **402** + payment requirements
2. Client pays seller in **USDC** via x402 flow; facilitator verifies/settles
3. Backend records purchase and returns **signed** access to the full file

Agents:

```typescript
import { wrapFetchWithPayment } from "@x402-avm/fetch";
const payingFetch = wrapFetchWithPayment(fetch, { agentWallet });
await payingFetch(`https://ideapi.ibhagyesh.com/api/datasets/${id}/download`);
// Local: http://localhost:5001/api/datasets/${id}/download
```

### Bounty lifecycle

```
Buyer initiates → backend builds atomic txn group → wallet signs →
USDC locked in BountyEscrow → sellers submit (sample public, full private on IPFS) →
buyer accepts winner → accept txn → USDC to winner; or refund path when valid
```

---

## 📡 API Endpoints (summary)

| Method            | Path                                 | Auth           | Description                                         |
| ----------------- | ------------------------------------ | -------------- | --------------------------------------------------- |
| GET               | `/auth/nonce/:wallet`                | No             | SIWA nonce                                          |
| POST              | `/auth/verify`                       | No             | Verify signature, JWT                               |
| GET               | `/auth/usdc-status/:wallet`          | No             | USDC opt-in                                         |
| POST              | `/auth/build-optin` / `submit-optin` | No             | Opt-in txns                                         |
| GET               | `/api/datasets`                      | No             | List datasets                                       |
| GET               | `/api/datasets/:id`                  | No             | Detail                                              |
| GET               | `/api/datasets/:id/download`         | **402 / x402** | Paid download                                       |
| POST/PATCH/DELETE | `/api/datasets` …                    | JWT            | Create / update / soft-delete                       |
| GET/POST          | `/api/bounties` …                    | JWT            | Bounty lifecycle (see route handlers)               |
| GET               | `/api/user/`\*                       | JWT            | Profile, listings, purchases, bounties, submissions |
| GET               | `/api/admin/stats`                   | JWT + Admin    | Platform stats                                      |

**Swagger** is enabled on the backend for interactive exploration.

---

## 📜 Smart Contract — `BountyEscrow`

**Path:** `backend/AlgoKit/smart_contracts/BountyEscrow/contract.algo.ts`

| Method                                      | Description                              |
| ------------------------------------------- | ---------------------------------------- |
| `postBounty(bountyId, amount, deadline)`    | Lock USDC (grouped USDC xfer + app call) |
| `acceptSubmission(bountyId, winnerAddress)` | Release to winner (buyer)                |
| `refundBounty(bountyId)`                    | Refund buyer when allowed                |
| `getBountyEscrow(bountyId)`                 | Read state                               |

**Storage:** `BoxMap` keyed by bounty id.

---

## 🤝 Contributing

Pull requests and ideas are welcome. For larger features, open an issue first so we can align on scope and API shape.

---

## 🙏 Appreciation

Thank you for exploring **India Data Exchange**. This project was built to make **Indian datasets** easier to **discover**, **pay for**, and **use**—by people and by **agents**—on **Algorand**, with **clear separation** between **catalog discovery** (MCP) and **wallet-based settlement** (x402).

If this work helped you ship a demo, integration, or product idea, a ⭐ on the repository and a shout-out in the community are always appreciated.

---

## 👨‍💻 About the Author

Built and maintained by **Bhagyesh Jahangirpuria**.

- 🌐 Website: [https://ibhagyesh.com](https://ibhagyesh.com)
- 🔗 LinkedIn: [https://in.linkedin.com/in/ibhagyesh](https://in.linkedin.com/in/ibhagyesh)

**Open to collaborations, feedback, and consulting on Algorand, data marketplaces, and agentic payments.**

---

**Made with ❤️ for the Algorand community**

If India Data Exchange helps you connect data, models, and real-world use cases—**we would love to hear about it**.
