"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  GridLegacy as Grid,
  Typography,
  Box,
  Chip,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Link as MuiLink,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import UploadIcon from "@mui/icons-material/Upload";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DownloadIcon from "@mui/icons-material/Download";
import MainLayout from "@/components/layouts/MainLayout";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import {
  useGetBountyQuery,
  useSubmitToBountyMutation,
  useAcceptSubmissionMutation,
  useConfirmAcceptanceMutation,
} from "@/redux/api/bountyApi";
import { useAuth } from "@/providers/auth-provider";
import { formatUSDC, truncateAddress, formatDate, isDeadlinePassed } from "@/utils";
import config from "@/config";
import algosdk from "algosdk";
import { submittedTxIdFromAlgodResponse } from "@/utils/algod";
import { useTranslation } from "react-i18next";

export default function BountyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { t } = useTranslation("bounties");
  const { t: tm } = useTranslation("marketplace");
  const { t: tc } = useTranslation("common");
  const { t: tf } = useTranslation("forms");
  const { data, isLoading, isError, refetch } = useGetBountyQuery(id);
  const { user, peraWallet, walletAddress } = useAuth();
  const [submitToBounty] = useSubmitToBountyMutation();
  const [acceptSubmission] = useAcceptSubmissionMutation();
  const [confirmAcceptance] = useConfirmAcceptanceMutation();

  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitForm, setSubmitForm] = useState({ title: "", description: "" });
  const [sampleFile, setSampleFile] = useState<File | null>(null);
  const [fullDataFile, setFullDataFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitterAttestation, setSubmitterAttestation] = useState(false);
  const [acceptLoading, setAcceptLoading] = useState<string | null>(null);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  if (isError || !data?.bounty) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <Container sx={{ py: 8, textAlign: "center" }}>
            <Typography variant="h5">{t("notFound")}</Typography>
          </Container>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  const { bounty } = data;
  const isBuyer = user?._id === bounty.buyerId;
  const deadlinePassed = isDeadlinePassed(bounty.deadline);
  const hasSubmitted = bounty.hasSubmitted === true;

  const categoryLabels = tm("categoryLabels", { returnObjects: true }) as Record<string, string>;
  const categoryLabel = categoryLabels[bounty.category] ?? bounty.category;
  const statusKey = bounty.status as "open" | "accepted" | "cancelled" | "expired";
  const statusLabel = t(`status_${statusKey}`, { defaultValue: bounty.status });

  const handleSubmit = async () => {
    if (!sampleFile || !fullDataFile) {
      setSubmitError(t("errBothFiles"));
      return;
    }
    if (!submitterAttestation) {
      setSubmitError(tf("attestationRequired"));
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const formData = new FormData();
      formData.append("title", submitForm.title);
      formData.append("description", submitForm.description);
      formData.append("submitterAttestationAccepted", "true");
      formData.append("sampleFile", sampleFile);
      formData.append("fullDataFile", fullDataFile);
      await submitToBounty({ bountyId: id, formData }).unwrap();
      setSubmitOpen(false);
      setSubmitForm({ title: "", description: "" });
      setSampleFile(null);
      setFullDataFile(null);
      setSubmitterAttestation(false);
      refetch();
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : t("errSubmit"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccept = async (submissionId: string) => {
    if (!peraWallet || !walletAddress) return;
    setAcceptLoading(submissionId);
    setAcceptError(null);
    try {
      const { unsignedTxnBase64 } = await acceptSubmission({ bountyId: id, submissionId }).unwrap();

      const txnBytes = Buffer.from(unsignedTxnBase64, "base64");
      const txn = algosdk.decodeUnsignedTransaction(txnBytes);
      const signedTxns = await peraWallet.signTransaction([[{ txn }]]);

      const algodClient = new algosdk.Algodv2("", "https://testnet-api.algonode.cloud", "");
      const submitRes = await algodClient.sendRawTransaction(signedTxns[0]).do();
      const txId = submittedTxIdFromAlgodResponse(submitRes as { txid?: string; txId?: string });
      await algosdk.waitForConfirmation(algodClient, txId, 4);

      await confirmAcceptance({ bountyId: id, submissionId, txId }).unwrap();
      await refetch();
    } catch (err: unknown) {
      setAcceptError(err instanceof Error ? err.message : t("errAccept"));
    } finally {
      setAcceptLoading(null);
    }
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push("/bounties")}
            sx={{ mb: 3, fontWeight: 600 }}
          >
            {t("back")}
          </Button>
          <Grid container spacing={4}>
            <Grid item xs={12} md={8}>
              <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
                <Chip
                  label={statusLabel}
                  color={bounty.status === "open" ? "success" : "default"}
                  sx={{ fontWeight: 700 }}
                />
                <Chip label={categoryLabel} color="primary" />
              </Box>

              <Typography variant="h4" fontWeight={800} gutterBottom>
                {bounty.title}
              </Typography>

              <Typography variant="body1" sx={{ mb: 3, whiteSpace: "pre-wrap" }}>
                {bounty.description}
              </Typography>

              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 3, gap: 0.5 }}>
                {bounty.tags.map((tag) => (
                  <Chip key={tag} label={`#${tag}`} size="small" />
                ))}
              </Stack>

              <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", mb: 3 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t("postedBy")}
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {truncateAddress(bounty.buyerWalletAddress)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t("deadline")}
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color={deadlinePassed ? "error" : "inherit"}>
                    {formatDate(bounty.deadline)}{" "}
                    {deadlinePassed && t("deadlinePassedSuffix")}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t("submissions")}
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {bounty.submissionCount}
                  </Typography>
                </Box>
              </Box>

              {bounty.escrowTxId && (
                <MuiLink
                  href={`${config.algoExplorerTxUrl}/${bounty.escrowTxId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="body2"
                >
                  {t("viewEscrowTx")}
                </MuiLink>
              )}

              {isBuyer && bounty.submissions && bounty.submissions.length > 0 && (
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    {t("submissionsHeading", { count: bounty.submissions.length })}
                  </Typography>
                  {acceptError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {acceptError}
                    </Alert>
                  )}
                  {bounty.submissions.map((sub) => (
                    <Card
                      key={sub._id}
                      elevation={0}
                      sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, mb: 2 }}
                    >
                      <CardContent>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                          <Typography fontWeight={700}>{sub.title}</Typography>
                          <Chip
                            label={sub.status}
                            size="small"
                            color={
                              sub.status === "accepted"
                                ? "success"
                                : sub.status === "rejected"
                                  ? "error"
                                  : "default"
                            }
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {sub.description}
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          <Button
                            size="small"
                            variant="outlined"
                            href={`${config.pinataGateway}/${sub.sampleIpfsCid}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {t("previewSample")}
                          </Button>
                          {sub.status === "pending" && bounty.status === "open" && !deadlinePassed && (
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              startIcon={
                                acceptLoading === sub._id ? (
                                  <CircularProgress size={16} color="inherit" />
                                ) : (
                                  <CheckCircleIcon />
                                )
                              }
                              disabled={!!acceptLoading}
                              onClick={() => handleAccept(sub._id)}
                            >
                              {t("acceptSubmission")}
                            </Button>
                          )}
                          {sub.status === "accepted" && sub.downloadUrl && (
                            <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              startIcon={<DownloadIcon />}
                              href={sub.downloadUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {t("downloadFullFile")}
                            </Button>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Grid>

            <Grid item xs={12} md={4}>
              <Card
                elevation={0}
                sx={{
                  border: "1px solid",
                  borderColor: "secondary.main",
                  borderRadius: 3,
                  position: "sticky",
                  top: 80,
                }}
              >
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                    <EmojiEventsIcon sx={{ color: "#FFB800", fontSize: 32 }} />
                    <Typography variant="h4" color="secondary" fontWeight={800}>
                      {formatUSDC(bounty.rewardUSDC)}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {t("rewardEscrowBlurb")}
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  {bounty.status === "open" && !deadlinePassed && !isBuyer && !hasSubmitted && (
                    <Button
                      variant="contained"
                      color="secondary"
                      fullWidth
                      size="large"
                      startIcon={<UploadIcon />}
                      onClick={() => setSubmitOpen(true)}
                      sx={{ fontWeight: 700 }}
                    >
                      {t("submitYourData")}
                    </Button>
                  )}
                  {bounty.status === "open" && !deadlinePassed && !isBuyer && hasSubmitted && (
                    <Alert severity="info" sx={{ fontWeight: 600 }}>
                      {t("alreadySubmitted")}
                    </Alert>
                  )}
                  {isBuyer && (
                    <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
                      <Chip label={t("youPostedBounty")} color="primary" />
                    </Box>
                  )}
                  {deadlinePassed && bounty.status === "open" && (
                    <Alert severity="warning" sx={{ mt: 1 }}>
                      {t("deadlineRefundHint")}
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Dialog
            open={submitOpen}
            onClose={() => {
              setSubmitOpen(false);
              setSubmitterAttestation(false);
              setSubmitError(null);
            }}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>{t("submitYourData")}</DialogTitle>
            <DialogContent>
              {submitError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {submitError}
                </Alert>
              )}
              <TextField
                fullWidth
                label={t("submissionTitleField")}
                value={submitForm.title}
                onChange={(e) => setSubmitForm((p) => ({ ...p, title: e.target.value }))}
                sx={{ mb: 2, mt: 1 }}
              />
              <TextField
                fullWidth
                label={tf("description")}
                multiline
                rows={4}
                value={submitForm.description}
                onChange={(e) => setSubmitForm((p) => ({ ...p, description: e.target.value }))}
                sx={{ mb: 2 }}
              />
              <Typography variant="subtitle2" gutterBottom>
                {t("sampleFileDialog")}
              </Typography>
              <input
                type="file"
                onChange={(e) => setSampleFile(e.target.files?.[0] || null)}
                style={{ marginBottom: 16 }}
              />
              <Typography variant="subtitle2" gutterBottom>
                {t("fullDataDialog")}
              </Typography>
              <input type="file" onChange={(e) => setFullDataFile(e.target.files?.[0] || null)} />
              <FormControlLabel
                sx={{ alignItems: "flex-start", mt: 2, mr: 0 }}
                control={
                  <Checkbox
                    checked={submitterAttestation}
                    onChange={(e) => setSubmitterAttestation(e.target.checked)}
                    sx={{ pt: 0.25 }}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2">{tf("sellerAttestation")}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {tf("sellerAttestationHint")}
                    </Typography>
                  </Box>
                }
              />
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => {
                  setSubmitOpen(false);
                  setSubmitterAttestation(false);
                  setSubmitError(null);
                }}
              >
                {tc("cancel")}
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={16} /> : <UploadIcon />}
              >
                {t("submitAction")}
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </MainLayout>
    </ProtectedRoute>
  );
}
