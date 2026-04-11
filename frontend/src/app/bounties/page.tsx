"use client";

import { Suspense, useCallback, useMemo } from "react";
import {
  Container,
  GridLegacy as Grid,
  Typography,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  CircularProgress,
  Fade,
  alpha,
  useTheme,
  Button,
  Stack,
  Chip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import MainLayout from "@/components/layouts/MainLayout";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import BountyCard from "@/components/bounty/BountyCard";
import { useGetBountiesQuery } from "@/redux/api/bountyApi";
import { useAuth } from "@/providers/auth-provider";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";

const CATEGORY_VALUES = ["", "agriculture", "language", "traffic", "healthcare", "cultural", "financial", "other"] as const;

export default function BountiesPage() {
  return (
    <Suspense>
      <BountiesContent />
    </Suspense>
  );
}

function BountiesContent() {
  const { t } = useTranslation("bounties");
  const { t: tm } = useTranslation("marketplace");
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const { isConnected } = useAuth();

  const categoryLabels = tm("categoryLabels", { returnObjects: true }) as Record<string, string>;

  const categoriesList = useMemo(
    () =>
      CATEGORY_VALUES.map((value) => ({
        value,
        label: value ? categoryLabels[value] ?? value : tm("allCategories"),
      })),
    [tm, categoryLabels],
  );

  const status = searchParams.get("status") || "open";
  const category = searchParams.get("category") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const apiStatus = status === "all" ? undefined : status;

  const updateUrl = useCallback(
    (params: Record<string, string>) => {
      const current = new URLSearchParams(searchParams.toString());
      Object.entries(params).forEach(([k, v]) => {
        if (v) current.set(k, v);
        else current.delete(k);
      });
      if (!("page" in params)) current.set("page", "1");
      router.push(`${pathname}?${current.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  const { data, isLoading, isError, refetch } = useGetBountiesQuery({
    status: apiStatus,
    category: category || undefined,
    page,
    limit: 12,
  });

  const categoryDisplay = category ? categoryLabels[category] ?? category : "";

  return (
    <ProtectedRoute>
      <MainLayout>
        <Box
          sx={{
            background: `linear-gradient(180deg, ${alpha(theme.palette.secondary.main, 0.04)} 0%, transparent 40%)`,
            minHeight: "100vh",
          }}
        >
          <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: 2,
                mb: { xs: 3, md: 4 },
              }}
            >
              <Box>
                <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: "-0.02em", mb: 0.5 }}>
                  {t("dataBountiesTitle")}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {t("dataBountiesSubtitle")}
                </Typography>
              </Box>
              {isConnected && (
                <Link href="/dashboard/post-bounty">
                  <Button variant="contained" startIcon={<AddIcon />}>
                    {t("postBountyCta")}
                  </Button>
                </Link>
              )}
            </Box>

            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1.5,
                mb: 4,
                p: 2,
                borderRadius: 3,
                bgcolor: alpha(theme.palette.background.paper, 0.7),
                backdropFilter: "blur(10px)",
                border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
              }}
            >
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>{t("filterStatus")}</InputLabel>
                <Select
                  value={status}
                  label={t("filterStatus")}
                  onChange={(e) => updateUrl({ status: e.target.value, page: "1" })}
                >
                  <MenuItem value="all">{t("allStatusesShort")}</MenuItem>
                  <MenuItem value="open">{t("open")}</MenuItem>
                  <MenuItem value="accepted">{t("accepted")}</MenuItem>
                  <MenuItem value="expired">{t("expired")}</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>{t("filterCategory")}</InputLabel>
                <Select
                  value={category}
                  label={t("filterCategory")}
                  onChange={(e) => updateUrl({ category: e.target.value, page: "1" })}
                >
                  {categoriesList.map((c) => (
                    <MenuItem key={c.value || "all"} value={c.value}>
                      {c.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {category && (
              <Stack direction="row" spacing={1} sx={{ mb: 3 }} flexWrap="wrap">
                <Chip
                  label={tm("categoryChip", { cat: categoryDisplay })}
                  onDelete={() => updateUrl({ category: "" })}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Stack>
            )}

            {isLoading && (
              <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
                <CircularProgress />
              </Box>
            )}

            {isError && (
              <Box sx={{ textAlign: "center", py: 8 }}>
                <Typography color="error" gutterBottom>
                  {t("loadFailed")}
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
              <Fade in timeout={400}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {t("bountiesFound", { count: data.total })}
                  </Typography>
                  <Grid container spacing={3}>
                    {data.bounties.map((bounty, idx) => (
                      <Grid
                        item
                        xs={12}
                        sm={6}
                        md={4}
                        lg={3}
                        key={bounty._id}
                        sx={{
                          animation: `fadeInUp 0.4s ease ${idx * 0.05}s both`,
                          "@keyframes fadeInUp": {
                            from: { opacity: 0, transform: "translateY(16px)" },
                            to: { opacity: 1, transform: "translateY(0)" },
                          },
                        }}
                      >
                        <BountyCard bounty={bounty} />
                      </Grid>
                    ))}
                  </Grid>
                  {data.totalPages > 1 && (
                    <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
                      <Pagination
                        count={data.totalPages}
                        page={page}
                        onChange={(_e, p) => updateUrl({ page: String(p) })}
                        color="primary"
                        shape="rounded"
                      />
                    </Box>
                  )}
                  {data.bounties.length === 0 && (
                    <Box sx={{ textAlign: "center", py: 8 }}>
                      <EmojiEventsIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        {t("noBountiesFilters")}
                      </Typography>
                      <Typography variant="body2" color="text.disabled">
                        {isConnected ? t("emptyHintPost") : t("emptyHintConnect")}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Fade>
            )}
          </Container>
        </Box>
      </MainLayout>
    </ProtectedRoute>
  );
}
