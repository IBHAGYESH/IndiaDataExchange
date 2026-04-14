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

export interface AdminStatsShape {
  totalUsers: number;
  totalDatasets: number;
  totalBounties: number;
  totalVolume: number;
}

const COLORS = ["#8B5CF6", "#FF6B35", "#F59E0B", "#2EC84F"];

export default function AdminPlatformBarChart({ stats }: { stats: AdminStatsShape }) {
  const { t } = useTranslation("admin");
  const theme = useTheme();
  const data = [
    { label: t("totalUsers"), value: stats.totalUsers },
    { label: t("totalDatasets"), value: stats.totalDatasets },
    { label: t("totalBounties"), value: stats.totalBounties },
    { label: t("totalVolume"), value: Math.round(stats.totalVolume * 100) / 100 },
  ];

  return (
    <Box sx={{ mt: 4, width: "100%", height: 320 }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
        {t("platformMetricsChart")}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
        {t("platformMetricsChartHint")}
      </Typography>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 8, right: 16, top: 8, bottom: 32 }}>
          <XAxis
            dataKey="label"
            stroke={theme.palette.text.secondary}
            fontSize={11}
            interval={0}
            angle={-12}
            textAnchor="end"
            height={56}
          />
          <YAxis stroke={theme.palette.text.secondary} fontSize={12} />
          <Tooltip />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
