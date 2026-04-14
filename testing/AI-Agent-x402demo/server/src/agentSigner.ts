import { toClientAvmSigner, type ClientAvmSigner } from "@x402-avm/avm";
import algosdk from "algosdk";

/**
 * Agent (buyer) wallet for x402 USDC payments on testnet.
 * Prefer AGENT_PRIVATE_KEY (base64 64-byte secret) or AGENT_ALGOD_MNEMONIC.
 */
export function createAgentAvmSigner(): ClientAvmSigner {
  const pkB64 = process.env.AGENT_PRIVATE_KEY?.trim();
  const mnemonic = process.env.AGENT_ALGOD_MNEMONIC?.trim();
  if (pkB64) {
    return toClientAvmSigner(pkB64);
  }
  if (mnemonic) {
    const { sk } = algosdk.mnemonicToSecretKey(mnemonic);
    return toClientAvmSigner(Buffer.from(sk).toString("base64"));
  }
  throw new Error(
    "Set AGENT_ALGOD_MNEMONIC or AGENT_PRIVATE_KEY (base64-encoded 64-byte Algorand secret key)"
  );
}
