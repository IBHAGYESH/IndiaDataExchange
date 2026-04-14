"use client";

import { Box, Typography, useTheme } from "@mui/material";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTranslation } from "react-i18next";
import type { UserDashboardStats } from "@/types";

const COLORS = ["#138808", "#FF6B35", "#8B5CF6", "#FFB800"];

export default function UserActivityBarChart({ stats }: { stats: UserDashboardStats }) {
  const { t } = useTranslation("dashboard");
  const theme = useTheme();
  const data = [
    { label: t("chartListed"), value: stats.listed },
    { label: t("chartPurchases"), value: stats.purchases },
    { label: t("chartBounties"), value: stats.bounties },
    { label: t("chartSubmissions"), value: stats.submissions },
  ];

  return (
    <Box sx={{ mt: 3, width: "100%", height: 300 }}>
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: "text.secondary" }}>
        {t("activityOverview")}
      </Typography>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 4, right: 16, top: 8, bottom: 8 }}
        >
          <XAxis
            type="number"
            stroke={theme.palette.text.secondary}
            fontSize={12}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={118}
            stroke={theme.palette.text.secondary}
            fontSize={12}
          />
          <Tooltip />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
