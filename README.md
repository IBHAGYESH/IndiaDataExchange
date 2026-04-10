# 🇮🇳 India Data Exchange

> **Where Indian Knowledge Becomes AI Fuel**

A decentralized data marketplace built on Algorand where sellers upload Indian datasets and buyers purchase them using USDC via the x402 payment protocol. AI agents can autonomously browse and purchase datasets using HTTP 402 payments.

Built for **AlgoBharat Hack Series 3.0 — Agentic Commerce Track**.

---

## Architecture

```
IndiaDataExchange/
├── frontend/          # Next.js 15 + MUI v5 + RTK Query + Pera Wallet
└── backend/           # Express + TypeScript + MongoDB + Pinata IPFS
    ├── src/           # Application code
    └── AlgoKit/       # Algorand smart contracts (Puya)
        └── smart_contracts/
            └── BountyEscrow/        # Our bounty escrow contract
```

## Key Technologies

| Layer          | Technology                                                                        |
| -------------- | --------------------------------------------------------------------------------- |
| Frontend       | Next.js 15 (App Router), MUI v5, RTK Query, `@perawallet/connect`                 |
| Payments       | `@x402-avm/fetch` (client), `@x402-avm/express` (server), GoPlausible facilitator |
| Blockchain     | Algorand Testnet, USDC (ASA ID: 10458941)                                         |
| Smart Contract | Algorand TypeScript / Puya compiler (`.algo.ts`)                                  |
| Storage        | MongoDB Atlas + Pinata IPFS                                                       |
| Auth           | Sign-In With Algorand (SIWA) — nonce → signature → JWT                            |

---

## Quick Start

### Prerequisites

- Node.js ≥ 20
- MongoDB (local or Atlas)
- Pinata account (for IPFS)
- Pera Wallet
- AlgoKit (for smart contract deployment)

### Backend

```bash
cd backend

# Install dependencies
npm install

# Copy and configure environment
cp .env.sample .env
# Edit .env with your values

# Run in development mode
npm run dev

# Seed demo data (optional)
npm run seed
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy and configure environment
cp .env.local.sample .env.local
# Edit .env.local

# Run in development mode
npm run dev
```

### Smart Contract (BountyEscrow)

```bash
cd backend/AlgoKit

# Install AlgoKit dependencies
npm install

# Compile the contract
algokit compile ts smart_contracts/BountyEscrow/contract.algo.ts

# Generate TypeScript client
algokit generate client smart_contracts/artifacts/BountyEscrow

# Deploy to testnet
# Set DEPLOYER mnemonic in .env or environment
DEPLOYER_MNEMONIC="your 25 word mnemonic" algokit deploy BountyEscrow
# Update BOUNTY_CONTRACT_APP_ID in backend/.env with the deployed app ID
```

---

## Core Flows

### 1. Authentication (Sign-In With Algorand)

1. Frontend calls `GET /auth/nonce/:walletAddress`
2. User signs nonce message via Pera Wallet (`signData`)
3. Frontend sends signature to `POST /auth/verify`
4. Backend verifies with `algosdk.verifyBytes`, issues JWT
5. JWT stored in localStorage, sent as `Authorization: Bearer <token>`

### 2. Dataset Purchase (x402 Protocol)

1. Frontend (or AI agent) sends `GET /api/datasets/:id/download`
2. Backend returns `HTTP 402` with payment requirements (price + seller address)
3. Client builds USDC asset transfer to seller, signs via Pera
4. Submits transaction to Algorand, gets `txId`
5. Sends download request with `X-Payment: <txId>` header
6. Backend verifies, creates purchase record, returns signed Pinata URL

**AI agents** use `@x402-avm/fetch` to handle this transparently:

```typescript
import { wrapFetchWithPayment } from "@x402-avm/fetch";
const payingFetch = wrapFetchWithPayment(fetch, { agentWallet });
const data = await payingFetch(
  "http://api.indiadataexchange.xyz/api/datasets/abc/download",
);
```

### 3. Bounty Lifecycle

```
Buyer initiates → Backend builds atomic txn group → Pera signs both →
USDC locked in BountyEscrow contract on Algorand →
Sellers submit datasets (sample public, full private on IPFS) →
Buyer reviews, accepts winner → Backend builds accept txn →
Pera signs → USDC released to winner via inner transaction
```

---

## API Endpoints

| Method | Path                                      | Auth      | Description                              |
| ------ | ----------------------------------------- | --------- | ---------------------------------------- |
| GET    | `/auth/nonce/:wallet`                     | No        | Get SIWA nonce                           |
| POST   | `/auth/verify`                            | No        | Verify signature, get JWT                |
| GET    | `/auth/usdc-status/:wallet`               | No        | Check USDC opt-in                        |
| POST   | `/auth/build-optin`                       | No        | Build opt-in txn                         |
| POST   | `/auth/submit-optin`                      | No        | Submit signed opt-in                     |
| GET    | `/api/datasets`                           | No        | List active datasets                     |
| GET    | `/api/datasets/:id`                       | No        | Get dataset details                      |
| GET    | `/api/datasets/:id/download`              | 402       | Download full dataset                    |
| POST   | `/api/datasets`                           | JWT       | Create dataset listing                   |
| PATCH  | `/api/datasets/:id`                       | JWT       | Update dataset                           |
| DELETE | `/api/datasets/:id`                       | JWT       | Soft-delete dataset                      |
| GET    | `/api/bounties`                           | JWT       | List bounties                            |
| GET    | `/api/bounties/:id`                       | JWT       | Get bounty details                       |
| POST   | `/api/bounties`                           | JWT       | Initiate bounty (returns unsigned txn)   |
| POST   | `/api/bounties/:id/confirm`               | JWT       | Confirm bounty after signing             |
| POST   | `/api/bounties/:id/submit`                | JWT       | Submit to bounty                         |
| POST   | `/api/bounties/:id/accept/:subId`         | JWT       | Accept submission (returns unsigned txn) |
| POST   | `/api/bounties/:id/accept/:subId/confirm` | JWT       | Confirm acceptance                       |
| POST   | `/api/bounties/:id/refund`                | JWT       | Initiate refund (returns unsigned txn)   |
| POST   | `/api/bounties/:id/refund/confirm`        | JWT       | Confirm refund                           |
| GET    | `/api/user/profile`                       | JWT       | Get user profile + stats                 |
| GET    | `/api/user/listings`                      | JWT       | Get user's datasets                      |
| GET    | `/api/user/purchases`                     | JWT       | Get user's purchases                     |
| GET    | `/api/user/bounties`                      | JWT       | Get user's bounties                      |
| GET    | `/api/user/submissions`                   | JWT       | Get user's submissions                   |
| GET    | `/api/admin/stats`                        | JWT+Admin | Platform stats                           |

---

## Smart Contract (BountyEscrow)

Location: `backend/AlgoKit/smart_contracts/BountyEscrow/contract.algo.ts`

| Method                                      | Description                                                  |
| ------------------------------------------- | ------------------------------------------------------------ |
| `postBounty(bountyId, amount, deadline)`    | Lock USDC in escrow (requires grouped USDC axfer + app call) |
| `acceptSubmission(bountyId, winnerAddress)` | Release USDC to winner (buyer only)                          |
| `refundBounty(bountyId)`                    | Return USDC to buyer (after deadline)                        |
| `getBountyEscrow(bountyId)`                 | Read bounty state (readonly)                                 |

Box storage: `BoxMap<bytes, BountyData>` keyed by bountyId

---

## Environment Variables

### Backend (.env)

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/india-data-exchange
JWT_SECRET=your-secret-min-32-chars
ALGORAND_TESTNET_URL=https://testnet-api.algonode.cloud
ALGORAND_INDEXER_URL=https://testnet-idx.algonode.cloud
USDC_ASSET_ID=10458941
BOUNTY_CONTRACT_APP_ID=<deployed-app-id>
PINATA_API_KEY=<your-pinata-key>
PINATA_API_SECRET=<your-pinata-secret>
PINATA_GATEWAY_TOKEN=<your-gateway-token>
FACILITATOR_URL=https://facilitator.goplausible.xyz
ADMIN_WALLET_ADDRESS=<your-admin-wallet>
```

### Frontend (.env.local)

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
NEXT_PUBLIC_ALGORAND_NETWORK=testnet
NEXT_PUBLIC_USDC_ASSET_ID=10458941
NEXT_PUBLIC_PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs
```

---

## Data Categories

- 🌾 **Agriculture** — Crop disease images, yield data, weather correlations
- 🗣️ **Language** — Voice recordings, text corpora, code-switching datasets
- 🚗 **Traffic** — Urban mobility, intersection counts, flow patterns
- 🏥 **Healthcare** — Medicinal plant images, Ayurvedic data, medical records
- 🎭 **Cultural** — Heritage sites, festivals, artisan documentation
- 💰 **Financial** — Market data, transactions, economic indicators

---

## Important Constraints

- Prices: $0.10 – $100.00 USDC per dataset
- Bounty rewards: $1.00 – $1000.00 USDC
- Sample files: max 10MB (public IPFS)
- Full data files: max 500MB (private IPFS, signed URLs)
- USDC opt-in required before listing or submitting bounties
- All wallet operations use Pera Wallet
