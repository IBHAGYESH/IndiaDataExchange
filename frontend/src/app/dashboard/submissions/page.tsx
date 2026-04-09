"use client";

import {
  Typography, Box, Card, CardContent, Chip, CircularProgress,
  Stack, Button, Alert
} from "@mui/material";
import { useGetSubmissionsQuery } from "@/redux/api/userApi";
import { Submission } from "@/types";
import { formatDate } from "@/utils";
import config from "@/config";
import Link from "next/link";

export default function SubmissionsPage() {
  const { data, isLoading } = useGetSubmissionsQuery();

  if (isLoading) return <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} gutterBottom>My Submissions</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {data?.total || 0} bounty submissions
      </Typography>

      {(data?.submissions as Array<Submission & { bountyId: { title: string; rewardUSDC: number; _id: string } }> | undefined)?.map((sub) => (
        <Card key={sub._id} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, mb: 2 }}>
          <CardContent>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography fontWeight={700}>{sub.title}</Typography>
              <Chip
                label={sub.status}
                size="small"
                color={sub.status === "accepted" ? "success" : sub.status === "rejected" ? "error" : "default"}
                sx={{ fontWeight: 700 }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{sub.description}</Typography>
            {sub.bountyId && (
              <Typography variant="caption" color="text.secondary">
                For bounty: <Link href={`/bounty/${sub.bountyId._id}`}>{sub.bountyId.title}</Link>
              </Typography>
            )}
            <br />
            <Typography variant="caption" color="text.secondary">
              Submitted {formatDate(sub.createdAt)}
            </Typography>
            {sub.status === "accepted" && sub.paymentTxId && (
              <Alert severity="success" sx={{ mt: 2 }}>
                🎉 Accepted! Payment Tx: <a href={`${config.algoExplorerTxUrl}/${sub.paymentTxId}`} target="_blank" rel="noopener noreferrer">{sub.paymentTxId.slice(0, 16)}...</a>
              </Alert>
            )}
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Button size="small" variant="outlined" href={`${config.pinataGateway}/${sub.sampleIpfsCid}`} target="_blank">
                View Sample
              </Button>
            </Stack>
          </CardContent>
        </Card>
      ))}

      {(!data?.submissions || data.submissions.length === 0) && (
        <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
          No submissions yet. <Link href="/bounties">Browse bounties →</Link>
        </Typography>
      )}
    </Box>
  );
}
