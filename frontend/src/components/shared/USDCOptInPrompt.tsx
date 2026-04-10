"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from "@mui/material";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import { useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import config from "@/config";
import algosdk from "algosdk";

function base64ToUint8(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

interface Props {
  open: boolean;
  onClose: () => void;
  onOptInSuccess: () => void;
}

export default function USDCOptInPrompt({
  open,
  onClose,
  onOptInSuccess,
}: Props) {
  const { walletAddress, peraWallet, setOptedIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOptIn = async () => {
    if (!walletAddress || !peraWallet) return;
    setLoading(true);
    setError(null);

    try {
      const buildRes = await fetch(`${config.apiUrl}/auth/build-optin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress }),
      });
      if (!buildRes.ok) throw new Error("Failed to build opt-in transaction");
      const { unsignedTxnBase64 } = await buildRes.json();

      const unsignedTxnBytes = base64ToUint8(unsignedTxnBase64);
      const txn = algosdk.decodeUnsignedTransaction(unsignedTxnBytes);

      const signedTxns = await peraWallet.signTransaction([[{ txn }]]);
      const signedTxnBase64 = uint8ToBase64(new Uint8Array(signedTxns[0]));

      const submitRes = await fetch(`${config.apiUrl}/auth/submit-optin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, signedTxnBase64 }),
      });

      if (!submitRes.ok) throw new Error("Failed to submit opt-in transaction");

      setOptedIn(true);
      onOptInSuccess();
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to opt-in to USDC"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <MonetizationOnIcon color="primary" />
          Opt-in to USDC
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          To list datasets or submit bounty responses, your wallet must opt-in
          to USDC (the payment token used on India Data Exchange).
        </Typography>
        <Typography variant="body2" color="text.secondary">
          This is a free, one-time transaction that allows your Algorand wallet
          to hold USDC. You&apos;ll need a small amount of ALGO for the
          transaction fee (~0.001 ALGO).
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleOptIn}
          disabled={loading}
          startIcon={
            loading ? (
              <CircularProgress size={16} />
            ) : (
              <MonetizationOnIcon />
            )
          }
        >
          {loading ? "Processing..." : "Opt In to USDC"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
