"use client";

import {
  Box, Container, Typography, Button, Grid, Card, CardContent,
  Chip, Stack, Paper
} from "@mui/material";
import StorageIcon from "@mui/icons-material/Storage";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import Link from "next/link";

const categories = [
  { label: "Agriculture", emoji: "🌾", description: "Crop data, disease images, weather patterns" },
  { label: "Language", emoji: "🗣️", description: "Voice recordings, text corpora, translations" },
  { label: "Traffic", emoji: "🚗", description: "Urban mobility, intersection data, flow patterns" },
  { label: "Healthcare", emoji: "🏥", description: "Ayurvedic plants, medical images, records" },
  { label: "Cultural", emoji: "🎭", description: "Heritage sites, festivals, artisan data" },
  { label: "Financial", emoji: "💰", description: "Market data, transactions, economic indicators" },
];

const stats = [
  { label: "Datasets Listed", value: "500+", icon: "📦" },
  { label: "USDC Paid Out", value: "$12K+", icon: "💵" },
  { label: "Active Sellers", value: "200+", icon: "👥" },
  { label: "AI Agent Purchases", value: "1K+", icon: "🤖" },
];

export default function LandingPage() {
  return (
    <Box>
      {/* Hero */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #FF6B35 0%, #138808 100%)",
          color: "white",
          py: { xs: 8, md: 12 },
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Chip
                label="🏆 AlgoBharat Hack Series 3.0 — Agentic Commerce Track"
                sx={{ mb: 2, bgcolor: "rgba(255,255,255,0.2)", color: "white", fontWeight: 600 }}
              />
              <Typography variant="h2" fontWeight={900} gutterBottom sx={{ lineHeight: 1.1 }}>
                Where Indian Knowledge Becomes AI Fuel
              </Typography>
              <Typography variant="h5" sx={{ opacity: 0.9, mb: 4, fontWeight: 400 }}>
                Buy and sell Indian datasets using USDC on Algorand. Instant payments. Zero friction.
                AI agents welcome.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Link href="/marketplace">
                  <Button
                    variant="contained"
                    size="large"
                    sx={{
                      bgcolor: "white",
                      color: "#FF6B35",
                      fontWeight: 700,
                      px: 4,
                      "&:hover": { bgcolor: "rgba(255,255,255,0.9)" },
                    }}
                  >
                    Browse Marketplace
                  </Button>
                </Link>
                <Link href="/list-dataset">
                  <Button
                    variant="outlined"
                    size="large"
                    sx={{
                      color: "white",
                      borderColor: "white",
                      fontWeight: 700,
                      px: 4,
                      "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
                    }}
                  >
                    Sell Your Data
                  </Button>
                </Link>
              </Stack>
            </Grid>
            <Grid item xs={12} md={5}>
              <Paper elevation={8} sx={{ p: 3, borderRadius: 3, bgcolor: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)" }}>
                <Typography variant="overline" sx={{ color: "rgba(255,255,255,0.7)" }}>
                  ⚡ Live Transaction
                </Typography>
                <Box sx={{ mt: 1, p: 2, bgcolor: "rgba(0,0,0,0.2)", borderRadius: 2, fontFamily: "monospace" }}>
                  <Typography variant="caption" sx={{ color: "#90EE90", display: "block" }}>
                    GET /api/datasets/abc123/download
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#87CEEB", display: "block", mt: 0.5 }}>
                    HTTP 402 Payment Required
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#FFD700", display: "block", mt: 0.5 }}>
                    → USDC $2.50 → ALGO Testnet
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#90EE90", display: "block", mt: 0.5 }}>
                    HTTP 200 ✓ Download ready
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", mt: 1, display: "block" }}>
                  AI agents pay automatically via x402 protocol
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Stats */}
      <Box sx={{ bgcolor: "background.paper", py: 4 }}>
        <Container maxWidth="lg">
          <Grid container spacing={3}>
            {stats.map((stat) => (
              <Grid item xs={6} md={3} key={stat.label}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="h3">{stat.emoji}</Typography>
                  <Typography variant="h4" fontWeight={800} color="primary">
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stat.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Features */}
      <Box sx={{ py: 8, bgcolor: "background.default" }}>
        <Container maxWidth="lg">
          <Typography variant="h4" fontWeight={800} textAlign="center" gutterBottom>
            Why India Data Exchange?
          </Typography>
          <Typography variant="body1" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
            Built on Algorand for speed, finality, and near-zero fees
          </Typography>
          <Grid container spacing={4}>
            {[
              {
                icon: <FlashOnIcon sx={{ fontSize: 40, color: "primary.main" }} />,
                title: "Instant USDC Payments",
                desc: "Algorand settles in under 3 seconds. Sellers receive USDC directly — no escrow, no waiting.",
              },
              {
                icon: <SmartToyIcon sx={{ fontSize: 40, color: "secondary.main" }} />,
                title: "AI Agent Native",
                desc: "AI agents browse and purchase datasets autonomously via x402 HTTP payments. No account needed.",
              },
              {
                icon: <EmojiEventsIcon sx={{ fontSize: 40, color: "#FFB800" }} />,
                title: "Bounty System",
                desc: "Post bounties with USDC locked in smart contract escrow. Released only on acceptance.",
              },
              {
                icon: <AccountBalanceWalletIcon sx={{ fontSize: 40, color: "#8B5CF6" }} />,
                title: "Pera Wallet Auth",
                desc: "Sign in with your Algorand wallet. No emails, no passwords. Your key is your identity.",
              },
            ].map((f) => (
              <Grid item xs={12} sm={6} md={3} key={f.title}>
                <Card elevation={0} sx={{ height: "100%", border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
                  <CardContent>
                    <Box sx={{ mb: 2 }}>{f.icon}</Box>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      {f.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {f.desc}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Data Categories */}
      <Box sx={{ py: 8, bgcolor: "background.paper" }}>
        <Container maxWidth="lg">
          <Typography variant="h4" fontWeight={800} textAlign="center" gutterBottom>
            Data Categories
          </Typography>
          <Grid container spacing={3} sx={{ mt: 2 }}>
            {categories.map((cat) => (
              <Grid item xs={12} sm={6} md={4} key={cat.label}>
                <Link href={`/marketplace?category=${cat.label.toLowerCase()}`} style={{ textDecoration: "none" }}>
                  <Card
                    elevation={0}
                    sx={{
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 3,
                      p: 3,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      "&:hover": { transform: "translateY(-4px)", boxShadow: 4, borderColor: "primary.main" },
                    }}
                  >
                    <Typography variant="h3" gutterBottom>{cat.emoji}</Typography>
                    <Typography variant="h6" fontWeight={700}>{cat.label}</Typography>
                    <Typography variant="body2" color="text.secondary">{cat.description}</Typography>
                  </Card>
                </Link>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA */}
      <Box sx={{ py: 8, background: "linear-gradient(135deg, #1a1a2e, #16213e)", color: "white", textAlign: "center" }}>
        <Container maxWidth="md">
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Ready to monetize your data?
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.8, mb: 4 }}>
            Connect your Pera Wallet and start earning USDC from your Indian datasets today.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
            <Link href="/list-dataset">
              <Button variant="contained" size="large" color="primary" sx={{ px: 5, fontWeight: 700 }}>
                <StorageIcon sx={{ mr: 1 }} /> List a Dataset
              </Button>
            </Link>
            <Link href="/bounties">
              <Button variant="outlined" size="large" sx={{ color: "white", borderColor: "white", px: 5, fontWeight: 700 }}>
                <EmojiEventsIcon sx={{ mr: 1 }} /> View Bounties
              </Button>
            </Link>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
