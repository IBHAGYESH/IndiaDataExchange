"use client";

import { GridLegacy as Grid, Card, CardContent, Typography, Box } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import StorageIcon from "@mui/icons-material/Storage";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { useAuth } from "@/providers/auth-provider";
import { formatUSDC } from "@/utils";
import type { UserDashboardStats } from "@/types";
import { useTranslation } from "react-i18next";

interface Props {
  stats: UserDashboardStats;
}

export default function DashboardStats({ stats }: Props) {
  const { t } = useTranslation("dashboard");
  const { user } = useAuth();

  const cards = [
    {
      label: t("totalEarnings"),
      value: formatUSDC(user?.totalEarnings || 0),
      icon: <TrendingUpIcon />,
      color: "#138808",
    },
    {
      label: t("totalSpent"),
      value: formatUSDC(user?.totalSpent || 0),
      icon: <ShoppingCartIcon />,
      color: "#FF6B35",
    },
    {
      label: t("datasetsListed"),
      value: stats.listed.toString(),
      icon: <StorageIcon />,
      color: "#8B5CF6",
    },
    {
      label: t("openBounties"),
      value: stats.bounties.toString(),
      icon: <EmojiEventsIcon />,
      color: "#FFB800",
    },
  ];

  return (
    <Grid container spacing={3}>
      {cards.map((card) => (
        <Grid item xs={6} md={3} key={card.label}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {card.label}
                  </Typography>
                  <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>
                    {card.value}
                  </Typography>
                </Box>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: `${card.color}20`, color: card.color }}>
                  {card.icon}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
