"use client";

import { useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  alpha,
  useTheme,
} from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useGetAdminDatasetsQuery, useGetAdminBountiesQuery } from "@/redux/api/adminApi";
import type { Dataset, Bounty } from "@/types";
import { useTranslation } from "react-i18next";

const STATUS_COLORS: Record<string, string> = {
  active: "#2EC84F",
  unlisted: "#94A3B8",
  unknown: "#64748B",
  open: "#2EC84F",
  accepted: "#3B82F6",
  cancelled: "#EF4444",
  expired: "#A1A1AA",
};

const PIE_FALLBACK = ["#8B5CF6", "#0EA5E9", "#EC4899", "#14B8A6", "#F97316"];

function countByField<T>(items: T[], getKey: (item: T) => string): { name: string; value: number }[] {
  const map = new Map<string, number>();
  for (const item of items) {
    const k = getKey(item);
    map.set(k, (map.get(k) || 0) + 1);
  }
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}

function sumByCategory(bounties: Bounty[]): { name: string; totalReward: number }[] {
  const map = new Map<string, number>();
  for (const b of bounties) {
    const c = b.category || "other";
    map.set(c, (map.get(c) || 0) + (b.rewardUSDC || 0));
  }
  return Array.from(map.entries()).map(([name, totalReward]) => ({ name, totalReward }));
}

const AGG_LIMIT = 500;

export default function AdminDashboardInsights() {
  const theme = useTheme();
  const { t } = useTranslation("admin");
  const { t: tm } = useTranslation("marketplace");
  const { t: tb } = useTranslation("bounties");
  const categoryLabels = tm("categoryLabels", { returnObjects: true }) as Record<string, string>;

  const { data: dsData, isLoading: dsLoading } = useGetAdminDatasetsQuery({ page: 1, limit: AGG_LIMIT });
  const { data: boData, isLoading: boLoading } = useGetAdminBountiesQuery({ page: 1, limit: AGG_LIMIT });

  const datasets = (dsData?.datasets || []) as Dataset[];
  const bounties = (boData?.bounties || []) as Bounty[];

  const labelCat = (k: string) => categoryLabels[k] ?? k;

  const listingStatusPie = useMemo(() => {
    const raw = countByField(datasets, (d) => d.status || "unknown");
    return raw.map((r) => ({
      status: r.name,
      value: r.value,
      name: t(`datasetListingStatus_${r.name}`, { defaultValue: r.name }),
    }));
  }, [datasets, t]);

  const datasetsByCategory = useMemo(() => {
    const raw = countByField(datasets, (d) => d.category || "other");
    return raw.map((r) => ({ ...r, name: labelCat(r.name) }));
  }, [datasets, categoryLabels]);

  const bountyStatusPie = useMemo(() => {
    const raw = countByField(bounties, (b) => b.status || "unknown");
    return raw.map((r) => ({
      status: r.name,
      value: r.value,
      name: tb(`status_${r.name}`, { defaultValue: r.name }),
    }));
  }, [bounties, tb]);

  const escrowByCategory = useMemo(() => {
    const raw = sumByCategory(bounties);
    return raw.map((r) => ({ ...r, name: labelCat(r.name) }));
  }, [bounties, categoryLabels]);

  const loading = dsLoading || boLoading;
  const axisColor = theme.palette.text.secondary;
  const gridColor = alpha(theme.palette.divider, 0.35);

  const sampleNote =
    (dsData?.total ?? 0) > AGG_LIMIT || (boData?.total ?? 0) > AGG_LIMIT
      ? t("adminChartSampleNote", { limit: AGG_LIMIT })
      : null;

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress size={36} />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
        {t("adminInsightsTitle")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t("adminInsightsSubtitle")}
      </Typography>
      {sampleNote && (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
          {sampleNote}
        </Typography>
      )}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 3, height: "100%" }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                {t("adminChartListingStatusTitle")}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                {t("adminChartListingStatusHint")}
              </Typography>
              {datasets.length === 0 ? (
                <Box sx={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    {t("adminChartNoDatasets")}
                  </Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={listingStatusPie}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={86}
                      paddingAngle={2}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {listingStatusPie.map((entry, i) => (
                        <Cell key={i} fill={STATUS_COLORS[entry.status] ?? PIE_FALLBACK[i % PIE_FALLBACK.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 3, height: "100%" }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                {t("adminChartBountyStatusTitle")}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                {t("adminChartBountyStatusHint")}
              </Typography>
              {bounties.length === 0 ? (
                <Box sx={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    {t("adminChartNoBounties")}
                  </Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={bountyStatusPie}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={88}
                      paddingAngle={2}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {bountyStatusPie.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={STATUS_COLORS[entry.status] ?? PIE_FALLBACK[i % PIE_FALLBACK.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 3, height: "100%" }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                {t("adminChartCatalogByCategoryTitle")}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                {t("adminChartCatalogByCategoryHint")}
              </Typography>
              {datasets.length === 0 ? (
                <Box sx={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    {t("adminChartNoDatasets")}
                  </Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={datasetsByCategory} margin={{ bottom: 52 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="name" stroke={axisColor} fontSize={11} angle={-22} textAnchor="end" height={72} />
                    <YAxis stroke={axisColor} fontSize={11} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#FF6B35" radius={[4, 4, 0, 0]} name={t("adminChartDatasetCount")} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 3, height: "100%" }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                {t("adminChartEscrowByCategoryTitle")}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                {t("adminChartEscrowByCategoryHint")}
              </Typography>
              {bounties.length === 0 ? (
                <Box sx={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    {t("adminChartNoBounties")}
                  </Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={escrowByCategory} layout="vertical" margin={{ left: 4, right: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis type="number" stroke={axisColor} fontSize={11} tickFormatter={(v) => `$${v}`} />
                    <YAxis type="category" dataKey="name" width={108} stroke={axisColor} fontSize={11} />
                    <Tooltip formatter={(v: number) => `$${v.toFixed(2)} USDC`} />
                    <Bar dataKey="totalReward" fill="#F59E0B" radius={[0, 4, 4, 0]} name={t("adminChartRewardSum")} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
