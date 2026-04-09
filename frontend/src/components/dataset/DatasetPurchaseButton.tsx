"use client";

import { Button, CircularProgress, Alert, Box, Typography, Link as MuiLink } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import config from "@/config";
import { formatUSDC } from "@/utils";
import algosdk from "algosdk";

interface Props {
  datasetId: string;
  priceUSDC: number;
  sellerWalletAddress: string;
}

export default function DatasetPurchaseButton({ datasetId, priceUSDC, sellerWalletAddress }: Props) {
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

      // Step 1: Make initial request to get 402 challenge
      const jwt = localStorage.getItem("ide_jwt");
      const initialRes = await fetch(downloadEndpoint, {
        headers: {
          Authorization: jwt ? `Bearer ${jwt}` : "",
          "x-payment-wallet": walletAddress,
        },
      });

      // If already purchased, we get 200 directly
      if (initialRes.ok) {
        const { downloadUrl: url, fileName: name } = await initialRes.json();
        setDownloadUrl(url);
        setFileName(name);
        setLoading(false);
        return;
      }

      if (initialRes.status !== 402) {
        throw new Error("Unexpected response from server");
      }

      const paymentRequirement = await initialRes.json();
      const accepts = paymentRequirement.accepts?.[0];
      if (!accepts) throw new Error("No payment requirements received");

      // Step 2: Build USDC payment transaction
      const algodClient = new algosdk.Algodv2("", config.apiUrl.includes("localhost") ? "https://testnet-api.algonode.cloud" : "https://testnet-api.algonode.cloud", "");
      const suggestedParams = await algodClient.getTransactionParams().do();

      const microAmount = Math.round(priceUSDC * 1_000_000);
      const usdcAssetId = config.usdcAssetId;

      const paymentTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        from: walletAddress,
        to: sellerWalletAddress,
        amount: microAmount,
        assetIndex: usdcAssetId,
        suggestedParams,
      });

      // Step 3: Sign with Pera
      const signedTxns = await peraWallet.signTransaction([[{ txn: paymentTxn }]]);
      const signedTxnBase64 = Buffer.from(signedTxns[0]).toString("base64");

      // Step 4: Submit transaction and get txId
      const submitRes = await algodClient.sendRawTransaction(signedTxns[0]).do();
      const txId = submitRes.txId;

      // Wait for confirmation
      await algosdk.waitForConfirmation(algodClient, txId, 4);

      // Step 5: Request download with payment proof
      const downloadRes = await fetch(downloadEndpoint, {
        headers: {
          Authorization: jwt ? `Bearer ${jwt}` : "",
          "x-payment": txId,
          "x-payment-wallet": walletAddress,
        },
      });

      if (!downloadRes.ok) throw new Error("Failed to get download URL after payment");

      const { downloadUrl: url, fileName: name } = await downloadRes.json();
      setDownloadUrl(url);
      setFileName(name);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Purchase failed. Please try again.");
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
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
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
        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
        sx={{ fontWeight: 700, py: 1.5 }}
      >
        {loading ? "Processing Payment..." : `Purchase for ${formatUSDC(priceUSDC)}`}
      </Button>
      {!isConnected && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block", textAlign: "center" }}>
          Connect your wallet to purchase. AI agents can purchase directly via x402.
        </Typography>
      )}
    </Box>
  );
}
