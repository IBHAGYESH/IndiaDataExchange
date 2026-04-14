import { wrapFetchWithPayment, x402Client } from "@x402-avm/fetch";
import { registerExactAvmScheme } from "@x402-avm/avm/exact/client";
import { createAgentAvmSigner } from "./agentSigner.js";

export interface PaymentFetchContext {
  fetchWithPayment: typeof fetch;
  payerAddress: string;
}

export function createPaymentFetchContext(): PaymentFetchContext {
  const signer = createAgentAvmSigner();
  const client = new x402Client();
  registerExactAvmScheme(client, { signer });
  return {
    fetchWithPayment: wrapFetchWithPayment(fetch, client),
    payerAddress: signer.address,
  };
}
