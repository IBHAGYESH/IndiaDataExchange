"use client";

import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Box,
  Button,
  Stack,
  alpha,
  useTheme,
} from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import VisibilityIcon from "@mui/icons-material/Visibility";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import { useRouter } from "next/navigation";
import { Dataset } from "@/types";
import { formatUSDC, truncateAddress, formatBytes } from "@/utils";
import config from "@/config";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";

interface Props {
  dataset: Dataset;
}

const formatIcons: Record<string, string> = {
  csv: "📊",
  json: "📋",
  images: "🖼️",
  audio: "🎵",
  video: "🎬",
  pdf: "📄",
  other: "📦",
};

const categoryGradients: Record<string, string> = {
  agriculture: "linear-gradient(135deg, #10B981, #34D399)",
  language: "linear-gradient(135deg, #3B82F6, #60A5FA)",
  traffic: "linear-gradient(135deg, #F59E0B, #FCD34D)",
  healthcare: "linear-gradient(135deg, #EF4444, #F87171)",
  cultural: "linear-gradient(135deg, #8B5CF6, #A78BFA)",
  financial: "linear-gradient(135deg, #06B6D4, #22D3EE)",
  other: "linear-gradient(135deg, #6B7280, #9CA3AF)",
};

export default function DatasetCard({ dataset }: Props) {
  const { t } = useTranslation("marketplace");
  const { t: tCommon } = useTranslation("common");
  const theme = useTheme();
  const router = useRouter();

  const detailPath = `/marketplace/${dataset._id}`;

  const categoryLabels = t("categoryLabels", { returnObjects: true }) as Record<string, string>;
  const categoryLabel = categoryLabels[dataset.category] ?? dataset.category;

  const reportHref = useMemo(() => {
    const subject = t("reportSubject", { id: dataset._id });
    const body = t("reportBody", { title: dataset.title, id: dataset._id });
    return `mailto:${config.reportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, [dataset._id, dataset.title, t]);

  return (
    <Card
      elevation={0}
      onClick={() => router.push(detailPath)}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "visible",
        cursor: "pointer",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.12)}`,
        },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: -1,
          left: 16,
          right: 16,
          height: 3,
          borderRadius: "0 0 4px 4px",
          background: categoryGradients[dataset.category] || categoryGradients.other,
          opacity: 0,
          transition: "opacity 0.3s ease",
          ".MuiCard-root:hover &": { opacity: 1 },
        }}
      />

      <CardContent sx={{ flex: 1, p: { xs: 2, sm: 2.5 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
          <Chip
            label={categoryLabel}
            size="small"
            sx={{
              fontWeight: 600,
              fontSize: "0.7rem",
              background: categoryGradients[dataset.category] || categoryGradients.other,
              color: "white",
              border: "none",
            }}
          />
          <Typography
            variant="h6"
            fontWeight={800}
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontSize: "1.1rem",
            }}
          >
            {formatUSDC(dataset.priceUSDC)}
          </Typography>
        </Box>

        <Typography
          variant="subtitle1"
          fontWeight={700}
          sx={{
            mb: 1,
            lineHeight: 1.3,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {dataset.title}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            lineHeight: 1.6,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {dataset.description}
        </Typography>

        <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ mb: 1.5, gap: 0.5 }}>
          <Chip
            label={`${formatIcons[dataset.format] || "📦"} ${dataset.format.toUpperCase()}`}
            size="small"
            variant="outlined"
            sx={{ fontSize: "0.7rem", height: 24 }}
          />
          <Chip
            label={t("rowsCount", { count: dataset.recordCount })}
            size="small"
            variant="outlined"
            sx={{ fontSize: "0.7rem", height: 24 }}
          />
          <Chip
            label={formatBytes(dataset.sizeBytes)}
            size="small"
            variant="outlined"
            sx={{ fontSize: "0.7rem", height: 24 }}
          />
        </Stack>

        {dataset.tags.length > 0 && (
          <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
            {dataset.tags.slice(0, 3).map((tag) => (
              <Chip
                key={tag}
                label={`#${tag}`}
                size="small"
                sx={{
                  fontSize: "0.65rem",
                  height: 20,
                  bgcolor: alpha(theme.palette.primary.main, 0.06),
                  color: "text.secondary",
                }}
              />
            ))}
          </Stack>
        )}

        <Box
          sx={{
            mt: 2,
            pt: 1.5,
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="caption" color="text.disabled">
            {truncateAddress(dataset.sellerWalletAddress)}
          </Typography>
          <Typography variant="caption" color="text.disabled">
            {t("sales", { count: dataset.totalPurchases })}
          </Typography>
        </Box>
      </CardContent>

      <CardActions
        sx={{ p: 2, pt: 0, gap: 1, flexWrap: "wrap" }}
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          size="small"
          variant="outlined"
          startIcon={<VisibilityIcon />}
          href={dataset.sampleIpfsCid ? `${config.pinataGateway}/${dataset.sampleIpfsCid}` : "#"}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            flex: "1 1 100px",
            fontSize: "0.8rem",
            borderColor: alpha(theme.palette.divider, 0.2),
            "&:hover": { borderColor: "primary.main" },
          }}
        >
          {t("preview")}
        </Button>
        <Button
          size="small"
          variant="contained"
          startIcon={<ShoppingCartIcon />}
          onClick={() => router.push(`${detailPath}?purchase=true`)}
          sx={{ flex: "1 1 100px", fontSize: "0.8rem" }}
        >
          {t("buy")}
        </Button>
        <Button
          size="small"
          variant="text"
          startIcon={<FlagOutlinedIcon />}
          href={reportHref}
          component="a"
          sx={{ flex: "1 1 100%", fontSize: "0.75rem" }}
        >
          {tCommon("reportDataset")}
        </Button>
      </CardActions>
    </Card>
  );
}
