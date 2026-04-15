"use client";

import {
  Button,
  CircularProgress,
  Alert,
  Box,
  Typography,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import { useState, useMemo, useCallback } from "react";
import { useAuth } from "@/providers/auth-provider";
import config from "@/config";
import { formatUSDC, sameAlgorandAddress } from "@/utils";
import { wrapFetchWithPayment, x402Client } from "@x402-avm/fetch";
import { registerExactAvmScheme } from "@x402-avm/avm/exact/client";
import type { ClientAvmSigner } from "@x402-avm/avm";
import algosdk from "algosdk";
import { useTranslation } from "react-i18next";

interface Props {
  datasetId: string;
  priceUSDC: number;
  sellerWalletAddress: string;
}

export default function DatasetPurchaseButton({
  datasetId,
  priceUSDC,
  sellerWalletAddress,
}: Props) {
  const { t } = useTranslation("marketplace");
  const { isConnected, peraWallet, walletAddress, jwt } = useAuth();
  const isOwnListing =
    !!walletAddress &&
    sameAlgorandAddress(walletAddress, sellerWalletAddress);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const signer: ClientAvmSigner | null = useMemo(() => {
    if (!isConnected || !peraWallet || !walletAddress) return null;
    return {
      address: walletAddress,
      signTransactions: async (
        txns: Uint8Array[],
        indexesToSign?: number[]
      ): Promise<(Uint8Array | null)[]> => {
        const txnGroup = txns.map((txnBytes, i) => {
          const decoded = algosdk.decodeUnsignedTransaction(txnBytes);
          const shouldSign =
            !indexesToSign || indexesToSign.includes(i);
          return {
            txn: decoded,
            signers: shouldSign ? [walletAddress] : [],
          };
        });

        const signedTxns = await peraWallet!.signTransaction([txnGroup]);

        return txns.map((_, i) => {
          if (indexesToSign && !indexesToSign.includes(i)) return null;
          return new Uint8Array(signedTxns.shift() ?? []);
        });
      },
    };
  }, [isConnected, peraWallet, walletAddress]);

  const fetchWithPay = useMemo(() => {
    if (!signer) return null;
    const client = new x402Client();
    registerExactAvmScheme(client, { signer });
    return wrapFetchWithPayment(fetch, client);
  }, [signer]);

  const handlePurchase = useCallback(async () => {
    if (isOwnListing) return;
    if (!fetchWithPay || !walletAddress) {
      setError(t("connectWalletFirst"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const downloadEndpoint = `${config.apiUrl}/api/datasets/${datasetId}/download`;
      const headers: Record<string, string> = {
        "x-payment-wallet": walletAddress,
      };
      if (jwt) {
        headers["Authorization"] = `Bearer ${jwt}`;
      }

      const response = await fetchWithPay(downloadEndpoint, { headers });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(
          (body as Record<string, string>).message ||
            t("purchaseFailedHttp", { status: String(response.status) })
        );
      }

      const body = await response.json();
      setDownloadUrl(body.downloadUrl);
      setFileName(body.fileName);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t("purchaseTryAgain");
      if (!message.includes("cancelled") && !message.includes("rejected")) {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchWithPay, walletAddress, jwt, datasetId, t, isOwnListing]);

  if (downloadUrl) {
    return (
      <Box>
        <Alert severity="success" sx={{ mb: 2 }}>
          {t("paymentReady")}
        </Alert>
        <Button
          variant="contained"
          color="success"
          startIcon={<DownloadIcon />}
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          fullWidth
          size="large"
        >
          {fileName ? t("downloadNamed", { name: fileName }) : t("downloadDataset")}
        </Button>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 1, display: "block" }}
        >
          {t("linkExpiresNote")}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Button
        variant="contained"
        size="large"
        fullWidth
        disabled={loading || !isConnected || isOwnListing}
        onClick={handlePurchase}
        startIcon={
          loading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            <DownloadIcon />
          )
        }
        sx={{ fontWeight: 700, py: 1.5 }}
      >
        {loading
          ? t("processingPayment")
          : t("purchaseFor", { price: formatUSDC(priceUSDC) })}
      </Button>
      {!isConnected && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 1, display: "block", textAlign: "center" }}
        >
          {t("connectToPurchase")}
        </Typography>
      )}
      {isConnected && isOwnListing && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 1, display: "block", textAlign: "center" }}
        >
          {t("ownListingCannotPurchase")}
        </Typography>
      )}
    </Box>
  );
}
