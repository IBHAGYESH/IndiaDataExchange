"use client";

import { useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  GridLegacy as Grid,
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
  Area,
  AreaChart,
} from "recharts";
import { useGetListingsQuery, useGetPurchasesQuery } from "@/redux/api/userApi";
import type { Dataset, Purchase } from "@/types";
import { useTranslation } from "react-i18next";
import { formatUSDC } from "@/utils";

const PIE_COLORS = ["#138808", "#FF6B35", "#8B5CF6", "#FFB800", "#0EA5E9", "#EC4899", "#64748B"];
const BAR_FILL = "#6366F1";

function aggregateCountByCategory(items: { category?: string }[]): { name: string; value: number }[] {
  const map = new Map<string, number>();
  for (const item of items) {
    const c = item.category || "other";
    map.set(c, (map.get(c) || 0) + 1);
  }
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}

function aggregateSpendByCategory(purchases: Purchase[]): { name: string; amount: number }[] {
  const map = new Map<string, number>();
  for (const p of purchases) {
    const cat = (p.datasetId?.category as string) || "other";
    map.set(cat, (map.get(cat) || 0) + (p.amountPaidUSDC || 0));
  }
  return Array.from(map.entries()).map(([name, amount]) => ({ name, amount }));
}

function simplifyCumulativeSeries(purchases: Purchase[]): { label: string; cumulative: number }[] {
  const sorted = [...purchases].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  let cum = 0;
  return sorted.map((p, idx) => {
    cum += p.amountPaidUSDC || 0;
    return { label: `#${idx + 1}`, cumulative: cum };
  });
}

export default function UserDashboardInsights() {
  const theme = useTheme();
  const { t } = useTranslation("dashboard");
  const { t: tm } = useTranslation("marketplace");
  const categoryLabels = tm("categoryLabels", { returnObjects: true }) as Record<string, string>;

  const { data: listingsData, isLoading: listingsLoading } = useGetListingsQuery();
  const { data: purchasesData, isLoading: purchasesLoading } = useGetPurchasesQuery();

  const listings = (listingsData?.datasets || []) as Dataset[];
  const purchases = (purchasesData?.purchases || []) as Purchase[];

  const labelForCat = (key: string) => categoryLabels[key] ?? key;

  const purchasesByCategory = useMemo(() => {
    const raw = aggregateCountByCategory(
      purchases.map((p) => ({ category: p.datasetId?.category })),
    );
    return raw.map((r) => ({ ...r, name: labelForCat(r.name) }));
  }, [purchases, categoryLabels]);

  const listingsByCategory = useMemo(() => {
    const raw = aggregateCountByCategory(listings.map((d) => ({ category: d.category })));
    return raw.map((r) => ({ ...r, name: labelForCat(r.name) }));
  }, [listings, categoryLabels]);

  const spendByCategory = useMemo(() => {
    const raw = aggregateSpendByCategory(purchases);
    return raw.map((r) => ({ ...r, name: labelForCat(r.name) }));
  }, [purchases, categoryLabels]);

  const cumulativeSeries = useMemo(() => simplifyCumulativeSeries(purchases), [purchases]);

  const loading = listingsLoading || purchasesLoading;
  const axisColor = theme.palette.text.secondary;
  const gridColor = alpha(theme.palette.divider, 0.35);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress size={36} />
      </Box>
    );
  }

  const EmptyHint = ({ k }: { k: string }) => (
    <Box sx={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Typography variant="body2" color="text.secondary" textAlign="center" px={2}>
        {t(k)}
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
        {t("insightsSectionTitle")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t("insightsSectionSubtitle")}
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 3, height: "100%" }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                {t("chartPurchasesCategoryPieTitle")}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                {t("chartPurchasesCategoryPieHint")}
              </Typography>
              {purchases.length === 0 ? (
                <EmptyHint k="chartNoPurchasesYet" />
              ) : purchasesByCategory.length === 0 ? (
                <EmptyHint k="chartNoCategoryData" />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={purchasesByCategory}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={88}
                      paddingAngle={2}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {purchasesByCategory.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 3, height: "100%" }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                {t("chartSpendByCategoryBarTitle")}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                {t("chartSpendByCategoryBarHint")}
              </Typography>
              {purchases.length === 0 ? (
                <EmptyHint k="chartNoPurchasesYet" />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={spendByCategory} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis type="number" stroke={axisColor} fontSize={11} tickFormatter={(v) => `$${v}`} />
                    <YAxis type="category" dataKey="name" width={100} stroke={axisColor} fontSize={11} />
                    <Tooltip formatter={(v: number) => formatUSDC(v)} />
                    <Bar dataKey="amount" fill={BAR_FILL} radius={[0, 4, 4, 0]} name={t("chartSpendSeriesName")} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 3, height: "100%" }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                {t("chartListingsCategoryBarTitle")}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                {t("chartListingsCategoryBarHint")}
              </Typography>
              {listings.length === 0 ? (
                <EmptyHint k="chartNoListingsYet" />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={listingsByCategory} margin={{ bottom: 48 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="name" stroke={axisColor} fontSize={11} angle={-25} textAnchor="end" height={70} />
                    <YAxis stroke={axisColor} fontSize={11} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#138808" radius={[4, 4, 0, 0]} name={t("chartListingsCountName")} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 3, height: "100%" }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                {t("chartCumulativeSpendTitle")}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                {t("chartCumulativeSpendHint")}
              </Typography>
              {purchases.length === 0 ? (
                <EmptyHint k="chartNoPurchasesYet" />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={cumulativeSeries} margin={{ right: 8 }}>
                    <defs>
                      <linearGradient id="userSpendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FF6B35" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#FF6B35" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="label" stroke={axisColor} fontSize={10} label={{ value: t("chartPurchaseOrderAxis"), position: "insideBottom", offset: -4, fill: axisColor, fontSize: 10 }} />
                    <YAxis stroke={axisColor} fontSize={11} tickFormatter={(v) => `$${v}`} />
                    <Tooltip formatter={(v: number) => formatUSDC(v)} />
                    <Area
                      type="monotone"
                      dataKey="cumulative"
                      stroke="#FF6B35"
                      strokeWidth={2}
                      fill="url(#userSpendGrad)"
                      name={t("chartCumulativeLabel")}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
