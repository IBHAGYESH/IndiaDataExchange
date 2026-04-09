"use client";

import { useState } from "react";
import {
  Container, Grid, Typography, Box, Select, MenuItem,
  FormControl, InputLabel, Pagination, CircularProgress
} from "@mui/material";
import MainLayout from "@/components/layouts/MainLayout";
import BountyCard from "@/components/bounty/BountyCard";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { useGetBountiesQuery } from "@/redux/api/bountyApi";

export default function BountiesPage() {
  const [status, setStatus] = useState("open");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useGetBountiesQuery({
    status: status || undefined,
    category: category || undefined,
    page,
    limit: 12,
  });

  return (
    <ProtectedRoute>
      <MainLayout>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            🏆 Bounties
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Earn USDC by submitting data that buyers need. Rewards locked in smart contract escrow.
          </Typography>

          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={6} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select value={status} label="Status" onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="open">Open</MenuItem>
                  <MenuItem value="accepted">Accepted</MenuItem>
                  <MenuItem value="expired">Expired</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select value={category} label="Category" onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
                  {["", "agriculture", "language", "traffic", "healthcare", "cultural", "financial", "other"].map((c) => (
                    <MenuItem key={c} value={c}>{c || "All Categories"}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {isLoading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress />
            </Box>
          )}

          {isError && (
            <Typography color="error" textAlign="center" sx={{ py: 4 }}>
              Failed to load bounties.
            </Typography>
          )}

          {data && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {data.total} bounties found
              </Typography>
              <Grid container spacing={3}>
                {data.bounties.map((bounty) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={bounty._id}>
                    <BountyCard bounty={bounty} />
                  </Grid>
                ))}
              </Grid>
              {data.totalPages > 1 && (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                  <Pagination count={data.totalPages} page={page} onChange={(_e, p) => setPage(p)} color="primary" />
                </Box>
              )}
            </>
          )}
        </Container>
      </MainLayout>
    </ProtectedRoute>
  );
}
