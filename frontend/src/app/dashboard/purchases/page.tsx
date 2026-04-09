"use client";

import {
  Typography, Box, Grid, Card, CardContent, CardActions, Button,
  CircularProgress, Chip
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import { useGetPurchasesQuery } from "@/redux/api/userApi";
import { formatUSDC, formatDate } from "@/utils";

export default function PurchasesPage() {
  const { data, isLoading } = useGetPurchasesQuery();

  if (isLoading) return <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} gutterBottom>My Purchases</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {data?.total || 0} datasets purchased
      </Typography>

      <Grid container spacing={3}>
        {(data?.purchases as Array<{ _id: string; amountPaidUSDC: number; downloadCount: number; createdAt: string; datasetId: { title: string; category: string; format: string } | null; downloadUrl: string | null }> | undefined)?.map((purchase) => (
          <Grid item xs={12} md={6} key={purchase._id}>
            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700}>
                  {purchase.datasetId?.title || "Dataset"}
                </Typography>
                <Box sx={{ display: "flex", gap: 1, mt: 1, mb: 2, flexWrap: "wrap" }}>
                  <Chip label={purchase.datasetId?.category || ""} size="small" color="primary" />
                  <Chip label={purchase.datasetId?.format?.toUpperCase() || ""} size="small" variant="outlined" />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Paid: {formatUSDC(purchase.amountPaidUSDC)} · Downloaded {purchase.downloadCount} times
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Purchased {formatDate(purchase.createdAt)}
                </Typography>
              </CardContent>
              <CardActions>
                {purchase.downloadUrl && (
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    href={purchase.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
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
