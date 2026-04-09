"use client";

import {
  Typography, Box, Grid, Card, CardContent, CardActions, Button,
  Chip, CircularProgress, Stack
} from "@mui/material";
import { useGetListingsQuery, useUpdateDatasetMutation } from "@/redux/api/userApi";
import { Dataset } from "@/types";
import { formatUSDC, formatBytes } from "@/utils";

export default function ListingsPage() {
  const { data, isLoading } = useGetListingsQuery();
  const [updateDataset] = useUpdateDatasetMutation();

  const handleToggleStatus = async (dataset: Dataset) => {
    const newStatus = dataset.status === "active" ? "unlisted" : "active";
    await updateDataset({ id: dataset._id, updates: { status: newStatus } });
  };

  if (isLoading) return <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} gutterBottom>My Listings</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {data?.total || 0} datasets listed
      </Typography>

      <Grid container spacing={3}>
        {(data?.datasets as Dataset[] | undefined)?.map((dataset) => (
          <Grid item xs={12} md={6} key={dataset._id}>
            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Chip
                    label={dataset.status}
                    size="small"
                    color={dataset.status === "active" ? "success" : "default"}
                  />
                  <Typography fontWeight={700} color="primary">{formatUSDC(dataset.priceUSDC)}</Typography>
                </Box>
                <Typography variant="h6" fontWeight={700}>{dataset.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                  {dataset.totalPurchases} purchases · {dataset.recordCount.toLocaleString()} records · {formatBytes(dataset.sizeBytes)}
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Chip label={dataset.category} size="small" />
                  <Chip label={dataset.format.toUpperCase()} size="small" variant="outlined" />
                </Stack>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  variant="outlined"
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
              No datasets listed yet. <a href="/list-dataset">List your first dataset →</a>
            </Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
