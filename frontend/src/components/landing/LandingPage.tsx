"use client";

import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Stack,
  alpha,
  useTheme,
} from "@mui/material";
import StorageIcon from "@mui/icons-material/Storage";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import SecurityIcon from "@mui/icons-material/Security";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
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

const features = [
  {
    icon: <FlashOnIcon sx={{ fontSize: 32 }} />,
    title: "Instant USDC Payments",
    desc: "Algorand settles in under 3 seconds. Sellers receive USDC directly — no escrow, no waiting.",
    gradient: "linear-gradient(135deg, #FF6B35, #FF8C5A)",
  },
  {
    icon: <SmartToyIcon sx={{ fontSize: 32 }} />,
    title: "AI Agent Native",
    desc: "AI agents browse and purchase datasets autonomously via x402 HTTP payments. No account needed.",
    gradient: "linear-gradient(135deg, #2EC84F, #4ADE7B)",
  },
  {
    icon: <EmojiEventsIcon sx={{ fontSize: 32 }} />,
    title: "Bounty System",
    desc: "Post bounties with USDC locked in smart contract escrow. Released only on acceptance.",
    gradient: "linear-gradient(135deg, #F59E0B, #FCD34D)",
  },
  {
    icon: <SecurityIcon sx={{ fontSize: 32 }} />,
    title: "Non-Custodial",
    desc: "Your keys, your data. Sign in with Algorand wallet. No emails, no passwords.",
    gradient: "linear-gradient(135deg, #8B5CF6, #A78BFA)",
  },
];

export default function LandingPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box>
      {/* Hero */}
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          pt: { xs: 8, md: 14 },
          pb: { xs: 10, md: 16 },
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: isDark
              ? "radial-gradient(ellipse at 20% 50%, rgba(255,107,53,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(46,200,79,0.06) 0%, transparent 50%)"
              : "radial-gradient(ellipse at 20% 50%, rgba(255,107,53,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(19,136,8,0.04) 0%, transparent 50%)",
            zIndex: 0,
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={7}>
              <Box
                sx={{
                  display: "inline-block",
                  px: 2,
                  py: 0.75,
                  mb: 3,
                  borderRadius: 100,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  animation: "fadeInDown 0.6s ease both",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, color: "primary.main", letterSpacing: "0.05em" }}
                >
                  ALGOBHARAT HACK SERIES 3.0 — AGENTIC COMMERCE
                </Typography>
              </Box>

              <Typography
                variant="h2"
                sx={{
                  fontWeight: 900,
                  lineHeight: 1.05,
                  mb: 3,
                  fontSize: { xs: "2.2rem", sm: "3rem", md: "3.5rem" },
                  animation: "fadeInUp 0.6s ease 0.1s both",
                }}
              >
                Where Indian Knowledge
                <br />
                Becomes{" "}
                <Box
                  component="span"
                  sx={{
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  AI Fuel
                </Box>
              </Typography>

              <Typography
                variant="h6"
                color="text.secondary"
                sx={{
                  mb: 5,
                  fontWeight: 400,
                  lineHeight: 1.6,
                  maxWidth: 520,
                  fontSize: { xs: "1rem", md: "1.15rem" },
                  animation: "fadeInUp 0.6s ease 0.2s both",
                }}
              >
                Buy and sell Indian datasets using USDC on Algorand. Instant
                payments. Zero friction. AI agents welcome.
              </Typography>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                sx={{ animation: "fadeInUp 0.6s ease 0.3s both" }}
              >
                <Link href="/marketplace">
                  <Button
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForwardIcon />}
                    sx={{ px: 4, py: 1.5 }}
                  >
                    Browse Marketplace
                  </Button>
                </Link>
                <Link href="/list-dataset">
                  <Button
                    variant="outlined"
                    size="large"
                    sx={{
                      px: 4,
                      py: 1.5,
                      borderColor: alpha(theme.palette.text.primary, 0.2),
                      color: "text.primary",
                      "&:hover": {
                        borderColor: "primary.main",
                        bgcolor: alpha(theme.palette.primary.main, 0.04),
                      },
                    }}
                  >
                    Sell Your Data
                  </Button>
                </Link>
              </Stack>
            </Grid>

            <Grid item xs={12} md={5}>
              <Box
                sx={{
                  p: 3,
                  borderRadius: 4,
                  bgcolor: alpha(theme.palette.background.paper, 0.6),
                  backdropFilter: "blur(20px)",
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  animation: "scaleIn 0.6s ease 0.4s both",
                }}
              >
                <Typography
                  variant="overline"
                  sx={{ color: "text.secondary", letterSpacing: "0.1em" }}
                >
                  x402 Live Transaction
                </Typography>
                <Box
                  sx={{
                    mt: 1.5,
                    p: 2.5,
                    bgcolor: isDark ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.03)",
                    borderRadius: 3,
                    fontFamily: '"JetBrains Mono", "SF Mono", monospace',
                    fontSize: "0.8rem",
                    lineHeight: 2,
                  }}
                >
                  <Box sx={{ color: "#4ADE7B" }}>
                    GET /api/datasets/abc123/download
                  </Box>
                  <Box sx={{ color: "#F59E0B" }}>HTTP 402 Payment Required</Box>
                  <Box sx={{ color: "#FF6B35" }}>
                    → USDC $2.50 → Algorand Testnet
                  </Box>
                  <Box sx={{ color: "#4ADE7B" }}>HTTP 200 ✓ Download ready</Box>
                </Box>
                <Typography
                  variant="caption"
                  sx={{ color: "text.disabled", mt: 1.5, display: "block" }}
                >
                  AI agents pay automatically via x402 protocol — no wallet
                  connection required
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Stats */}
      <Box
        sx={{
          py: { xs: 5, md: 6 },
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {stats.map((stat, idx) => (
              <Grid item xs={6} md={3} key={stat.label}>
                <Box
                  sx={{
                    textAlign: "center",
                    animation: `fadeInUp 0.5s ease ${0.1 * idx}s both`,
                  }}
                >
                  <Typography sx={{ fontSize: "2rem", mb: 0.5 }}>
                    {stat.icon}
                  </Typography>
                  <Typography
                    variant="h4"
                    fontWeight={800}
                    sx={{
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    {stat.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Features */}
      <Box sx={{ py: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", mb: { xs: 5, md: 8 } }}>
            <Typography variant="h3" fontWeight={800} gutterBottom>
              Why India Data Exchange?
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ maxWidth: 500, mx: "auto" }}
            >
              Built on Algorand for speed, finality, and near-zero fees
            </Typography>
          </Box>
          <Grid container spacing={3}>
            {features.map((f, idx) => (
              <Grid item xs={12} sm={6} md={3} key={f.title}>
                <Card
                  elevation={0}
                  sx={{
                    height: "100%",
                    p: 0.5,
                    animation: `fadeInUp 0.5s ease ${0.1 * idx}s both`,
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box
                      sx={{
                        width: 52,
                        height: 52,
                        borderRadius: 3,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mb: 2.5,
                        background: f.gradient,
                        color: "white",
                      }}
                    >
                      {f.icon}
                    </Box>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      {f.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" lineHeight={1.7}>
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
      <Box
        sx={{
          py: { xs: 8, md: 12 },
          bgcolor: alpha(theme.palette.background.paper, 0.5),
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", mb: { xs: 5, md: 8 } }}>
            <Typography variant="h3" fontWeight={800} gutterBottom>
              Data Categories
            </Typography>
            <Typography variant="body1" color="text.secondary">
              India-specific datasets across critical sectors
            </Typography>
          </Box>
          <Grid container spacing={3}>
            {categories.map((cat, idx) => (
              <Grid item xs={6} sm={4} md={4} key={cat.label}>
                <Link
                  href={`/marketplace?category=${cat.label.toLowerCase()}`}
                  style={{ textDecoration: "none" }}
                >
                  <Card
                    elevation={0}
                    sx={{
                      cursor: "pointer",
                      animation: `fadeInUp 0.5s ease ${0.08 * idx}s both`,
                    }}
                  >
                    <CardContent
                      sx={{
                        p: { xs: 2, sm: 3 },
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                      }}
                    >
                      <Typography sx={{ fontSize: { xs: "2rem", sm: "2.5rem" } }}>
                        {cat.emoji}
                      </Typography>
                      <Typography variant="h6" fontWeight={700}>
                        {cat.label}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ display: { xs: "none", sm: "block" } }}
                      >
                        {cat.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Link>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA */}
      <Box
        sx={{
          py: { xs: 8, md: 12 },
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "radial-gradient(ellipse at 50% 50%, rgba(255,107,53,0.06) 0%, transparent 70%)",
          },
        }}
      >
        <Container maxWidth="md" sx={{ position: "relative" }}>
          <Typography
            variant="h3"
            fontWeight={800}
            gutterBottom
            sx={{ animation: "fadeInUp 0.5s ease both" }}
          >
            Ready to monetize
            <br />
            your data?
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 5, maxWidth: 480, mx: "auto" }}
          >
            Connect your Pera Wallet and start earning USDC from your Indian
            datasets today.
          </Typography>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            justifyContent="center"
          >
            <Link href="/list-dataset">
              <Button
                variant="contained"
                size="large"
                startIcon={<StorageIcon />}
                sx={{ px: 5 }}
              >
                List a Dataset
              </Button>
            </Link>
            <Link href="/bounties">
              <Button
                variant="outlined"
                size="large"
                startIcon={<EmojiEventsIcon />}
                sx={{
                  px: 5,
                  borderColor: alpha(theme.palette.text.primary, 0.2),
                  color: "text.primary",
                  "&:hover": {
                    borderColor: "primary.main",
                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                  },
                }}
              >
                View Bounties
              </Button>
            </Link>
          </Stack>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          py: 4,
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
          textAlign: "center",
        }}
      >
        <Container>
          <Typography variant="body2" color="text.disabled">
            Built on Algorand · Powered by x402 Protocol · AlgoBharat Hack
            Series 3.0
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
