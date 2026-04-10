"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Typography, Box, TextField, Select, MenuItem, FormControl,
  InputLabel, Button, Chip, Alert, CircularProgress, alpha, useTheme,
  Stepper, Step, StepLabel,
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import LockIcon from "@mui/icons-material/Lock";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import SecurityIcon from "@mui/icons-material/Security";
import USDCOptInPrompt from "@/components/shared/USDCOptInPrompt";
import { useAuth } from "@/providers/auth-provider";
import { useInitiateBountyMutation, useConfirmBountyMutation } from "@/redux/api/bountyApi";
import { DatasetCategory } from "@/types";
import algosdk from "algosdk";
import { submittedTxIdFromAlgodResponse } from "@/utils/algod";

const categories: DatasetCategory[] = ["agriculture", "language", "traffic", "healthcare", "cultural", "financial", "other"];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        p: { xs: 2.5, sm: 3 },
        borderRadius: 3,
        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        bgcolor: alpha(theme.palette.background.paper, 0.6),
        mb: 3,
      }}
    >
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2.5, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.7rem" }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

const signingSteps = ["Build Txn", "Sign Wallet", "Confirm"];

export default function PostBountyPage() {
  const router = useRouter();
  const theme = useTheme();
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

  const activeSigningStep = signingStep === "building" ? 0 : signingStep === "signing" ? 1 : signingStep === "confirming" ? 2 : -1;

  const handleAddTag = () => {
    if (form.tagInput.trim() && !form.tags.includes(form.tagInput.trim())) {
      setForm((p) => ({ ...p, tags: [...p.tags, p.tagInput.trim()], tagInput: "" }));
    }
  };

  const handleSubmit = async () => {
    if (!isOptedIn) { setOptInOpen(true); return; }
    if (!peraWallet || !walletAddress) { setError("Please connect your wallet first"); return; }
    const requiredFields = ["title", "description", "category", "rewardUSDC", "deadline"];
    for (const field of requiredFields) {
      if (!form[field as keyof typeof form]) { setError(`${field} is required`); return; }
    }
    const reward = parseFloat(form.rewardUSDC);
    if (isNaN(reward) || reward < 1 || reward > 1000) { setError("Reward must be between $1.00 and $1000.00 USDC"); return; }
    const deadline = new Date(form.deadline);
    if (deadline <= new Date()) { setError("Deadline must be in the future"); return; }

    setError(null);
    setSigningStep("building");

    try {
      const { unsignedTxnGroupBase64, bountyId, bountyData } = await initiateBounty({
        title: form.title,
        description: form.description,
        category: form.category,
        tags: form.tags,
        rewardUSDC: reward,
        deadline: deadline.toISOString(),
      }).unwrap();

      setSigningStep("signing");
      const txns = unsignedTxnGroupBase64.map((t: string) => algosdk.decodeUnsignedTransaction(Buffer.from(t, "base64")));
      const signedTxns = await peraWallet.signTransaction([txns.map((txn: algosdk.Transaction) => ({ txn }))]);

      setSigningStep("confirming");
      const combined = Buffer.concat(signedTxns.map((t: Uint8Array) => Buffer.from(t)));
      const algodClient = new algosdk.Algodv2("", "https://testnet-api.algonode.cloud", "");
      const submitRes = await algodClient.sendRawTransaction(combined).do();
      const txId = submittedTxIdFromAlgodResponse(submitRes as { txid?: string; txId?: string });
      await algosdk.waitForConfirmation(algodClient, txId, 4);

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

  if (success) {
    return (
      <Box sx={{ py: 10, textAlign: "center", maxWidth: 480, mx: "auto" }}>
        <EmojiEventsIcon sx={{ fontSize: 56, color: "#FFB800", mb: 2 }} />
        <Typography variant="h5" fontWeight={800}>Bounty Posted!</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Your USDC reward is locked in escrow. Data hunters will find it now. Redirecting...
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ maxWidth: 680, mx: "auto" }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5 }}>
            Post a Data Bounty
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Request specific Indian data. Lock USDC in smart contract escrow — released only when you accept a submission.
          </Typography>
        </Box>

        {!isOptedIn && (
          <Alert severity="warning" sx={{ mb: 3, borderRadius: 3 }} action={
            <Button size="small" onClick={() => setOptInOpen(true)}>Opt In</Button>
          }>
            You need to opt-in to USDC before posting bounties.
          </Alert>
        )}
        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>{error}</Alert>}

        <Section title="Bounty Details">
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <TextField fullWidth required label="Bounty Title" value={form.title}
              onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
              inputProps={{ maxLength: 100 }}
              placeholder="e.g. Hindi-English Parallel Corpus (100K sentences)"
            />
            <TextField
              fullWidth required multiline rows={5}
              label="Description"
              value={form.description}
              onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
              inputProps={{ maxLength: 3000 }}
              placeholder="What data do you need? Specify format, quality requirements, minimum size, etc."
            />
            <Box sx={{ display: "flex", gap: 2 }}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select value={form.category} label="Category"
                  onChange={(e) => setForm(p => ({ ...p, category: e.target.value as DatasetCategory }))}>
                  {categories.map((c) => <MenuItem key={c} value={c} sx={{ textTransform: "capitalize" }}>{c}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField
                fullWidth required label="Deadline" type="datetime-local"
                value={form.deadline}
                onChange={(e) => setForm(p => ({ ...p, deadline: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: new Date().toISOString().slice(0, 16) }}
              />
            </Box>
          </Box>
        </Section>

        <Section title="Reward">
          <TextField
            fullWidth required label="Reward Amount (USDC)" type="number"
            value={form.rewardUSDC}
            onChange={(e) => setForm(p => ({ ...p, rewardUSDC: e.target.value }))}
            inputProps={{ min: 1, max: 1000, step: 1 }}
            helperText="$1.00 - $1000.00 USDC — Will be locked in smart contract escrow"
            InputProps={{
              startAdornment: <EmojiEventsIcon sx={{ mr: 1, color: "#FFB800", fontSize: 22 }} />,
            }}
          />
          <Box sx={{ display: "flex", gap: 1, alignItems: "center", mt: 2.5 }}>
            <LocalOfferIcon sx={{ color: "text.disabled", fontSize: 18 }} />
            <TextField
              size="small" label="Add Tag" value={form.tagInput} sx={{ flex: 1 }}
              onChange={(e) => setForm(p => ({ ...p, tagInput: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
              placeholder="Press enter to add"
            />
            <Button onClick={handleAddTag} variant="outlined" size="small" sx={{ minWidth: 60, height: 40 }}>Add</Button>
          </Box>
          {form.tags.length > 0 && (
            <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 1.5 }}>
              {form.tags.map((tag) => (
                <Chip key={tag} label={`#${tag}`}
                  onDelete={() => setForm(p => ({ ...p, tags: p.tags.filter(t => t !== tag) }))}
                  size="small" sx={{ borderRadius: 2 }}
                />
              ))}
            </Box>
          )}
        </Section>

        <Box
          sx={{
            p: 2.5,
            borderRadius: 3,
            mb: 3,
            display: "flex",
            alignItems: "flex-start",
            gap: 2,
            bgcolor: alpha("#60A5FA", 0.06),
            border: `1px solid ${alpha("#60A5FA", 0.15)}`,
          }}
        >
          <SecurityIcon sx={{ color: "#60A5FA", fontSize: 22, mt: 0.2 }} />
          <Box>
            <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>Smart Contract Escrow</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              Your USDC reward will be sent to the BountyEscrow smart contract on Algorand.
              It will only be released to the winning submitter when you explicitly accept their submission.
              You can refund after the deadline if no submissions meet your requirements.
            </Typography>
          </Box>
        </Box>

        {signingStep !== "idle" && (
          <Box sx={{ mb: 3, p: 2, borderRadius: 3, border: `1px solid ${alpha(theme.palette.divider, 0.08)}` }}>
            <Stepper activeStep={activeSigningStep} alternativeLabel>
              {signingSteps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
        )}

        <Button
          variant="contained"
          size="large"
          fullWidth
          disabled={isLoading}
          onClick={handleSubmit}
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <LockIcon />}
          sx={{
            py: 1.8,
            fontWeight: 700,
            borderRadius: 3,
            fontSize: "0.95rem",
            backgroundImage: "linear-gradient(135deg, #F59E0B, #FFB800)",
            "&:hover": { backgroundImage: "linear-gradient(135deg, #D97706, #F59E0B)" },
          }}
        >
          {signingStep === "idle" ? "Post Bounty & Lock USDC in Escrow"
            : signingStep === "building" ? "Building transactions..."
            : signingStep === "signing" ? "Sign with Pera Wallet..."
            : "Confirming on Algorand..."}
        </Button>
      </Box>

      <USDCOptInPrompt
        open={optInOpen}
        onClose={() => setOptInOpen(false)}
        onOptInSuccess={() => { setOptInOpen(false); refreshUser(); }}
      />
    </>
  );
}
