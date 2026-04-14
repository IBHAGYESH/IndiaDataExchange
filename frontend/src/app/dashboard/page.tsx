"use client";

import {
  Typography,
  Box,
  GridLegacy as Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
} from "@mui/material";
import DashboardStats from "@/components/dashboard/DashboardStats";
import UserActivityBarChart from "@/components/dashboard/UserActivityBarChart";
import { useGetProfileQuery } from "@/redux/api/userApi";
import { useAuth } from "@/providers/auth-provider";
import { truncateAddress } from "@/utils";
import USDCOptInPrompt from "@/components/shared/USDCOptInPrompt";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function DashboardPage() {
  const { t } = useTranslation("dashboard");
  const { user: authUser, isOptedIn, refreshUser } = useAuth();
  const { data, isLoading } = useGetProfileQuery();
  const [optInOpen, setOptInOpen] = useState(false);

  const address = truncateAddress(authUser?.walletAddress || "");

  const actions = useMemo(
    () => [
      {
        label: t("actionListDataset"),
        href: "/dashboard/list-dataset",
        desc: t("actionListDatasetDesc"),
        color: "#138808",
      },
      {
        label: t("actionBrowseMarketplace"),
        href: "/marketplace",
        desc: t("actionBrowseMarketplaceDesc"),
        color: "#FF6B35",
      },
      {
        label: t("actionPostBounty"),
        href: "/dashboard/post-bounty",
        desc: t("actionPostBountyDesc"),
        color: "#8B5CF6",
      },
      {
        label: t("actionViewBounties"),
        href: "/bounties",
        desc: t("actionViewBountiesDesc"),
        color: "#FFB800",
      },
    ],
    [t],
  );

  if (isLoading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} gutterBottom>
          {t("welcomeBack", { address })}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t("subtitle")}
        </Typography>
      </Box>

      {!isOptedIn && (
        <Alert
          severity="warning"
          sx={{ mb: 3 }}
          action={
            <Button size="small" onClick={() => setOptInOpen(true)}>
              {t("optInNow")}
            </Button>
          }
        >
          {t("usdcAlert")}
        </Alert>
      )}

      {data?.stats && <DashboardStats stats={data.stats} />}

      {data?.stats && <UserActivityBarChart stats={data.stats} />}

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {actions.map((action) => (
          <Grid item xs={12} sm={6} md={3} key={action.href}>
            <Link href={action.href} style={{ textDecoration: "none" }}>
              <Card
                elevation={0}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 3,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 4,
                    borderColor: action.color,
                  },
                }}
              >
                <CardContent>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    {action.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {action.desc}
                  </Typography>
                </CardContent>
              </Card>
            </Link>
          </Grid>
        ))}
      </Grid>

      <USDCOptInPrompt
        open={optInOpen}
        onClose={() => setOptInOpen(false)}
        onOptInSuccess={() => {
          setOptInOpen(false);
          refreshUser();
        }}
      />
    </Box>
  );
}
