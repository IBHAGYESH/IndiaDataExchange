/**
 * Algod POST /v2/transactions returns JSON `{ txId: "..." }` but algosdk's
 * PostTransactionsResponse maps it to the property `txid` (lowercase).
 * Using `{ txId }` from `.do()` is always undefined — use this helper instead.
 */
export function submittedTxIdFromAlgodResponse(response: {
  txid?: string;
  txId?: string;
}): string {
  const id = response.txid ?? response.txId;
  if (!id) {
    throw new Error("Algod response did not include a transaction id");
  }
  return id;
}
