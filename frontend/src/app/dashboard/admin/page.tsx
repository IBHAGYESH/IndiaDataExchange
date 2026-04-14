"use client";

import { useMemo } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  alpha,
  Chip,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import StorageIcon from "@mui/icons-material/Storage";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import DatasetIcon from "@mui/icons-material/TableChart";
import GavelIcon from "@mui/icons-material/Gavel";
import Link from "next/link";
import AdminProtectedRoute from "@/components/shared/AdminProtectedRoute";
import { useGetAdminStatsQuery } from "@/redux/api/adminApi";
import AdminDashboardInsights from "@/components/dashboard/AdminDashboardInsights";
import { useTranslation } from "react-i18next";

export default function AdminOverviewPage() {
  const { t } = useTranslation("admin");
  const { data, isLoading, isError, refetch } = useGetAdminStatsQuery();

  const statCards = useMemo(
    () =>
      [
        { key: "totalUsers" as const, labelKey: "totalUsers", icon: <PeopleIcon />, color: "#8B5CF6" },
        { key: "totalDatasets" as const, labelKey: "totalDatasets", icon: <StorageIcon />, color: "#FF6B35" },
        { key: "totalBounties" as const, labelKey: "totalBounties", icon: <EmojiEventsIcon />, color: "#F59E0B" },
        { key: "totalVolume" as const, labelKey: "totalVolume", icon: <AttachMoneyIcon />, color: "#2EC84F" },
      ] as const,
    [],
  );

  const quickActions = useMemo(
    () =>
      [
        {
          labelKey: "manageDatasets" as const,
          href: "/dashboard/admin/datasets",
          icon: <DatasetIcon />,
          descKey: "manageDatasetsDesc" as const,
          color: "#FF6B35",
        },
        {
          labelKey: "manageBounties" as const,
          href: "/dashboard/admin/bounties",
          icon: <GavelIcon />,
          descKey: "manageBountiesDesc" as const,
          color: "#F59E0B",
        },
      ] as const,
    [],
  );

  return (
    <AdminProtectedRoute>
      <Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
          <Typography variant="h4" fontWeight={800}>
            {t("platformAdmin")}
          </Typography>
          <Chip
            label={t("adminChip")}
            size="small"
            sx={{ bgcolor: alpha("#FF6B35", 0.15), color: "#FF6B35", fontWeight: 600 }}
          />
        </Box>

        {isLoading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
            <CircularProgress />
          </Box>
        )}

        {isError && (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Typography color="error" gutterBottom>
              {t("failedLoadStats")}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ cursor: "pointer", textDecoration: "underline" }}
              onClick={() => refetch()}
            >
              {t("clickRetry")}
            </Typography>
          </Box>
        )}

        {data && (
          <>
          <Grid container spacing={3}>
            {statCards.map((stat) => (
              <Grid key={stat.key} size={{ xs: 12, sm: 6, md: 3 }}>
                <Card
                  elevation={0}
                  sx={{
                    height: "100%",
                    borderLeft: `4px solid ${stat.color}`,
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: 2.5,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: alpha(stat.color, 0.12),
                          color: stat.color,
                        }}
                      >
                        {stat.icon}
                      </Box>
                    </Box>
                    <Typography variant="h4" fontWeight={800} sx={{ mb: 0.5 }}>
                      {stat.key === "totalVolume" ? `$${data[stat.key].toFixed(2)}` : data[stat.key]}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      {t(stat.labelKey)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          <AdminDashboardInsights />
          </>
        )}

        <Typography variant="h6" fontWeight={700} sx={{ mt: 5, mb: 3 }}>
          {t("quickActions")}
        </Typography>
        <Grid container spacing={2}>
          {quickActions.map((action) => (
            <Grid key={action.labelKey} size={{ xs: 12, sm: 6 }}>
              <Link href={action.href} style={{ textDecoration: "none" }}>
                <Card
                  elevation={0}
                  sx={{
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      borderColor: action.color,
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  <CardContent sx={{ p: 3, display: "flex", alignItems: "center", gap: 2.5 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 3,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: alpha(action.color, 0.12),
                        color: action.color,
                        flexShrink: 0,
                      }}
                    >
                      {action.icon}
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700}>
                        {t(action.labelKey)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t(action.descKey)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Link>
            </Grid>
          ))}
        </Grid>
      </Box>
    </AdminProtectedRoute>
  );
}
