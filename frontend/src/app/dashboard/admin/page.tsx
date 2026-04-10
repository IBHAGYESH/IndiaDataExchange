"use client";

import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  alpha,
  useTheme,
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

const statCards = [
  { key: "totalUsers" as const, label: "Total Users", icon: <PeopleIcon />, color: "#8B5CF6" },
  { key: "totalDatasets" as const, label: "Total Datasets", icon: <StorageIcon />, color: "#FF6B35" },
  { key: "totalBounties" as const, label: "Total Bounties", icon: <EmojiEventsIcon />, color: "#F59E0B" },
  { key: "totalVolume" as const, label: "Total Volume (USDC)", icon: <AttachMoneyIcon />, color: "#2EC84F" },
];

export default function AdminOverviewPage() {
  const theme = useTheme();
  const { data, isLoading, isError, refetch } = useGetAdminStatsQuery();

  return (
    <AdminProtectedRoute>
      <Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
          <Typography variant="h4" fontWeight={800}>
            Platform Admin
          </Typography>
          <Chip label="Admin" size="small" sx={{ bgcolor: alpha("#FF6B35", 0.15), color: "#FF6B35", fontWeight: 600 }} />
        </Box>

        {isLoading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
            <CircularProgress />
          </Box>
        )}

        {isError && (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Typography color="error" gutterBottom>Failed to load stats.</Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ cursor: "pointer", textDecoration: "underline" }}
              onClick={() => refetch()}
            >
              Click to retry
            </Typography>
          </Box>
        )}

        {data && (
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
                      {stat.label}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        <Typography variant="h6" fontWeight={700} sx={{ mt: 5, mb: 3 }}>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          {[
            { label: "Manage Datasets", href: "/dashboard/admin/datasets", icon: <DatasetIcon />, desc: "Review, activate, or unlist datasets", color: "#FF6B35" },
            { label: "Manage Bounties", href: "/dashboard/admin/bounties", icon: <GavelIcon />, desc: "Oversee bounty statuses and disputes", color: "#F59E0B" },
          ].map((action) => (
            <Grid key={action.label} size={{ xs: 12, sm: 6 }}>
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
                        {action.label}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {action.desc}
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
