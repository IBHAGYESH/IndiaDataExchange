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
    const accountInfo = await algodClient.accountInformation(walletAddress).do();
    const assets: Array<{ "asset-id": number }> = accountInfo.assets || [];
    return assets.some((asset) => asset["asset-id"] === USDC_ASSET_ID);
  } catch {
    return false;
  }
}

export async function getUSDCBalance(walletAddress: string): Promise<number> {
  try {
    const accountInfo = await algodClient.accountInformation(walletAddress).do();
    const assets: Array<{ "asset-id": number; amount: number }> = accountInfo.assets || [];
    const usdc = assets.find((asset) => asset["asset-id"] === USDC_ASSET_ID);
    return usdc ? Number(usdc.amount) / 10 ** USDC_DECIMALS : 0;
  } catch {
    return 0;
  }
}

export async function buildOptInTransaction(walletAddress: string): Promise<string> {
  const suggestedParams = await algodClient.getTransactionParams().do();
  const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: walletAddress,
    to: walletAddress,
    amount: 0,
    assetIndex: USDC_ASSET_ID,
    suggestedParams,
  });
  return Buffer.from(algosdk.encodeUnsignedTransaction(txn)).toString("base64");
}

export async function submitSignedTransaction(signedTxnBase64: string): Promise<string> {
  const signedTxnBytes = Buffer.from(signedTxnBase64, "base64");
  const { txId } = await algodClient.sendRawTransaction(signedTxnBytes).do();
  await algosdk.waitForConfirmation(algodClient, txId, 4);
  return txId;
}

export async function submitSignedTransactionGroup(
  signedTxnsBase64: string[]
): Promise<string> {
  const signedBytes = signedTxnsBase64.map((t) => Buffer.from(t, "base64"));
  const combined = Buffer.concat(signedBytes);
  const { txId } = await algodClient.sendRawTransaction(combined).do();
  await algosdk.waitForConfirmation(algodClient, txId, 4);
  return txId;
}

export async function verifyTransaction(txId: string): Promise<Record<string, unknown>> {
  const txInfo = await indexerClient.lookupTransactionByID(txId).do();
  return txInfo.transaction;
}

export async function verifyWalletSignature(
  walletAddress: string,
  nonce: string,
  signature: string
): Promise<boolean> {
  try {
    const encodedNonce = new TextEncoder().encode(nonce);
    const signatureBytes = Buffer.from(signature, "base64");
    const publicKey = algosdk.decodeAddress(walletAddress).publicKey;
    return algosdk.verifyBytes(encodedNonce, signatureBytes, publicKey);
  } catch {
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

  const usdcTransferTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: buyerAddress,
    to: contractAddress,
    amount: microAmount,
    assetIndex: USDC_ASSET_ID,
    suggestedParams,
  });

  const boxName = new TextEncoder().encode(bountyId);
  const appCallTxn = algosdk.makeApplicationCallTxnFromObject({
    from: buyerAddress,
    appIndex: appId,
    onCompletion: algosdk.OnApplicationComplete.NoOpOC,
    appArgs: [
      algosdk.encodeUint64(BigInt(appId)), // selector placeholder
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
      Buffer.from(algosdk.encodeUnsignedTransaction(usdcTransferTxn)).toString("base64"),
      Buffer.from(algosdk.encodeUnsignedTransaction(appCallTxn)).toString("base64"),
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
    from: buyerAddress,
    appIndex: appId,
    onCompletion: algosdk.OnApplicationComplete.NoOpOC,
    appArgs: [
      new TextEncoder().encode(bountyId),
      algosdk.decodeAddress(winnerAddress).publicKey,
    ],
    foreignAssets: [USDC_ASSET_ID],
    accounts: [winnerAddress],
    boxes: [{ appIndex: appId, name: boxName }],
    suggestedParams: { ...suggestedParams, fee: 3000, flatFee: true },
  });

  return Buffer.from(algosdk.encodeUnsignedTransaction(appCallTxn)).toString("base64");
}

export async function buildRefundBountyTxn(
  buyerAddress: string,
  bountyId: string
): Promise<string> {
  const appId = appConfig.contract.bountyAppId;
  const suggestedParams = await algodClient.getTransactionParams().do();
  const boxName = new TextEncoder().encode(bountyId);

  const appCallTxn = algosdk.makeApplicationCallTxnFromObject({
    from: buyerAddress,
    appIndex: appId,
    onCompletion: algosdk.OnApplicationComplete.NoOpOC,
    appArgs: [new TextEncoder().encode(bountyId)],
    foreignAssets: [USDC_ASSET_ID],
    boxes: [{ appIndex: appId, name: boxName }],
    suggestedParams: { ...suggestedParams, fee: 2000, flatFee: true },
  });

  return Buffer.from(algosdk.encodeUnsignedTransaction(appCallTxn)).toString("base64");
}
