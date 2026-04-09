"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Container, Typography, Box, TextField, Select, MenuItem, FormControl,
  InputLabel, Button, Grid, Chip, Alert, CircularProgress, Divider
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import LockIcon from "@mui/icons-material/Lock";
import MainLayout from "@/components/layouts/MainLayout";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import USDCOptInPrompt from "@/components/shared/USDCOptInPrompt";
import { useAuth } from "@/providers/auth-provider";
import { useInitiateBountyMutation, useConfirmBountyMutation } from "@/redux/api/bountyApi";
import { DatasetCategory } from "@/types";
import algosdk from "algosdk";

const categories: DatasetCategory[] = ["agriculture", "language", "traffic", "healthcare", "cultural", "financial", "other"];

export default function PostBountyPage() {
  const router = useRouter();
  const { isOptedIn, peraWallet, walletAddress, refreshUser } = useAuth();
  const [initiateBounty, { isLoading: initiating }] = useInitiateBountyMutation();
  const [confirmBounty, { isLoading: confirming }] = useConfirmBountyMutation();
  const [optInOpen, setOptInOpen] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "" as DatasetCategory,
    tags: [] as string[],
    tagInput: "",
    rewardUSDC: "",
    deadline: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [signingStep, setSigningStep] = useState<"idle" | "building" | "signing" | "confirming">("idle");

  const handleAddTag = () => {
    if (form.tagInput.trim() && !form.tags.includes(form.tagInput.trim())) {
      setForm((p) => ({ ...p, tags: [...p.tags, p.tagInput.trim()], tagInput: "" }));
    }
  };

  const handleSubmit = async () => {
    if (!isOptedIn) {
      setOptInOpen(true);
      return;
    }
    if (!peraWallet || !walletAddress) {
      setError("Please connect your wallet first");
      return;
    }

    const requiredFields = ["title", "description", "category", "rewardUSDC", "deadline"];
    for (const field of requiredFields) {
      if (!form[field as keyof typeof form]) {
        setError(`${field} is required`);
        return;
      }
    }

    const reward = parseFloat(form.rewardUSDC);
    if (isNaN(reward) || reward < 1 || reward > 1000) {
      setError("Reward must be between $1.00 and $1000.00 USDC");
      return;
    }

    const deadline = new Date(form.deadline);
    if (deadline <= new Date()) {
      setError("Deadline must be in the future");
      return;
    }

    setError(null);
    setSigningStep("building");

    try {
      // Step 1: Get unsigned transaction group from backend
      const { unsignedTxnGroupBase64, bountyId, bountyData } = await initiateBounty({
        title: form.title,
        description: form.description,
        category: form.category,
        tags: form.tags,
        rewardUSDC: reward,
        deadline: deadline.toISOString(),
      }).unwrap();

      setSigningStep("signing");

      // Step 2: Decode and sign both transactions
      const txns = unsignedTxnGroupBase64.map((t: string) => algosdk.decodeUnsignedTransaction(Buffer.from(t, "base64")));
      const signedTxns = await peraWallet.signTransaction([txns.map((txn: algosdk.Transaction) => ({ txn }))]);

      setSigningStep("confirming");

      // Step 3: Submit to Algorand
      const combined = Buffer.concat(signedTxns.map((t: Uint8Array) => Buffer.from(t)));
      const algodClient = new algosdk.Algodv2("", "https://testnet-api.algonode.cloud", "");
      const { txId } = await algodClient.sendRawTransaction(combined).do();
      await algosdk.waitForConfirmation(algodClient, txId, 4);

      // Step 4: Confirm with backend
      await confirmBounty({ bountyId, txId, bountyData }).unwrap();

      setSuccess(true);
      setSigningStep("idle");
      setTimeout(() => router.push("/dashboard/bounties"), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to post bounty");
      setSigningStep("idle");
    }
  };

  const isLoading = initiating || confirming || signingStep !== "idle";

  const stepLabels = {
    idle: "Post Bounty & Lock USDC in Escrow",
    building: "Building transactions...",
    signing: "Sign with Pera Wallet...",
    confirming: "Confirming on Algorand...",
  };

  if (success) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <Container maxWidth="md" sx={{ py: 8, textAlign: "center" }}>
            <Typography variant="h4">🏆 Bounty Posted!</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
              Your USDC reward is locked in escrow. Data hunters will find it now. Redirecting...
            </Typography>
          </Container>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <MainLayout>
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            🏆 Post a Data Bounty
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Request specific Indian data. Lock USDC in smart contract escrow — released only when you accept a submission.
          </Typography>

          {!isOptedIn && (
            <Alert severity="warning" sx={{ mb: 3 }} action={
              <Button size="small" onClick={() => setOptInOpen(true)}>Opt In Now</Button>
            }>
              You need to opt-in to USDC before posting bounties.
            </Alert>
          )}

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField fullWidth required label="Bounty Title" value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} inputProps={{ maxLength: 100 }} />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth required multiline rows={5}
                label="Description — What data do you need? Format, quality requirements, etc."
                value={form.description}
                onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                inputProps={{ maxLength: 3000 }}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select value={form.category} label="Category" onChange={(e) => setForm(p => ({ ...p, category: e.target.value as DatasetCategory }))}>
                  {categories.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth required label="Deadline" type="datetime-local"
                value={form.deadline}
                onChange={(e) => setForm(p => ({ ...p, deadline: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: new Date().toISOString().slice(0, 16) }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth required label="Reward (USDC)" type="number"
                value={form.rewardUSDC}
                onChange={(e) => setForm(p => ({ ...p, rewardUSDC: e.target.value }))}
                inputProps={{ min: 1, max: 1000, step: 1 }}
                helperText="$1.00 - $1000.00 USDC · Will be locked in smart contract escrow"
                InputProps={{
                  startAdornment: <EmojiEventsIcon sx={{ mr: 1, color: "#FFB800" }} />,
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                <TextField size="small" label="Add Tag" value={form.tagInput}
                  onChange={(e) => setForm(p => ({ ...p, tagInput: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                />
                <Button onClick={handleAddTag} variant="outlined" size="small">Add</Button>
              </Box>
              <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                {form.tags.map((tag) => (
                  <Chip key={tag} label={`#${tag}`} onDelete={() => setForm(p => ({ ...p, tags: p.tags.filter(t => t !== tag) }))} size="small" />
                ))}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Alert severity="info" icon={<LockIcon />}>
                Your USDC reward will be sent to the BountyEscrow smart contract on Algorand.
                It will only be released to the winning submitter when you explicitly accept their submission.
                You can refund after the deadline if no submissions meet your requirements.
              </Alert>
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="contained"
                color="secondary"
                size="large"
                fullWidth
                disabled={isLoading}
                onClick={handleSubmit}
                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <LockIcon />}
                sx={{ py: 1.5, fontWeight: 700 }}
              >
                {stepLabels[signingStep]}
              </Button>
            </Grid>
          </Grid>
        </Container>

        <USDCOptInPrompt
          open={optInOpen}
          onClose={() => setOptInOpen(false)}
          onOptInSuccess={() => { setOptInOpen(false); refreshUser(); }}
        />
      </MainLayout>
    </ProtectedRoute>
  );
}
