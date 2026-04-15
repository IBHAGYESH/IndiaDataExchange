"use client";

import {
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Button,
  alpha,
  useTheme,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DownloadIcon from "@mui/icons-material/Download";
import { useGetSubmissionsQuery } from "@/redux/api/userApi";
import { Submission } from "@/types";
import { formatDate, formatUSDC } from "@/utils";
import config from "@/config";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import SubmissionDataChips from "@/components/bounty/SubmissionDataChips";

type PopulatedBounty = { title: string; rewardUSDC: number; _id: string; status?: string; deadline?: string };

type SubmissionRow = Submission & {
  bountyId?: PopulatedBounty;
  downloadUrl?: string;
};

export default function SubmissionsPage() {
  const { t } = useTranslation("dashboard");
  const theme = useTheme();
  const { data, isLoading } = useGetSubmissionsQuery();

  const previewSx = {
    fontSize: "0.8rem",
    borderColor: alpha(theme.palette.divider, 0.2),
    "&:hover": { borderColor: "primary.main" },
  };

  if (isLoading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} gutterBottom>
        {t("submissionsTitle")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t("submissionsCount", { count: data?.total || 0 })}
      </Typography>

      {(data?.submissions as SubmissionRow[] | undefined)?.map((sub) => {
        const bounty = sub.bountyId;
        const reward = bounty?.rewardUSDC ?? 0;

        return (
          <Card
            key={sub._id}
            elevation={0}
            sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, mb: 2 }}
          >
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 1,
                  mb: 1,
                }}
              >
                <Typography fontWeight={700}>{sub.title}</Typography>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Chip
                    label={sub.status}
                    size="small"
                    color={
                      sub.status === "accepted" ? "success" : sub.status === "rejected" ? "error" : "default"
                    }
                    sx={{ fontWeight: 700 }}
                  />
                  {sub.status === "accepted" && reward > 0 && (
                    <Typography variant="body2" fontWeight={800} color="success.main">
                      {t("wonAmount", { amount: formatUSDC(reward) })}
                    </Typography>
                  )}
                </Stack>
              </Box>

              <SubmissionDataChips format={sub.format} recordCount={sub.recordCount} sizeBytes={sub.sizeBytes} />

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {sub.description}
              </Typography>

              {bounty && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                  {t("forBounty")}{" "}
                  <Link href={`/bounty/${bounty._id}`}>{bounty.title}</Link>
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                {t("submittedAt", { date: formatDate(sub.createdAt) })}
              </Typography>

              {sub.status === "accepted" && sub.paymentTxId && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
                  {t("paymentExplorer")}{" "}
                  <a
                    href={`${config.algoExplorerTxUrl}/${sub.paymentTxId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("viewExplorerShort")}
                  </a>
                </Typography>
              )}

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<VisibilityIcon />}
                  href={`${config.pinataGateway}/${sub.sampleIpfsCid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={previewSx}
                >
                  {t("viewSample")}
                </Button>
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
                    {t("downloadFull")}
                  </Button>
                )}
              </Stack>
            </CardContent>
          </Card>
        );
      })}

      {(!data?.submissions || data.submissions.length === 0) && (
        <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
          {t("submissionsEmpty")}{" "}
          <Link href="/bounties">{t("submissionsEmptyLink")}</Link>
        </Typography>
      )}
    </Box>
  );
}
