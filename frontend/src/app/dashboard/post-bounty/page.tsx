"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Typography,
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Chip,
  Alert,
  CircularProgress,
  alpha,
  useTheme,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import LockIcon from "@mui/icons-material/Lock";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import SecurityIcon from "@mui/icons-material/Security";
import USDCOptInPrompt from "@/components/shared/USDCOptInPrompt";
import { useAuth } from "@/providers/auth-provider";
import { useInitiateBountyMutation, useConfirmBountyMutation } from "@/redux/api/bountyApi";
import { DatasetCategory } from "@/types";
import algosdk from "algosdk";
import { submittedTxIdFromAlgodResponse } from "@/utils/algod";
import { useTranslation } from "react-i18next";

const categories: DatasetCategory[] = [
  "agriculture",
  "language",
  "traffic",
  "healthcare",
  "cultural",
  "financial",
  "other",
];

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
      <Typography
        variant="subtitle2"
        fontWeight={700}
        sx={{
          mb: 2.5,
          color: "text.secondary",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          fontSize: "0.7rem",
        }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
}

export default function PostBountyPage() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation("bounties");
  const { t: tm } = useTranslation("marketplace");
  const { t: tf } = useTranslation("forms");
  const { isOptedIn, peraWallet, walletAddress, refreshUser } = useAuth();
  const [initiateBounty, { isLoading: initiating }] = useInitiateBountyMutation();
  const [confirmBounty, { isLoading: confirming }] = useConfirmBountyMutation();
  const [optInOpen, setOptInOpen] = useState(false);

  const categoryLabels = tm("categoryLabels", { returnObjects: true }) as Record<string, string>;

  const signingStepLabels = useMemo(
    () => [t("stepBuild"), t("stepSign"), t("stepConfirm")],
    [t],
  );

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

  const activeSigningStep =
    signingStep === "building" ? 0 : signingStep === "signing" ? 1 : signingStep === "confirming" ? 2 : -1;

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
      setError(t("errWallet"));
      return;
    }
    if (!form.title.trim()) {
      setError(t("errTitle"));
      return;
    }
    if (!form.description.trim()) {
      setError(t("errDescription"));
      return;
    }
    if (!form.category) {
      setError(t("errCategory"));
      return;
    }
    if (!form.rewardUSDC.trim()) {
      setError(t("errRewardNum"));
      return;
    }
    if (!form.deadline) {
      setError(t("errDeadline"));
      return;
    }
    const reward = parseFloat(form.rewardUSDC);
    if (isNaN(reward) || reward < 1 || reward > 1000) {
      setError(t("errReward"));
      return;
    }
    const deadline = new Date(form.deadline);
    if (deadline <= new Date()) {
      setError(t("errDeadlineFuture"));
      return;
    }

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
      const txns = unsignedTxnGroupBase64.map((tb: string) =>
        algosdk.decodeUnsignedTransaction(Buffer.from(tb, "base64")),
      );
      const signedTxns = await peraWallet.signTransaction([txns.map((txn: algosdk.Transaction) => ({ txn }))]);

      setSigningStep("confirming");
      const combined = Buffer.concat(signedTxns.map((tb: Uint8Array) => Buffer.from(tb)));
      const algodClient = new algosdk.Algodv2("", "https://testnet-api.algonode.cloud", "");
      const submitRes = await algodClient.sendRawTransaction(combined).do();
      const txId = submittedTxIdFromAlgodResponse(submitRes as { txid?: string; txId?: string });
      await algosdk.waitForConfirmation(algodClient, txId, 4);

      await confirmBounty({ bountyId, txId, bountyData }).unwrap();
      setSuccess(true);
      setSigningStep("idle");
      setTimeout(() => router.push("/dashboard/bounties"), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("errPost"));
      setSigningStep("idle");
    }
  };

  const isLoading = initiating || confirming || signingStep !== "idle";

  if (success) {
    return (
      <Box sx={{ py: 10, textAlign: "center", maxWidth: 480, mx: "auto" }}>
        <EmojiEventsIcon sx={{ fontSize: 56, color: "#FFB800", mb: 2 }} />
        <Typography variant="h5" fontWeight={800}>
          {t("bountyPostedTitle")}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {t("bountyPostedBody")}
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ maxWidth: 680, mx: "auto" }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5 }}>
            {t("postDataBountyTitle")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("postDataBountySubtitle")}
          </Typography>
        </Box>

        {!isOptedIn && (
          <Alert
            severity="warning"
            sx={{ mb: 3, borderRadius: 3 }}
            action={
              <Button size="small" onClick={() => setOptInOpen(true)}>
                {t("optInShort")}
              </Button>
            }
          >
            {t("usdcBeforeBounty")}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
            {error}
          </Alert>
        )}

        <Section title={t("sectionBountyDetails")}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <TextField
              fullWidth
              required
              label={t("bountyTitleField")}
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              inputProps={{ maxLength: 100 }}
              placeholder={t("bountyTitlePlaceholder")}
            />
            <TextField
              fullWidth
              required
              multiline
              rows={5}
              label={tf("description")}
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              inputProps={{ maxLength: 3000 }}
              placeholder={t("descPlaceholder")}
            />
            <Box sx={{ display: "flex", gap: 2 }}>
              <FormControl fullWidth required>
                <InputLabel>{tf("category")}</InputLabel>
                <Select
                  value={form.category}
                  label={tf("category")}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as DatasetCategory }))}
                >
                  {categories.map((c) => (
                    <MenuItem key={c} value={c} sx={{ textTransform: "capitalize" }}>
                      {categoryLabels[c] ?? c}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                required
                label={t("deadlineField")}
                type="datetime-local"
                value={form.deadline}
                onChange={(e) => setForm((p) => ({ ...p, deadline: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: new Date().toISOString().slice(0, 16) }}
              />
            </Box>
          </Box>
        </Section>

        <Section title={t("sectionReward")}>
          <TextField
            fullWidth
            required
            label={t("rewardAmountField")}
            type="number"
            value={form.rewardUSDC}
            onChange={(e) => setForm((p) => ({ ...p, rewardUSDC: e.target.value }))}
            inputProps={{ min: 1, max: 1000, step: 1 }}
            helperText={t("rewardFieldHelper")}
            InputProps={{
              startAdornment: <EmojiEventsIcon sx={{ mr: 1, color: "#FFB800", fontSize: 22 }} />,
            }}
          />
          <Box sx={{ display: "flex", gap: 1, alignItems: "center", mt: 2.5 }}>
            <LocalOfferIcon sx={{ color: "text.disabled", fontSize: 18 }} />
            <TextField
              size="small"
              label={t("tagField")}
              value={form.tagInput}
              sx={{ flex: 1 }}
              onChange={(e) => setForm((p) => ({ ...p, tagInput: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
              placeholder={t("tagEnterHint")}
            />
            <Button onClick={handleAddTag} variant="outlined" size="small" sx={{ minWidth: 60, height: 40 }}>
              {tf("add")}
            </Button>
          </Box>
          {form.tags.length > 0 && (
            <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 1.5 }}>
              {form.tags.map((tag) => (
                <Chip
                  key={tag}
                  label={`#${tag}`}
                  onDelete={() => setForm((p) => ({ ...p, tags: p.tags.filter((x) => x !== tag) }))}
                  size="small"
                  sx={{ borderRadius: 2 }}
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
            <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
              {t("escrowInfoTitle")}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              {t("escrowInfoBody")}
            </Typography>
          </Box>
        </Box>

        {signingStep !== "idle" && (
          <Box sx={{ mb: 3, p: 2, borderRadius: 3, border: `1px solid ${alpha(theme.palette.divider, 0.08)}` }}>
            <Stepper activeStep={activeSigningStep} alternativeLabel>
              {signingStepLabels.map((label) => (
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
          {signingStep === "idle"
            ? t("btnPostLock")
            : signingStep === "building"
              ? t("btnBuilding")
              : signingStep === "signing"
                ? t("btnSigning")
                : t("btnConfirming")}
        </Button>
      </Box>

      <USDCOptInPrompt
        open={optInOpen}
        onClose={() => setOptInOpen(false)}
        onOptInSuccess={() => {
          setOptInOpen(false);
          refreshUser();
        }}
      />
    </>
  );
}
