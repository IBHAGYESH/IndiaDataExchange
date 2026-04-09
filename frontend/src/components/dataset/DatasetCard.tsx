"use client";

import {
  Card, CardContent, CardActions, Typography, Chip, Box, Button, Stack
} from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import DescriptionIcon from "@mui/icons-material/Description";
import Link from "next/link";
import { Dataset } from "@/types";
import { formatUSDC, truncateAddress, formatBytes } from "@/utils";
import config from "@/config";

interface Props {
  dataset: Dataset;
}

const formatIcons: Record<string, string> = {
  csv: "📊", json: "📋", images: "🖼️", audio: "🎵", video: "🎬", pdf: "📄", other: "📦",
};

const categoryColors: Record<string, "success" | "primary" | "warning" | "error" | "secondary" | "info"> = {
  agriculture: "success", language: "primary", traffic: "warning",
  healthcare: "error", cultural: "secondary", financial: "info", other: "primary",
};

export default function DatasetCard({ dataset }: Props) {
  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 3,
        transition: "all 0.2s",
        "&:hover": { boxShadow: 4, borderColor: "primary.main", transform: "translateY(-2px)" },
      }}
    >
      <CardContent sx={{ flex: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
          <Chip
            label={dataset.category}
            size="small"
            color={categoryColors[dataset.category] || "primary"}
            sx={{ fontWeight: 600 }}
          />
          <Typography variant="h6" color="primary" fontWeight={700}>
            {formatUSDC(dataset.priceUSDC)}
          </Typography>
        </Box>

        <Typography variant="h6" fontWeight={700} sx={{ mb: 1, lineHeight: 1.3 }}>
          {dataset.title}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {dataset.description}
        </Typography>

        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2, gap: 0.5 }}>
          <Chip
            label={`${formatIcons[dataset.format]} ${dataset.format.toUpperCase()}`}
            size="small"
            variant="outlined"
          />
          <Chip label={`${dataset.recordCount.toLocaleString()} records`} size="small" variant="outlined" />
          <Chip label={formatBytes(dataset.sizeBytes)} size="small" variant="outlined" />
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 0.5 }}>
          {dataset.tags.slice(0, 3).map((tag) => (
            <Chip key={tag} label={`#${tag}`} size="small" sx={{ fontSize: "0.7rem", height: 20 }} />
          ))}
        </Stack>

        <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="caption" color="text.secondary">
            By {truncateAddress(dataset.sellerWalletAddress)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {dataset.totalPurchases} purchases
          </Typography>
        </Box>
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0, gap: 1 }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<DescriptionIcon />}
          href={`${config.pinataGateway}/${dataset.sampleIpfsCid}`}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ flex: 1 }}
        >
          Preview
        </Button>
        <Link href={`/marketplace/${dataset._id}`} style={{ flex: 1 }}>
          <Button
            size="small"
            variant="contained"
            startIcon={<ShoppingCartIcon />}
            fullWidth
          >
            Buy {formatUSDC(dataset.priceUSDC)}
          </Button>
        </Link>
      </CardActions>
    </Card>
  );
}
