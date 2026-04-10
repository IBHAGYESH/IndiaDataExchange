"use client";

import { use } from "react";
import {
  Container,
  Grid,
  Typography,
  Box,
  Chip,
  Stack,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Link as MuiLink,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import MainLayout from "@/components/layouts/MainLayout";
import DatasetPurchaseButton from "@/components/dataset/DatasetPurchaseButton";
import { useGetDatasetQuery } from "@/redux/api/datasetApi";
import { formatUSDC, truncateAddress, formatBytes, formatDate } from "@/utils";
import config from "@/config";

export default function DatasetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, isLoading, isError } = useGetDatasetQuery(id);

  if (isLoading) {
    return (
      <MainLayout>
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  if (isError || !data?.dataset) {
    return (
      <MainLayout>
        <Container maxWidth="lg" sx={{ py: 8, textAlign: "center" }}>
          <Typography variant="h5">Dataset not found</Typography>
        </Container>
      </MainLayout>
    );
  }

  const { dataset } = data;

  return (
    <MainLayout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={4}>
          {/* Main Content */}
          <Grid item xs={12} md={8}>
            <Box sx={{ mb: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Chip label={dataset.category} color="primary" />
              <Chip
                label={`Format: ${dataset.format.toUpperCase()}`}
                variant="outlined"
              />
              <Chip
                label={`${dataset.recordCount.toLocaleString()} records`}
                variant="outlined"
              />
            </Box>

            <Typography variant="h4" fontWeight={800} gutterBottom>
              {dataset.title}
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {dataset.description}
            </Typography>

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
              {dataset.tags.map((tag) => (
                <Chip
                  key={tag}
                  label={`#${tag}`}
                  size="small"
                  sx={{ bgcolor: "background.paper" }}
                />
              ))}
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" fontWeight={700} gutterBottom>
              Dataset Info
            </Typography>
            <Grid container spacing={2}>
              {[
                { label: "Format", value: dataset.format.toUpperCase() },
                {
                  label: "Records",
                  value: dataset.recordCount.toLocaleString(),
                },
                { label: "File Size", value: formatBytes(dataset.sizeBytes) },
                {
                  label: "Total Purchases",
                  value: dataset.totalPurchases.toString(),
                },
                { label: "Listed On", value: formatDate(dataset.createdAt) },
                {
                  label: "Seller",
                  value: truncateAddress(dataset.sellerWalletAddress),
                },
              ].map((item) => (
                <Grid item xs={6} sm={4} key={item.label}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {item.label}
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {item.value}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" fontWeight={700} gutterBottom>
              Sample Preview
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Preview the sample data before purchasing. The full dataset is
              larger and higher quality.
            </Typography>
            <Button
              variant="outlined"
              startIcon={<OpenInNewIcon />}
              href={`${config.pinataGateway}/${dataset.sampleIpfsCid}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View Sample: {dataset.sampleFileName}
            </Button>
          </Grid>

          {/* Purchase Card */}
          <Grid item xs={12} md={4}>
            <Card
              elevation={0}
              sx={{
                border: "1px solid",
                borderColor: "primary.main",
                borderRadius: 3,
                position: "sticky",
                top: 80,
              }}
            >
              <CardContent>
                <Typography
                  variant="h4"
                  color="primary"
                  fontWeight={800}
                  gutterBottom
                >
                  {formatUSDC(dataset.priceUSDC)}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  One-time purchase. Re-download anytime from your dashboard.
                </Typography>

                <DatasetPurchaseButton
                  datasetId={dataset._id}
                  priceUSDC={dataset.priceUSDC}
                  sellerWalletAddress={dataset.sellerWalletAddress}
                />

                <Divider sx={{ my: 2 }} />

                <Typography variant="caption" color="text.secondary">
                  Payment goes directly to seller&apos;s wallet. No platform
                  fees. Powered by Algorand + x402.
                </Typography>

                <Box sx={{ mt: 2 }}>
                  <MuiLink
                    href={`https://lora.algokit.io/testnet/account/${dataset.sellerWalletAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="caption"
                    display="block"
                  >
                    View seller on Algo Explorer ↗
                  </MuiLink>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </MainLayout>
  );
}
