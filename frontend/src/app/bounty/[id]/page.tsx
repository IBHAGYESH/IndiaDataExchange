"use client";

import { use, useState } from "react";
import {
  Container, Grid, Typography, Box, Chip, Button, Card, CardContent,
  CircularProgress, Divider, Alert, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Stack, Link as MuiLink
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import UploadIcon from "@mui/icons-material/Upload";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import MainLayout from "@/components/layouts/MainLayout";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { useGetBountyQuery, useSubmitToBountyMutation, useAcceptSubmissionMutation, useConfirmAcceptanceMutation } from "@/redux/api/bountyApi";
import { useAuth } from "@/providers/auth-provider";
import { formatUSDC, truncateAddress, formatDate, isDeadlinePassed } from "@/utils";
import config from "@/config";
import algosdk from "algosdk";

export default function BountyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
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
  const [acceptLoading, setAcceptLoading] = useState<string | null>(null);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  if (isLoading) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  if (isError || !data?.bounty) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <Container sx={{ py: 8, textAlign: "center" }}>
            <Typography variant="h5">Bounty not found</Typography>
          </Container>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  const { bounty } = data;
  const isBuyer = user?._id === bounty.buyerId;
  const deadlinePassed = isDeadlinePassed(bounty.deadline);

  const handleSubmit = async () => {
    if (!sampleFile || !fullDataFile) {
      setSubmitError("Both sample and full data files are required");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const formData = new FormData();
      formData.append("title", submitForm.title);
      formData.append("description", submitForm.description);
      formData.append("sampleFile", sampleFile);
      formData.append("fullDataFile", fullDataFile);
      await submitToBounty({ bountyId: id, formData }).unwrap();
      setSubmitOpen(false);
      setSubmitForm({ title: "", description: "" });
      setSampleFile(null);
      setFullDataFile(null);
      refetch();
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccept = async (submissionId: string, winnerAddress: string) => {
    if (!peraWallet || !walletAddress) return;
    setAcceptLoading(submissionId);
    setAcceptError(null);
    try {
      // Get unsigned txn from backend
      const { unsignedTxnBase64 } = await acceptSubmission({ bountyId: id, submissionId }).unwrap();

      // Decode and sign
      const txnBytes = Buffer.from(unsignedTxnBase64, "base64");
      const txn = algosdk.decodeUnsignedTransaction(txnBytes);
      const signedTxns = await peraWallet.signTransaction([[{ txn }]]);

      // Submit to Algorand
      const algodClient = new algosdk.Algodv2("", "https://testnet-api.algonode.cloud", "");
      const { txId } = await algodClient.sendRawTransaction(signedTxns[0]).do();
      await algosdk.waitForConfirmation(algodClient, txId, 4);

      // Confirm with backend
      const result = await confirmAcceptance({ bountyId: id, submissionId, txId }).unwrap();
      setDownloadUrl(result.downloadUrl);
      refetch();
    } catch (err: unknown) {
      setAcceptError(err instanceof Error ? err.message : "Failed to accept submission");
    } finally {
      setAcceptLoading(null);
    }
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={8}>
              <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
                <Chip
                  label={bounty.status.toUpperCase()}
                  color={bounty.status === "open" ? "success" : "default"}
                  sx={{ fontWeight: 700 }}
                />
                <Chip label={bounty.category} color="primary" />
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
                  <Typography variant="caption" color="text.secondary">Posted By</Typography>
                  <Typography variant="body2" fontWeight={600}>{truncateAddress(bounty.buyerWalletAddress)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Deadline</Typography>
                  <Typography variant="body2" fontWeight={600} color={deadlinePassed ? "error" : "inherit"}>
                    {formatDate(bounty.deadline)} {deadlinePassed && "(Passed)"}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Submissions</Typography>
                  <Typography variant="body2" fontWeight={600}>{bounty.submissionCount}</Typography>
                </Box>
              </Box>

              {bounty.escrowTxId && (
                <MuiLink
                  href={`${config.algoExplorerTxUrl}/${bounty.escrowTxId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="body2"
                >
                  View escrow transaction on Algo Explorer ↗
                </MuiLink>
              )}

              {/* Submissions (buyer only) */}
              {isBuyer && bounty.submissions && bounty.submissions.length > 0 && (
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Submissions ({bounty.submissions.length})
                  </Typography>
                  {acceptError && <Alert severity="error" sx={{ mb: 2 }}>{acceptError}</Alert>}
                  {downloadUrl && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                      Submission accepted! <MuiLink href={downloadUrl} target="_blank">Download full data ↗</MuiLink>
                    </Alert>
                  )}
                  {bounty.submissions.map((sub) => (
                    <Card key={sub._id} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, mb: 2 }}>
                      <CardContent>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                          <Typography fontWeight={700}>{sub.title}</Typography>
                          <Chip
                            label={sub.status}
                            size="small"
                            color={sub.status === "accepted" ? "success" : sub.status === "rejected" ? "error" : "default"}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{sub.description}</Typography>
                        <Stack direction="row" spacing={1}>
                          <Button
                            size="small"
                            variant="outlined"
                            href={`${config.pinataGateway}/${sub.sampleIpfsCid}`}
                            target="_blank"
                          >
                            View Sample
                          </Button>
                          {sub.status === "pending" && bounty.status === "open" && !deadlinePassed && (
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              startIcon={acceptLoading === sub._id ? <CircularProgress size={16} /> : <CheckCircleIcon />}
                              disabled={!!acceptLoading}
                              onClick={() => handleAccept(sub._id, sub.sellerWalletAddress)}
                            >
                              Accept & Pay {formatUSDC(bounty.rewardUSDC)}
                            </Button>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Grid>

            {/* Action Card */}
            <Grid item xs={12} md={4}>
              <Card elevation={0} sx={{ border: "1px solid", borderColor: "secondary.main", borderRadius: 3, position: "sticky", top: 80 }}>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                    <EmojiEventsIcon sx={{ color: "#FFB800", fontSize: 32 }} />
                    <Typography variant="h4" color="secondary" fontWeight={800}>
                      {formatUSDC(bounty.rewardUSDC)}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    USDC reward locked in smart contract. Released directly to winner on acceptance.
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  {bounty.status === "open" && !deadlinePassed && !isBuyer && (
                    <Button
                      variant="contained"
                      color="secondary"
                      fullWidth
                      size="large"
                      startIcon={<UploadIcon />}
                      onClick={() => setSubmitOpen(true)}
                      sx={{ fontWeight: 700 }}
                    >
                      Submit Your Data
                    </Button>
                  )}
                  {isBuyer && <Chip label="You posted this bounty" color="primary" fullWidth />}
                  {deadlinePassed && bounty.status === "open" && (
                    <Alert severity="warning" sx={{ mt: 1 }}>Deadline has passed. Only the bounty poster can refund.</Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Submit Dialog */}
          <Dialog open={submitOpen} onClose={() => setSubmitOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Submit Your Data</DialogTitle>
            <DialogContent>
              {submitError && <Alert severity="error" sx={{ mb: 2 }}>{submitError}</Alert>}
              <TextField fullWidth label="Submission Title" value={submitForm.title} onChange={(e) => setSubmitForm(p => ({ ...p, title: e.target.value }))} sx={{ mb: 2, mt: 1 }} />
              <TextField fullWidth label="Description" multiline rows={4} value={submitForm.description} onChange={(e) => setSubmitForm(p => ({ ...p, description: e.target.value }))} sx={{ mb: 2 }} />
              <Typography variant="subtitle2" gutterBottom>Sample File (max 10MB, public preview)</Typography>
              <input type="file" onChange={(e) => setSampleFile(e.target.files?.[0] || null)} style={{ marginBottom: 16 }} />
              <Typography variant="subtitle2" gutterBottom>Full Data File (max 500MB, private)</Typography>
              <input type="file" onChange={(e) => setFullDataFile(e.target.files?.[0] || null)} />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSubmitOpen(false)}>Cancel</Button>
              <Button variant="contained" onClick={handleSubmit} disabled={submitting} startIcon={submitting ? <CircularProgress size={16} /> : <UploadIcon />}>
                Submit
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </MainLayout>
    </ProtectedRoute>
  );
}
