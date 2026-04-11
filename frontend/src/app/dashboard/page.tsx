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
import { useGetProfileQuery } from "@/redux/api/userApi";
import { useAuth } from "@/providers/auth-provider";
import { truncateAddress } from "@/utils";
import USDCOptInPrompt from "@/components/shared/USDCOptInPrompt";
import { useState } from "react";
import Link from "next/link";

export default function DashboardPage() {
  const { user: authUser, isOptedIn, refreshUser } = useAuth();
  const { data, isLoading } = useGetProfileQuery();
  const [optInOpen, setOptInOpen] = useState(false);

  if (isLoading) return <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} gutterBottom>
          Welcome back, {data?.user?.name || truncateAddress(authUser?.walletAddress || "")}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Your India Data Exchange dashboard
        </Typography>
      </Box>

      {!isOptedIn && (
        <Alert
          severity="warning"
          sx={{ mb: 3 }}
          action={
            <Button size="small" onClick={() => setOptInOpen(true)}>
              Opt In Now
            </Button>
          }
        >
          Your wallet is not opted into USDC. You need to opt-in before listing datasets or submitting bounty responses.
        </Alert>
      )}

      {data?.stats && <DashboardStats stats={data.stats} />}

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {[
          { label: "List a Dataset", href: "/dashboard/list-dataset", desc: "Earn USDC by sharing your data", color: "#138808" },
          { label: "Browse Marketplace", href: "/marketplace", desc: "Find datasets to power your AI", color: "#FF6B35" },
          { label: "Post a Bounty", href: "/dashboard/post-bounty", desc: "Request specific data with USDC reward", color: "#8B5CF6" },
          { label: "View Bounties", href: "/bounties", desc: "Earn USDC by fulfilling data requests", color: "#FFB800" },
        ].map((action) => (
          <Grid item xs={12} sm={6} md={3} key={action.label}>
            <Link href={action.href} style={{ textDecoration: "none" }}>
              <Card
                elevation={0}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 3,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  "&:hover": { transform: "translateY(-4px)", boxShadow: 4, borderColor: action.color },
                }}
              >
                <CardContent>
                  <Typography variant="h6" fontWeight={700} gutterBottom>{action.label}</Typography>
                  <Typography variant="body2" color="text.secondary">{action.desc}</Typography>
                </CardContent>
              </Card>
            </Link>
          </Grid>
        ))}
      </Grid>

      <USDCOptInPrompt
        open={optInOpen}
        onClose={() => setOptInOpen(false)}
        onOptInSuccess={() => { setOptInOpen(false); refreshUser(); }}
      />
    </Box>
  );
}
