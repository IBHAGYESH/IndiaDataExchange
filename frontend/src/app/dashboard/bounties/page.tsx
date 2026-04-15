"use client";

import {
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Stack,
  Alert,
  alpha,
  useTheme,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DownloadIcon from "@mui/icons-material/Download";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useGetUserBountiesQuery } from "@/redux/api/userApi";
import { Bounty, Submission } from "@/types";
import { formatUSDC, formatDate, isDeadlinePassed, truncateAddress } from "@/utils";
import {
  useInitiateRefundMutation,
  useConfirmRefundMutation,
  useAcceptSubmissionMutation,
  useConfirmAcceptanceMutation,
} from "@/redux/api/bountyApi";
import { useAuth } from "@/providers/auth-provider";
import { useState } from "react";
import algosdk from "algosdk";
import config from "@/config";
import { submittedTxIdFromAlgodResponse } from "@/utils/algod";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import SubmissionDataChips from "@/components/bounty/SubmissionDataChips";

export default function DashboardBountiesPage() {
  const { t } = useTranslation("bounties");
  const { t: tc } = useTranslation("common");
  const theme = useTheme();
  const { data, isLoading, refetch } = useGetUserBountiesQuery();
  const [initiateRefund] = useInitiateRefundMutation();
  const [confirmRefund] = useConfirmRefundMutation();
  const [acceptSubmission] = useAcceptSubmissionMutation();
  const [confirmAcceptance] = useConfirmAcceptanceMutation();
  const { peraWallet } = useAuth();
  const [refundLoading, setRefundLoading] = useState<string | null>(null);
  const [acceptLoading, setAcceptLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  const handleRefund = async (bountyId: string) => {
    if (!peraWallet) return;
    setRefundLoading(bountyId);
    setError(null);
    try {
      const { unsignedTxnBase64 } = await initiateRefund(bountyId).unwrap();
      const txnBytes = Buffer.from(unsignedTxnBase64, "base64");
      const txn = algosdk.decodeUnsignedTransaction(txnBytes);
      const signedTxns = await peraWallet.signTransaction([[{ txn }]]);
      const algodClient = new algosdk.Algodv2("", "https://testnet-api.algonode.cloud", "");
      const submitRes = await algodClient.sendRawTransaction(signedTxns[0]).do();
      const txId = submittedTxIdFromAlgodResponse(submitRes as { txid?: string; txId?: string });
      await algosdk.waitForConfirmation(algodClient, txId, 4);
      await confirmRefund({ bountyId, txId }).unwrap();
      refetch();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("refundFailed"));
    } finally {
      setRefundLoading(null);
    }
  };

  const handleAccept = async (bountyId: string, submissionId: string) => {
    if (!peraWallet) return;
    setAcceptLoading(submissionId);
    setAcceptError(null);
    try {
      const { unsignedTxnBase64 } = await acceptSubmission({ bountyId, submissionId }).unwrap();
      const txnBytes = Buffer.from(unsignedTxnBase64, "base64");
      const txn = algosdk.decodeUnsignedTransaction(txnBytes);
      const signedTxns = await peraWallet.signTransaction([[{ txn }]]);
      const algodClient = new algosdk.Algodv2("", "https://testnet-api.algonode.cloud", "");
      const submitRes = await algodClient.sendRawTransaction(signedTxns[0]).do();
      const txId = submittedTxIdFromAlgodResponse(submitRes as { txid?: string; txId?: string });
      await algosdk.waitForConfirmation(algodClient, txId, 4);
      await confirmAcceptance({ bountyId, submissionId, txId }).unwrap();
      refetch();
    } catch (err: unknown) {
      setAcceptError(err instanceof Error ? err.message : t("errAccept"));
    } finally {
      setAcceptLoading(null);
    }
  };

  if (isLoading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );

  const previewBtnSx = {
    fontSize: "0.8rem",
    borderColor: alpha(theme.palette.divider, 0.2),
    "&:hover": { borderColor: "primary.main" },
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} gutterBottom>
        {t("dashboardTitle")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t("dashboardSubtitle", { count: data?.total ?? 0 })}
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {acceptError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setAcceptError(null)}>
          {acceptError}
        </Alert>
      )}

      {(data?.bounties as Array<Bounty & { submissions?: Submission[] }> | undefined)?.map((bounty) => {
        const deadlinePassed = isDeadlinePassed(bounty.deadline);
        const canAcceptPending = bounty.status === "open" && !deadlinePassed;

        return (
          <Accordion
            key={bounty._id}
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              mb: 2,
              "&:before": { display: "none" },
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center", pr: 2 }}>
                <Box>
                  <Typography fontWeight={700}>{bounty.title}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t("submissionSummary", {
                      count: bounty.submissionCount,
                      date: formatDate(bounty.deadline),
                    })}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <Chip label={bounty.status} size="small" color={bounty.status === "open" ? "success" : "default"} />
                  <Typography fontWeight={700} color="secondary">
                    {formatUSDC(bounty.rewardUSDC)}
                  </Typography>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {bounty.description}
              </Typography>
              {bounty.status === "open" && deadlinePassed && (
                <Button
                  variant="outlined"
                  color="warning"
                  size="small"
                  disabled={refundLoading === bounty._id}
                  onClick={() => handleRefund(bounty._id)}
                  sx={{ mb: 2 }}
                >
                  {refundLoading === bounty._id ? tc("processing") : t("refundEscrow")}
                </Button>
              )}
              {bounty.submissions && bounty.submissions.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    {t("submissions")}
                  </Typography>
                  {bounty.submissions.map((sub) => (
                    <Card
                      key={sub._id}
                      elevation={0}
                      sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, mb: 1.5 }}
                    >
                      <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1, mb: 1 }}>
                          <Typography variant="subtitle1" fontWeight={700}>
                            {sub.title}
                          </Typography>
                          <Chip
                            label={sub.status}
                            size="small"
                            color={
                              sub.status === "accepted" ? "success" : sub.status === "rejected" ? "error" : "default"
                            }
                          />
                        </Box>
                        <SubmissionDataChips format={sub.format} recordCount={sub.recordCount} sizeBytes={sub.sizeBytes} />
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, whiteSpace: "pre-wrap" }}>
                          {sub.description}
                        </Typography>
                        <Typography variant="caption" color="text.disabled" display="block" sx={{ mb: 1.5 }}>
                          {t("submitterLabel", { address: truncateAddress(sub.sellerWalletAddress) })}
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<VisibilityIcon />}
                            href={`${config.pinataGateway}/${sub.sampleIpfsCid}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={previewBtnSx}
                          >
                            {t("previewSample")}
                          </Button>
                          {sub.status === "pending" && canAcceptPending && (
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
                              onClick={() => handleAccept(bounty._id, sub._id)}
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
            </AccordionDetails>
          </Accordion>
        );
      })}

      {(!data?.bounties || data.bounties.length === 0) && (
        <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
          {t("noBountiesPosted")}{" "}
          <Link href="/dashboard/post-bounty">{t("postBountyLink")}</Link>
        </Typography>
      )}
    </Box>
  );
}
