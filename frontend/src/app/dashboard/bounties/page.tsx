"use client";

import {
  Typography, Box, Grid, Card, CardContent, CircularProgress, Chip,
  Accordion, AccordionSummary, AccordionDetails, Button, Stack, Alert
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useGetUserBountiesQuery } from "@/redux/api/userApi";
import { Bounty, Submission } from "@/types";
import { formatUSDC, formatDate, isDeadlinePassed } from "@/utils";
import { useInitiateRefundMutation, useConfirmRefundMutation } from "@/redux/api/bountyApi";
import { useAuth } from "@/providers/auth-provider";
import { useState } from "react";
import algosdk from "algosdk";
import config from "@/config";
import { submittedTxIdFromAlgodResponse } from "@/utils/algod";

export default function DashboardBountiesPage() {
  const { data, isLoading, refetch } = useGetUserBountiesQuery();
  const [initiateRefund] = useInitiateRefundMutation();
  const [confirmRefund] = useConfirmRefundMutation();
  const { peraWallet } = useAuth();
  const [refundLoading, setRefundLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      setError(err instanceof Error ? err.message : "Refund failed");
    } finally {
      setRefundLoading(null);
    }
  };

  if (isLoading) return <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} gutterBottom>My Bounties</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {(data?.bounties as Array<Bounty & { submissions?: Submission[] }> | undefined)?.map((bounty) => {
        const deadlinePassed = isDeadlinePassed(bounty.deadline);
        return (
          <Accordion key={bounty._id} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, mb: 2, "&:before": { display: "none" } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center", pr: 2 }}>
                <Box>
                  <Typography fontWeight={700}>{bounty.title}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {bounty.submissionCount} submissions · Due {formatDate(bounty.deadline)}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <Chip label={bounty.status} size="small" color={bounty.status === "open" ? "success" : "default"} />
                  <Typography fontWeight={700} color="secondary">{formatUSDC(bounty.rewardUSDC)}</Typography>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{bounty.description}</Typography>
              {bounty.status === "open" && deadlinePassed && (
                <Button
                  variant="outlined"
                  color="warning"
                  size="small"
                  disabled={refundLoading === bounty._id}
                  onClick={() => handleRefund(bounty._id)}
                  sx={{ mb: 2 }}
                >
                  {refundLoading === bounty._id ? "Processing..." : "Refund Escrow"}
                </Button>
              )}
              {bounty.submissions && bounty.submissions.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>Submissions:</Typography>
                  {bounty.submissions.map((sub) => (
                    <Card key={sub._id} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, mb: 1 }}>
                      <CardContent sx={{ py: "8px !important" }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography variant="body2" fontWeight={600}>{sub.title}</Typography>
                          <Chip label={sub.status} size="small" color={sub.status === "accepted" ? "success" : sub.status === "rejected" ? "error" : "default"} />
                        </Box>
                        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                          <Button size="small" href={`${config.pinataGateway}/${sub.sampleIpfsCid}`} target="_blank">
                            Preview Sample
                          </Button>
                          {sub.status === "pending" && (
                            <Button size="small" variant="contained" href={`/bounty/${bounty._id}`}>
                              Review & Accept
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
          No bounties posted yet. <a href="/dashboard/post-bounty">Post a bounty →</a>
        </Typography>
      )}
    </Box>
  );
}
