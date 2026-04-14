import { config as dotenvConfig } from "dotenv";
import { bool, cleanEnv, num, port, str } from "envalid";

dotenvConfig({ path: ".env" });
if (process.env.NODE_ENV) {
  dotenvConfig({ path: `.env.${process.env.NODE_ENV}`, override: true });
}

const env = cleanEnv(process.env, {
  NODE_ENV: str({ default: "development" }),
  PORT: port({ default: 5000 }),

  MONGODB_URI: str({ default: "mongodb://localhost:27017/india-data-exchange" }),

  JWT_SECRET: str({ default: "change-this-secret-in-production-min-32-chars" }),
  JWT_EXPIRES_IN: str({ default: "7d" }),

  ALGORAND_TESTNET_URL: str({ default: "https://testnet-api.algonode.cloud" }),
  ALGORAND_INDEXER_URL: str({ default: "https://testnet-idx.algonode.cloud" }),
  USDC_ASSET_ID: num({ default: 10458941 }),

  BOUNTY_CONTRACT_APP_ID: num({ default: 0 }),

  PINATA_API_KEY: str({ default: "" }),
  PINATA_API_SECRET: str({ default: "" }),
  PINATA_GATEWAY_TOKEN: str({ default: "" }),

  FACILITATOR_URL: str({ default: "https://facilitator.goplausible.xyz" }),

  ADMIN_WALLET_ADDRESS: str({ default: "" }),

  PLATFORM_FEE_PERCENTAGE: num({ default: 0 }),

  BODY_SIZE_LIMIT: str({ default: "550mb" }),
  RATE_LIMIT_WINDOW_MS: num({ default: 60_000 }),
  RATE_LIMIT_MAX: num({ default: 300 }),

  LOG_TO_FILE: bool({ default: false }),

  /** Base URL for Algorand transaction links (no trailing tx id). */
  ALGO_EXPLORER_TX_URL: str({ default: "https://lora.algokit.io/testnet/transaction" }),
});

export const appConfig = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,

  db: {
    uri: env.MONGODB_URI,
  },

  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  },

  algorand: {
    testnetUrl: env.ALGORAND_TESTNET_URL,
    indexerUrl: env.ALGORAND_INDEXER_URL,
    usdcAssetId: env.USDC_ASSET_ID,
  },

  contract: {
    bountyAppId: env.BOUNTY_CONTRACT_APP_ID,
  },

  pinata: {
    apiKey: env.PINATA_API_KEY,
    apiSecret: env.PINATA_API_SECRET,
    gatewayToken: env.PINATA_GATEWAY_TOKEN,
  },

  facilitator: {
    url: env.FACILITATOR_URL,
  },

  admin: {
    walletAddress: env.ADMIN_WALLET_ADDRESS,
  },

  platform: {
    feePercentage: env.PLATFORM_FEE_PERCENTAGE,
  },

  http: {
    bodySizeLimit: env.BODY_SIZE_LIMIT,
  },

  security: {
    rateLimitWindowMs: env.RATE_LIMIT_WINDOW_MS,
    rateLimitMax: env.RATE_LIMIT_MAX,
  },

  logging: {
    logToFile: env.LOG_TO_FILE,
  },

  explorer: {
    algoTxUrlBase: env.ALGO_EXPLORER_TX_URL.replace(/\/$/, ""),
  },
} as const;
