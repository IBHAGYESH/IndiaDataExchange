"use client";

import { Suspense, useCallback, useMemo } from "react";
import {
  Container,
  GridLegacy as Grid,
  Typography,
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  CircularProgress,
  InputAdornment,
  Fade,
  alpha,
  useTheme,
  Chip,
  Stack,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import TuneIcon from "@mui/icons-material/Tune";
import MainLayout from "@/components/layouts/MainLayout";
import DatasetCard from "@/components/dataset/DatasetCard";
import { useGetDatasetsQuery } from "@/redux/api/datasetApi";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";

const CATEGORY_VALUES = ["", "agriculture", "language", "traffic", "healthcare", "cultural", "financial", "other"] as const;
const FORMAT_VALUES = ["", "csv", "json", "images", "audio", "video", "pdf", "other"] as const;

export default function MarketplacePage() {
  return (
    <Suspense>
      <MarketplaceContent />
    </Suspense>
  );
}

function MarketplaceContent() {
  const { t } = useTranslation("marketplace");
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();

  const categoryLabels = t("categoryLabels", { returnObjects: true }) as Record<string, string>;
  const formatLabels = t("formatLabels", { returnObjects: true }) as Record<string, string>;

  const categories = useMemo(
    () =>
      CATEGORY_VALUES.map((value) => ({
        value,
        label: value ? categoryLabels[value] ?? value : t("allCategories"),
      })),
    [t, categoryLabels],
  );

  const formats = useMemo(
    () =>
      FORMAT_VALUES.map((value) => ({
        value,
        label: value ? formatLabels[value] ?? value : t("allFormats"),
      })),
    [t, formatLabels],
  );

  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const format = searchParams.get("format") || "";
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const page = parseInt(searchParams.get("page") || "1", 10);

  const updateUrl = useCallback(
    (params: Record<string, string>) => {
      const current = new URLSearchParams(searchParams.toString());
      Object.entries(params).forEach(([k, v]) => {
        if (v) current.set(k, v);
        else current.delete(k);
      });
      if (params.page === undefined && !("page" in params)) {
        current.set("page", "1");
      }
      router.push(`${pathname}?${current.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  const { data, isLoading, isError, refetch } = useGetDatasetsQuery({
    search: search || undefined,
    category: category || undefined,
    format: format || undefined,
    sortBy,
    sortOrder: "desc",
    page,
    limit: 12,
  });

  const categoryDisplay = category ? categoryLabels[category] ?? category : "";
  const formatDisplay = format ? formatLabels[format] ?? format : "";

  return (
    <MainLayout>
      <Box
        sx={{
          background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.04)} 0%, transparent 40%)`,
          minHeight: "100vh",
        }}
      >
        <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
          <Box sx={{ mb: { xs: 3, md: 4 } }}>
            <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: "-0.02em", mb: 0.5 }}>
              {t("pageTitle")}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t("pageSubtitle")}
            </Typography>
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
            <TextField
              size="small"
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={(e) => updateUrl({ search: e.target.value, page: "1" })}
              sx={{ flex: "1 1 260px" }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>{t("category")}</InputLabel>
              <Select
                value={category}
                label={t("category")}
                onChange={(e) => updateUrl({ category: e.target.value, page: "1" })}
              >
                {categories.map((c) => (
                  <MenuItem key={c.value || "all"} value={c.value}>
                    {c.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>{t("format")}</InputLabel>
              <Select
                value={format}
                label={t("format")}
                onChange={(e) => updateUrl({ format: e.target.value, page: "1" })}
              >
                {formats.map((f) => (
                  <MenuItem key={f.value || "all-f"} value={f.value}>
                    {f.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>{t("sortBy")}</InputLabel>
              <Select
                value={sortBy}
                label={t("sortBy")}
                onChange={(e) => updateUrl({ sortBy: e.target.value })}
              >
                <MenuItem value="createdAt">{t("newest")}</MenuItem>
                <MenuItem value="price">{t("sortPrice")}</MenuItem>
                <MenuItem value="purchases">{t("mostPopular")}</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {(category || format || search) && (
            <Stack direction="row" spacing={1} sx={{ mb: 3 }} flexWrap="wrap">
              {search && (
                <Chip label={t("searchChip", { q: search })} onDelete={() => updateUrl({ search: "" })} size="small" />
              )}
              {category && (
                <Chip
                  label={t("categoryChip", { cat: categoryDisplay })}
                  onDelete={() => updateUrl({ category: "" })}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
              {format && (
                <Chip
                  label={t("formatChipFilter", { fmt: formatDisplay })}
                  onDelete={() => updateUrl({ format: "" })}
                  size="small"
                  color="secondary"
                  variant="outlined"
                />
              )}
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
                  {t("datasetsFound", { count: data.total })}
                </Typography>
                <Grid container spacing={3}>
                  {data.datasets.map((dataset, idx) => (
                    <Grid
                      item
                      xs={12}
                      sm={6}
                      md={4}
                      lg={3}
                      key={dataset._id}
                      sx={{
                        animation: `fadeInUp 0.4s ease ${idx * 0.05}s both`,
                        "@keyframes fadeInUp": {
                          from: { opacity: 0, transform: "translateY(16px)" },
                          to: { opacity: 1, transform: "translateY(0)" },
                        },
                      }}
                    >
                      <DatasetCard dataset={dataset} />
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
                {data.datasets.length === 0 && (
                  <Box sx={{ textAlign: "center", py: 8 }}>
                    <TuneIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      {t("emptyFiltersTitle")}
                    </Typography>
                    <Typography variant="body2" color="text.disabled">
                      {t("emptyFiltersHint")}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Fade>
          )}
        </Container>
      </Box>
    </MainLayout>
  );
}
