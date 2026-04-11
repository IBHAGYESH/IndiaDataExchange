"use client";

import {
  Typography,
  Box,
  GridLegacy as Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Chip,
  Stack,
  Divider,
  alpha,
  useTheme,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import StorefrontIcon from "@mui/icons-material/Storefront";
import Link from "next/link";
import { useGetPurchasesQuery } from "@/redux/api/userApi";
import { Purchase, PurchasedDataset } from "@/types";
import { formatUSDC, formatDate, formatBytes, truncateAddress } from "@/utils";
import config from "@/config";

function PurchaseInfoGrid({
  dataset,
  purchase,
}: {
  dataset: PurchasedDataset;
  purchase: Purchase;
}) {
  const items: { label: string; value: string }[] = [
    { label: "Format", value: dataset.format.toUpperCase() },
    { label: "Records", value: dataset.recordCount.toLocaleString() },
    { label: "File size", value: formatBytes(dataset.sizeBytes) },
    { label: "List price (now)", value: formatUSDC(dataset.priceUSDC) },
    { label: "You paid", value: formatUSDC(purchase.amountPaidUSDC) },
    { label: "Downloads", value: String(purchase.downloadCount) },
    { label: "Purchased", value: formatDate(purchase.createdAt) },
    ...(purchase.lastDownloadAt
      ? [{ label: "Last download", value: formatDate(purchase.lastDownloadAt) } as const]
      : []),
    { label: "Seller", value: truncateAddress(dataset.sellerWalletAddress) },
    { label: "Listing status", value: dataset.status },
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

export default function PurchasesPage() {
  const theme = useTheme();
  const { data, isLoading } = useGetPurchasesQuery();

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
        My Purchases
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {data?.total || 0} datasets purchased
      </Typography>

      <Grid container spacing={3}>
        {(data?.purchases as Purchase[] | undefined)?.map((purchase) => {
          const ds = purchase.datasetId;
          return (
            <Grid item xs={12} key={purchase._id}>
              <Card
                elevation={0}
                sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}
              >
                <CardContent>
                  {!ds ? (
                    <Typography color="text.secondary">
                      This dataset is no longer available or was removed.
                    </Typography>
                  ) : (
                    <>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
                        <Chip label={ds.category} size="small" color="primary" />
                        <Chip label={ds.format.toUpperCase()} size="small" variant="outlined" />
                      </Stack>

                      <Typography variant="h6" fontWeight={700} gutterBottom>
                        {ds.title}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2, whiteSpace: "pre-wrap" }}
                      >
                        {ds.description}
                      </Typography>

                      {ds.tags?.length > 0 && (
                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                          {ds.tags.map((tag) => (
                            <Chip key={tag} label={`#${tag}`} size="small" variant="outlined" />
                          ))}
                        </Stack>
                      )}

                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                        Payment:{" "}
                        <a
                          href={`${config.algoExplorerTxUrl}/${purchase.paymentTxId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View transaction on Algo Explorer ↗
                        </a>
                      </Typography>

                      <Divider sx={{ my: 2 }} />

                      <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                        Purchase &amp; dataset details
                      </Typography>
                      <PurchaseInfoGrid dataset={ds} purchase={purchase} />
                    </>
                  )}
                </CardContent>

                {ds && (
                  <CardActions sx={{ flexWrap: "wrap", gap: 1, px: 2, pb: 2 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<OpenInNewIcon />}
                      href={`${config.pinataGateway}/${ds.sampleIpfsCid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={previewSx}
                    >
                      View sample: {ds.sampleFileName}
                    </Button>
                    {purchase.downloadUrl && (
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        href={purchase.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Download full file
                      </Button>
                    )}
                    <Button
                      size="small"
                      variant="outlined"
                      component={Link}
                      href={`/marketplace/${ds._id}`}
                      startIcon={<StorefrontIcon />}
                      sx={previewSx}
                    >
                      Marketplace page
                    </Button>
                  </CardActions>
                )}
              </Card>
            </Grid>
          );
        })}
        {(!data?.purchases || data.purchases.length === 0) && (
          <Grid item xs={12}>
            <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
              No purchases yet. <a href="/marketplace">Browse the marketplace →</a>
            </Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
