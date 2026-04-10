import algosdk from "algosdk";
import { appConfig } from "@/config";

export const USDC_ASSET_ID = appConfig.algorand.usdcAssetId;
export const USDC_DECIMALS = 6;

export const algodClient = new algosdk.Algodv2(
  "",
  appConfig.algorand.testnetUrl,
  ""
);

export const indexerClient = new algosdk.Indexer(
  "",
  appConfig.algorand.indexerUrl,
  ""
);

export const toMicroUSDC = (amount: number): bigint =>
  BigInt(Math.round(amount * 10 ** USDC_DECIMALS));

export const fromMicroUSDC = (microAmount: bigint | number): number =>
  Number(microAmount) / 10 ** USDC_DECIMALS;

export async function isOptedIntoUSDC(walletAddress: string): Promise<boolean> {
  try {
    const accountInfo = await algodClient
      .accountInformation(walletAddress)
      .do();
    const assets = (accountInfo as any).assets || [];
    return assets.some(
      (asset: any) =>
        Number(asset["asset-id"] ?? asset.assetId ?? asset["asset_id"]) ===
        USDC_ASSET_ID
    );
  } catch {
    return false;
  }
}

export async function getUSDCBalance(walletAddress: string): Promise<number> {
  try {
    const accountInfo = await algodClient
      .accountInformation(walletAddress)
      .do();
    const assets = (accountInfo as any).assets || [];
    const usdc = assets.find(
      (asset: any) =>
        Number(asset["asset-id"] ?? asset.assetId ?? asset["asset_id"]) ===
        USDC_ASSET_ID
    );
    return usdc ? Number(usdc.amount) / 10 ** USDC_DECIMALS : 0;
  } catch {
    return 0;
  }
}

export async function buildOptInTransaction(
  walletAddress: string
): Promise<string> {
  const suggestedParams = await algodClient.getTransactionParams().do();
  const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    sender: walletAddress,
    receiver: walletAddress,
    amount: 0,
    assetIndex: USDC_ASSET_ID,
    suggestedParams,
  });
  return Buffer.from(algosdk.encodeUnsignedTransaction(txn)).toString("base64");
}

export async function submitSignedTransaction(
  signedTxnBase64: string
): Promise<string> {
  const signedTxnBytes = Buffer.from(signedTxnBase64, "base64");
  const result = await algodClient.sendRawTransaction(signedTxnBytes).do();
  const txid = (result as any).txId ?? (result as any).txid ?? (result as any).txID;
  if (txid) {
    await algosdk.waitForConfirmation(algodClient, txid, 4);
  }
  return txid || "";
}

export async function submitSignedTransactionGroup(
  signedTxnsBase64: string[]
): Promise<string> {
  const signedBytes = signedTxnsBase64.map((t) => Buffer.from(t, "base64"));
  const combined = Buffer.concat(signedBytes);
  const result = await algodClient.sendRawTransaction(combined).do();
  const txid = (result as any).txId ?? (result as any).txid ?? (result as any).txID;
  if (txid) {
    await algosdk.waitForConfirmation(algodClient, txid, 4);
  }
  return txid || "";
}

export async function verifyTransaction(
  txId: string
): Promise<Record<string, unknown>> {
  const txInfo = await indexerClient.lookupTransactionByID(txId).do();
  return txInfo.transaction as unknown as Record<string, unknown>;
}

/**
 * Verify wallet ownership via a signed zero-ALGO transaction.
 * The frontend builds a 0-ALGO payment from the wallet to itself,
 * includes the nonce in the note field, and signs it with Pera.
 * We decode the signed txn, verify sender == claimed address and
 * note contains the nonce. The txn is never submitted on-chain.
 */
export function verifySignedAuthTransaction(
  walletAddress: string,
  nonce: string,
  signedTxnBase64: string
): boolean {
  try {
    const signedTxnBytes = new Uint8Array(
      Buffer.from(signedTxnBase64, "base64")
    );
    const decoded = algosdk.decodeSignedTransaction(signedTxnBytes);

    const txn = decoded.txn as any;

    let senderAddress = "";
    if (txn.sender) {
      senderAddress =
        typeof txn.sender === "string"
          ? txn.sender
          : txn.sender.toString
            ? txn.sender.toString()
            : "";
    }
    if (!senderAddress && txn.from) {
      senderAddress =
        typeof txn.from === "string"
          ? txn.from
          : txn.from.toString
            ? txn.from.toString()
            : "";
    }
    if (!senderAddress && txn.snd) {
      if (txn.snd instanceof Uint8Array) {
        senderAddress = algosdk.encodeAddress(txn.snd);
      } else if (txn.snd.publicKey instanceof Uint8Array) {
        senderAddress = algosdk.encodeAddress(txn.snd.publicKey);
      } else {
        senderAddress = txn.snd.toString ? txn.snd.toString() : "";
      }
    }

    if (senderAddress !== walletAddress) {
      console.error(
        `Auth verify: sender mismatch. Expected ${walletAddress}, got ${senderAddress}`
      );
      return false;
    }

    let noteBytes: Uint8Array | undefined;
    if (txn.note instanceof Uint8Array) {
      noteBytes = txn.note;
    } else if ((decoded as any).txn?.note instanceof Uint8Array) {
      noteBytes = (decoded as any).txn.note;
    }

    if (!noteBytes) {
      console.error("Auth verify: no note field in transaction");
      return false;
    }

    const noteStr = new TextDecoder().decode(noteBytes);
    if (!noteStr.includes(nonce)) {
      console.error(
        `Auth verify: nonce mismatch. Note: "${noteStr}", expected nonce: "${nonce}"`
      );
      return false;
    }

    return true;
  } catch (err) {
    console.error("Auth verify: transaction decode failed:", err);
    return false;
  }
}

export async function buildBountyEscrowTxnGroup(
  buyerAddress: string,
  bountyId: string,
  rewardUSDC: number,
  deadline: number
): Promise<{ unsignedTxnGroupBase64: string[] }> {
  const appId = appConfig.contract.bountyAppId;
  const suggestedParams = await algodClient.getTransactionParams().do();
  const microAmount = toMicroUSDC(rewardUSDC);

  const contractAddress = algosdk.getApplicationAddress(appId);

  const usdcTransferTxn =
    algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      sender: buyerAddress,
      receiver: contractAddress,
      amount: microAmount,
      assetIndex: USDC_ASSET_ID,
      suggestedParams,
    });

  const boxName = new TextEncoder().encode(bountyId);
  const appCallTxn = algosdk.makeApplicationCallTxnFromObject({
    sender: buyerAddress,
    appIndex: appId,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    appArgs: [
      algosdk.encodeUint64(BigInt(appId)),
      new TextEncoder().encode(bountyId),
      algosdk.encodeUint64(microAmount),
      algosdk.encodeUint64(BigInt(deadline)),
    ],
    foreignAssets: [USDC_ASSET_ID],
    boxes: [{ appIndex: appId, name: boxName }],
    suggestedParams,
  });

  algosdk.assignGroupID([usdcTransferTxn, appCallTxn]);

  return {
    unsignedTxnGroupBase64: [
      Buffer.from(algosdk.encodeUnsignedTransaction(usdcTransferTxn)).toString(
        "base64"
      ),
      Buffer.from(algosdk.encodeUnsignedTransaction(appCallTxn)).toString(
        "base64"
      ),
    ],
  };
}

export async function buildAcceptSubmissionTxn(
  buyerAddress: string,
  bountyId: string,
  winnerAddress: string
): Promise<string> {
  const appId = appConfig.contract.bountyAppId;
  const suggestedParams = await algodClient.getTransactionParams().do();
  const boxName = new TextEncoder().encode(bountyId);

  const appCallTxn = algosdk.makeApplicationCallTxnFromObject({
    sender: buyerAddress,
    appIndex: appId,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    appArgs: [
      new TextEncoder().encode(bountyId),
      algosdk.decodeAddress(winnerAddress).publicKey,
    ],
    foreignAssets: [USDC_ASSET_ID],
    accounts: [winnerAddress],
    boxes: [{ appIndex: appId, name: boxName }],
    suggestedParams: { ...suggestedParams, fee: 3000, flatFee: true },
  });

  return Buffer.from(algosdk.encodeUnsignedTransaction(appCallTxn)).toString(
    "base64"
  );
}

export async function buildRefundBountyTxn(
  buyerAddress: string,
  bountyId: string
): Promise<string> {
  const appId = appConfig.contract.bountyAppId;
  const suggestedParams = await algodClient.getTransactionParams().do();
  const boxName = new TextEncoder().encode(bountyId);

  const appCallTxn = algosdk.makeApplicationCallTxnFromObject({
    sender: buyerAddress,
    appIndex: appId,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    appArgs: [new TextEncoder().encode(bountyId)],
    foreignAssets: [USDC_ASSET_ID],
    boxes: [{ appIndex: appId, name: boxName }],
    suggestedParams: { ...suggestedParams, fee: 2000, flatFee: true },
  });

  return Buffer.from(algosdk.encodeUnsignedTransaction(appCallTxn)).toString(
    "base64"
  );
}
