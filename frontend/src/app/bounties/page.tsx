"use client";

import { Suspense, useCallback } from "react";
import {
  Container,
  GridLegacy as Grid,
  Typography,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  CircularProgress,
  Fade,
  alpha,
  useTheme,
  Button,
  Stack,
  Chip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import MainLayout from "@/components/layouts/MainLayout";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import BountyCard from "@/components/bounty/BountyCard";
import { useGetBountiesQuery } from "@/redux/api/bountyApi";
import { useAuth } from "@/providers/auth-provider";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const categoriesList = [
  { value: "", label: "All Categories" },
  { value: "agriculture", label: "Agriculture" },
  { value: "language", label: "Language" },
  { value: "traffic", label: "Traffic" },
  { value: "healthcare", label: "Healthcare" },
  { value: "cultural", label: "Cultural" },
  { value: "financial", label: "Financial" },
  { value: "other", label: "Other" },
];

export default function BountiesPage() {
  return (
    <Suspense>
      <BountiesContent />
    </Suspense>
  );
}

function BountiesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const { isConnected } = useAuth();

  const status = searchParams.get("status") || "open";
  const category = searchParams.get("category") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);

  const updateUrl = useCallback(
    (params: Record<string, string>) => {
      const current = new URLSearchParams(searchParams.toString());
      Object.entries(params).forEach(([k, v]) => {
        if (v) current.set(k, v);
        else current.delete(k);
      });
      if (!("page" in params)) current.set("page", "1");
      router.push(`${pathname}?${current.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  const { data, isLoading, isError, refetch } = useGetBountiesQuery({
    status: status || undefined,
    category: category || undefined,
    page,
    limit: 12,
  });

  return (
    <ProtectedRoute>
    <MainLayout>
      <Box
        sx={{
          background: `linear-gradient(180deg, ${alpha(theme.palette.secondary.main, 0.04)} 0%, transparent 40%)`,
          minHeight: "100vh",
        }}
      >
        <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2, mb: { xs: 3, md: 4 } }}>
            <Box>
              <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: "-0.02em", mb: 0.5 }}>
                Data Bounties
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Earn USDC by submitting data buyers need. Rewards locked in smart contract escrow.
              </Typography>
            </Box>
            {isConnected && (
              <Link href="/dashboard/post-bounty">
                <Button variant="contained" startIcon={<AddIcon />}>
                  Post Bounty
                </Button>
              </Link>
            )}
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
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={status}
                label="Status"
                onChange={(e) => updateUrl({ status: e.target.value, page: "1" })}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="accepted">Accepted</MenuItem>
                <MenuItem value="expired">Expired</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={category}
                label="Category"
                onChange={(e) => updateUrl({ category: e.target.value, page: "1" })}
              >
                {categoriesList.map((c) => (
                  <MenuItem key={c.value} value={c.value}>
                    {c.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {isLoading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
              <CircularProgress />
            </Box>
          )}

          {isError && (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <Typography color="error" gutterBottom>
                Failed to load bounties.
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ cursor: "pointer", textDecoration: "underline" }}
                onClick={() => refetch()}
              >
                Click to retry
              </Typography>
            </Box>
          )}

          {data && (
            <Fade in timeout={400}>
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {data.total} bount{data.total !== 1 ? "ies" : "y"} found
                </Typography>
                <Grid container spacing={3}>
                  {data.bounties.map((bounty, idx) => (
                    <Grid
                      item
                      xs={12}
                      sm={6}
                      md={4}
                      lg={3}
                      key={bounty._id}
                      sx={{
                        animation: `fadeInUp 0.4s ease ${idx * 0.05}s both`,
                        "@keyframes fadeInUp": {
                          from: { opacity: 0, transform: "translateY(16px)" },
                          to: { opacity: 1, transform: "translateY(0)" },
                        },
                      }}
                    >
                      <BountyCard bounty={bounty} />
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
                {data.bounties.length === 0 && (
                  <Box sx={{ textAlign: "center", py: 8 }}>
                    <EmojiEventsIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      No bounties match your filters
                    </Typography>
                    <Typography variant="body2" color="text.disabled">
                      {isConnected ? "Try posting a new bounty" : "Connect your wallet to post bounties"}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Fade>
          )}
        </Container>
      </Box>
    </MainLayout>
    </ProtectedRoute>
  );
}
