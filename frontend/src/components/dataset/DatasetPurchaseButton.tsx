"use client";

import {
  Button,
  CircularProgress,
  Alert,
  Box,
  Typography,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import { useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import config from "@/config";
import { formatUSDC } from "@/utils";
import algosdk from "algosdk";

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

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
  const { isConnected, peraWallet, walletAddress } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handlePurchase = async () => {
    if (!isConnected || !peraWallet || !walletAddress) {
      setError("Please connect your wallet first");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const downloadEndpoint = `${config.apiUrl}/api/datasets/${datasetId}/download`;
      const jwt = localStorage.getItem("ide_jwt");

      const initialRes = await fetch(downloadEndpoint, {
        headers: {
          Authorization: jwt ? `Bearer ${jwt}` : "",
          "x-payment-wallet": walletAddress,
        },
      });

      if (initialRes.ok) {
        const body = await initialRes.json();
        setDownloadUrl(body.downloadUrl);
        setFileName(body.fileName);
        setLoading(false);
        return;
      }

      if (initialRes.status !== 402) {
        throw new Error("Unexpected response from server");
      }

      const paymentRequirement = await initialRes.json();
      const accepts = paymentRequirement.accepts?.[0];
      if (!accepts) throw new Error("No payment requirements received");

      const algodClient = new algosdk.Algodv2(
        "",
        "https://testnet-api.algonode.cloud",
        ""
      );
      const suggestedParams = await algodClient.getTransactionParams().do();

      const microAmount = Math.round(priceUSDC * 1_000_000);
      const usdcAssetId = config.usdcAssetId;

      const paymentTxn =
        algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
          sender: walletAddress,
          receiver: sellerWalletAddress,
          amount: microAmount,
          assetIndex: usdcAssetId,
          suggestedParams,
        });

      const signedTxns = await peraWallet.signTransaction([[{ txn: paymentTxn }]]);
      const signedBytes = new Uint8Array(signedTxns[0]);

      const submitRes = await algodClient.sendRawTransaction(signedBytes).do();
      const txId =
        (submitRes as any).txId ??
        (submitRes as any).txid ??
        (submitRes as any).txID ??
        "";

      if (txId) {
        await algosdk.waitForConfirmation(algodClient, txId, 4);
      }

      const downloadRes = await fetch(downloadEndpoint, {
        headers: {
          Authorization: jwt ? `Bearer ${jwt}` : "",
          "x-payment": txId,
          "x-payment-wallet": walletAddress,
        },
      });

      if (!downloadRes.ok)
        throw new Error("Failed to get download URL after payment");

      const body = await downloadRes.json();
      setDownloadUrl(body.downloadUrl);
      setFileName(body.fileName);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Purchase failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (downloadUrl) {
    return (
      <Box>
        <Alert severity="success" sx={{ mb: 2 }}>
          Payment confirmed! Your download is ready.
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
          Download {fileName || "Dataset"}
        </Button>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 1, display: "block" }}
        >
          Link expires in 1 hour. Return to dashboard to re-download anytime.
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
        disabled={loading}
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
        {loading ? "Processing Payment..." : `Purchase for ${formatUSDC(priceUSDC)}`}
      </Button>
      {!isConnected && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 1, display: "block", textAlign: "center" }}
        >
          Connect your wallet to purchase. AI agents can purchase directly via
          x402.
        </Typography>
      )}
    </Box>
  );
}
