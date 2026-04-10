"use client";

import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Stack,
  Divider,
  alpha,
  useTheme,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import StorefrontIcon from "@mui/icons-material/Storefront";
import Link from "next/link";
import { useGetListingsQuery, useUpdateDatasetMutation } from "@/redux/api/userApi";
import { Dataset } from "@/types";
import { formatUSDC, formatBytes, formatDate, truncateAddress } from "@/utils";
import config from "@/config";

function DatasetInfoGrid({ dataset }: { dataset: Dataset }) {
  const items: { label: string; value: string }[] = [
    { label: "Format", value: dataset.format.toUpperCase() },
    { label: "Records", value: dataset.recordCount.toLocaleString() },
    { label: "File size", value: formatBytes(dataset.sizeBytes) },
    { label: "Total purchases", value: String(dataset.totalPurchases) },
    { label: "Listed", value: formatDate(dataset.createdAt) },
    { label: "Last updated", value: formatDate(dataset.updatedAt) },
    { label: "Seller wallet", value: truncateAddress(dataset.sellerWalletAddress) },
  ];

  return (
    <Grid container spacing={2} sx={{ mt: 0 }}>
      {items.map((item) => (
        <Grid item xs={6} sm={4} key={item.label}>
          <Typography variant="caption" color="text.secondary" display="block">
            {item.label}
          </Typography>
          <Typography variant="body2" fontWeight={600}>
            {item.value}
          </Typography>
        </Grid>
      ))}
    </Grid>
  );
}

export default function ListingsPage() {
  const theme = useTheme();
  const { data, isLoading } = useGetListingsQuery();
  const [updateDataset] = useUpdateDatasetMutation();

  const handleToggleStatus = async (dataset: Dataset) => {
    const newStatus = dataset.status === "active" ? "unlisted" : "active";
    await updateDataset({ id: dataset._id, updates: { status: newStatus } });
  };

  const previewSx = {
    fontSize: "0.8rem",
    borderColor: alpha(theme.palette.divider, 0.2),
    "&:hover": { borderColor: "primary.main" },
  };

  if (isLoading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} gutterBottom>
        My Listings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {data?.total || 0} datasets listed
      </Typography>

      <Grid container spacing={3}>
        {(data?.datasets as Dataset[] | undefined)?.map((dataset) => (
          <Grid item xs={12} key={dataset._id}>
            <Card
              elevation={0}
              sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: 1,
                    mb: 1.5,
                  }}
                >
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                    <Chip
                      label={dataset.status}
                      size="small"
                      color={dataset.status === "active" ? "success" : "default"}
                      sx={{ fontWeight: 700 }}
                    />
                    <Chip label={dataset.category} size="small" color="primary" />
                    <Chip label={dataset.format.toUpperCase()} size="small" variant="outlined" />
                  </Stack>
                  <Typography fontWeight={800} color="primary" variant="h6">
                    {formatUSDC(dataset.priceUSDC)}
                  </Typography>
                </Box>

                <Typography variant="h6" fontWeight={700} gutterBottom>
                  {dataset.title}
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, whiteSpace: "pre-wrap" }}>
                  {dataset.description}
                </Typography>

                {dataset.tags?.length > 0 && (
                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                    {dataset.tags.map((tag) => (
                      <Chip key={tag} label={`#${tag}`} size="small" variant="outlined" />
                    ))}
                  </Stack>
                )}

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                  Dataset info
                </Typography>
                <DatasetInfoGrid dataset={dataset} />
              </CardContent>

              <CardActions sx={{ flexWrap: "wrap", gap: 1, px: 2, pb: 2 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<OpenInNewIcon />}
                  href={`${config.pinataGateway}/${dataset.sampleIpfsCid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={previewSx}
                >
                  View sample: {dataset.sampleFileName}
                </Button>
                {dataset.status === "active" && (
                  <Button
                    size="small"
                    variant="outlined"
                    component={Link}
                    href={`/marketplace/${dataset._id}`}
                    startIcon={<StorefrontIcon />}
                    sx={previewSx}
                  >
                    View on marketplace
                  </Button>
                )}
                <Button
                  size="small"
                  variant={dataset.status === "active" ? "outlined" : "contained"}
                  color={dataset.status === "active" ? "warning" : "success"}
                  onClick={() => handleToggleStatus(dataset)}
                >
                  {dataset.status === "active" ? "Unlist" : "Re-list"}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
        {(!data?.datasets || data.datasets.length === 0) && (
          <Grid item xs={12}>
            <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
              No datasets listed yet.{" "}
              <Link href="/dashboard/list-dataset">List your first dataset →</Link>
            </Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
