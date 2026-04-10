import { x402ResourceServer, HTTPFacilitatorClient, x402HTTPResourceServer } from "@x402-avm/core/server";
import { paymentMiddlewareFromHTTPServer } from "@x402-avm/express";
import { registerExactAvmScheme } from "@x402-avm/avm/exact/server";
import { ALGORAND_TESTNET_CAIP2, USDC_TESTNET_ASA_ID } from "@x402-avm/avm";
import type { Network } from "@x402-avm/core/types";
import type { RoutesConfig } from "@x402-avm/core/server";
import { appConfig } from "@/config";
import { DatasetRepository } from "@components/dataset/database/repository/dataset.repository";
import { PurchaseRepository } from "@components/purchase/database/repository/purchase.repository";
import { UserRepository } from "@components/user/database/repository/user.repository";
import { getSignedUrl } from "@libraries/pinata.service";

const datasetRepo = new DatasetRepository();
const purchaseRepo = new PurchaseRepository();
const userRepo = new UserRepository();

function extractDatasetIdFromPath(path: string): string | null {
  const match = path.match(/\/api\/datasets\/([^/]+)\/download/);
  return match?.[1] ?? null;
}

const facilitatorClient = new HTTPFacilitatorClient({
  url: appConfig.facilitator.url,
});

const resourceServer = new x402ResourceServer(facilitatorClient);
registerExactAvmScheme(resourceServer);

resourceServer.onAfterSettle(async (context) => {
  try {
    const { result, requirements } = context;
    const transportContext = context.transportContext as
      | { request: { path: string } }
      | undefined;

    if (!transportContext?.request?.path) return;

    const datasetId = extractDatasetIdFromPath(transportContext.request.path);
    if (!datasetId) return;

    const buyerWalletAddress = result.payer || "";
    const paymentTxId = result.transaction;
    const amountUSDC = parseInt(requirements.amount) / 1_000_000;

    const dataset = await datasetRepo.findByIdWithFullData(datasetId);
    if (!dataset) return;

    const existingPurchase = await purchaseRepo.findByWalletAndDataset(
      buyerWalletAddress,
      datasetId
    );
    if (existingPurchase) return;

    const isHuman = false;
    await purchaseRepo.create({
      buyerWalletAddress,
      datasetId: datasetId as unknown as import("mongoose").Types.ObjectId,
      paymentTxId,
      amountPaidUSDC: amountUSDC,
      downloadCount: 1,
      lastDownloadAt: new Date(),
      redownloadExpiresAt: isHuman
        ? undefined
        : new Date(Date.now() + 24 * 60 * 60 * 1000),
      isHuman,
    });

    await datasetRepo.incrementPurchases(datasetId);

    const seller = await userRepo.findByWallet(dataset.sellerWalletAddress);
    if (seller) {
      await userRepo.update(seller._id!.toString(), {
        totalEarnings: (seller.totalEarnings || 0) + amountUSDC,
      });
    }
  } catch (error) {
    console.error("[x402] Error recording purchase after settlement:", error);
  }
});

const downloadRoutes: RoutesConfig = {
  "GET /api/datasets/*/download": {
    accepts: {
      scheme: "exact",
      network: ALGORAND_TESTNET_CAIP2 as Network,
      payTo: async (context: { path: string }) => {
        const datasetId = extractDatasetIdFromPath(context.path);
        if (!datasetId) throw new Error("Dataset ID not found in path");
        const dataset = await datasetRepo.findById(datasetId);
        if (!dataset) throw new Error("Dataset not found");
        return dataset.sellerWalletAddress;
      },
      price: async (context: { path: string }) => {
        const datasetId = extractDatasetIdFromPath(context.path);
        if (!datasetId) throw new Error("Dataset ID not found in path");
        const dataset = await datasetRepo.findById(datasetId);
        if (!dataset) throw new Error("Dataset not found");
        return `$${dataset.priceUSDC.toFixed(2)}`;
      },
      extra: {
        asset: USDC_TESTNET_ASA_ID as string,
      },
    },
    description: "Purchase and download full dataset via USDC on Algorand",
  },
};

const httpResourceServer = new x402HTTPResourceServer(
  resourceServer,
  downloadRoutes
);

httpResourceServer.onProtectedRequest(async (context) => {
  try {
    const adapter = context.adapter;
    const walletAddress =
      adapter.getHeader("x-payment-wallet") ||
      adapter.getHeader("X-Payment-Wallet");
    if (!walletAddress) return;

    const datasetId = extractDatasetIdFromPath(context.path);
    if (!datasetId) return;

    const hasAccess = await purchaseRepo.hasValidAccess(
      walletAddress,
      datasetId
    );
    if (hasAccess) {
      return { grantAccess: true as const };
    }
  } catch {
    /* continue to payment flow */
  }
});

export const x402PaymentMiddleware = paymentMiddlewareFromHTTPServer(
  httpResourceServer
);

export { resourceServer, facilitatorClient, getSignedUrl };
