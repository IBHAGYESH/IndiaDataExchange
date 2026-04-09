"use client";

import { useState } from "react";
import {
  Container, Grid, Typography, Box, TextField, Select, MenuItem,
  FormControl, InputLabel, Pagination, CircularProgress, InputAdornment
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import MainLayout from "@/components/layouts/MainLayout";
import DatasetCard from "@/components/dataset/DatasetCard";
import { useGetDatasetsQuery } from "@/redux/api/datasetApi";

const categories = ["", "agriculture", "language", "traffic", "healthcare", "cultural", "financial", "other"];
const formats = ["", "csv", "json", "images", "audio", "video", "pdf", "other"];

export default function MarketplacePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [format, setFormat] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useGetDatasetsQuery({
    search: search || undefined,
    category: category || undefined,
    format: format || undefined,
    sortBy,
    sortOrder: "desc",
    page,
    limit: 12,
  });

  return (
    <MainLayout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h4" fontWeight={800} gutterBottom>
          🇮🇳 Data Marketplace
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Discover and purchase Indian datasets. AI agents can purchase via x402 payments — no account needed.
        </Typography>

        {/* Filters */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              placeholder="Search datasets..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
              }}
            />
          </Grid>
          <Grid item xs={6} sm={2}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select value={category} label="Category" onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
                {categories.map((c) => (
                  <MenuItem key={c} value={c}>{c || "All Categories"}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={2}>
            <FormControl fullWidth>
              <InputLabel>Format</InputLabel>
              <Select value={format} label="Format" onChange={(e) => { setFormat(e.target.value); setPage(1); }}>
                {formats.map((f) => (
                  <MenuItem key={f} value={f}>{f || "All Formats"}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select value={sortBy} label="Sort By" onChange={(e) => setSortBy(e.target.value)}>
                <MenuItem value="createdAt">Newest</MenuItem>
                <MenuItem value="price">Price</MenuItem>
                <MenuItem value="purchases">Most Popular</MenuItem>
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
            Failed to load datasets. Please try again.
          </Typography>
        )}

        {data && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {data.total} datasets found
            </Typography>
            <Grid container spacing={3}>
              {data.datasets.map((dataset) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={dataset._id}>
                  <DatasetCard dataset={dataset} />
                </Grid>
              ))}
            </Grid>
            {data.totalPages > 1 && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                <Pagination
                  count={data.totalPages}
                  page={page}
                  onChange={(_e, p) => setPage(p)}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}
      </Container>
    </MainLayout>
  );
}
