"use client";

import { useState, useEffect, useRef } from "react";
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
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";

const categories = [
  {
    label: "Agriculture",
    emoji: "\u{1F33E}",
    description: "Crop data, disease images, weather patterns",
  },
  {
    label: "Language",
    emoji: "\u{1F5E3}\u{FE0F}",
    description: "Voice recordings, text corpora, translations",
  },
  {
    label: "Traffic",
    emoji: "\u{1F697}",
    description: "Urban mobility, intersection data, flow patterns",
  },
  {
    label: "Healthcare",
    emoji: "\u{1F3E5}",
    description: "Ayurvedic plants, medical images, records",
  },
  {
    label: "Cultural",
    emoji: "\u{1F3AD}",
    description: "Heritage sites, festivals, artisan data",
  },
  {
    label: "Financial",
    emoji: "\u{1F4B0}",
    description: "Market data, transactions, economic indicators",
  },
];

const stats = [
  { label: "Datasets Listed", value: "500+", icon: "\u{1F4E6}" },
  { label: "USDC Paid Out", value: "$12K+", icon: "\u{1F4B5}" },
  { label: "Active Sellers", value: "200+", icon: "\u{1F465}" },
  { label: "AI Agent Purchases", value: "1K+", icon: "\u{1F916}" },
];

const features = [
  {
    icon: <FlashOnIcon sx={{ fontSize: 32 }} />,
    title: "Instant USDC Payments",
    desc: "Algorand settles in under 3 seconds. Sellers receive USDC directly \u2014 no escrow, no waiting.",
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

const x402Steps = [
  {
    label: "Discovery",
    title: "Agent fetches datasets",
    code: "GET /api/datasets?category=agriculture",
    response: "200 OK \u2014 12 datasets found",
    color: "#4ADE7B",
    icon: "\u{1F50D}",
  },
  {
    label: "Request",
    title: "Agent requests download",
    code: "GET /api/datasets/abc123/download",
    response: "Headers: Accept: application/json",
    color: "#60A5FA",
    icon: "\u{1F4E5}",
  },
  {
    label: "Paywall",
    title: "Server returns 402",
    code: "HTTP 402 Payment Required",
    response: "X-Payment: USDC $2.50 on Algorand",
    color: "#F59E0B",
    icon: "\u{1F512}",
  },
  {
    label: "Payment",
    title: "Agent pays via x402",
    code: "USDC Transfer \u2192 Algorand Testnet",
    response: "Tx confirmed in 3.2s \u2014 Round 45892",
    color: "#FF6B35",
    icon: "\u{1F4B3}",
  },
  {
    label: "Delivery",
    title: "Agent gets the dataset",
    code: "GET /api/datasets/abc123/download",
    response: "200 OK \u2014 dataset.csv (2.4MB)",
    color: "#4ADE7B",
    icon: "\u2705",
  },
];

function useWalletAction(targetPath: string) {
  const { isConnected, connectWallet } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  return async () => {
    if (isConnected) {
      router.push(targetPath);
    } else {
      try {
        await connectWallet();
        showToast("Wallet connected!", "success");
        router.push(targetPath);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to connect";
        if (!msg.includes("cancelled") && !msg.includes("rejected")) {
          showToast(msg, "error");
        }
      }
    }
  };
}

function X402AnimationSequence() {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 },
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;
    setActiveStep(-1);
    const startTimeout = setTimeout(() => {
      let step = 0;
      const interval = setInterval(() => {
        setActiveStep(step);
        step++;
        if (step >= x402Steps.length) {
          clearInterval(interval);
          setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => setIsVisible(true), 600);
          }, 3000);
        }
      }, 1200);
      return () => clearInterval(interval);
    }, 400);
    return () => clearTimeout(startTimeout);
  }, [isVisible]);

  return (
    <Box
      ref={containerRef}
      sx={{
        position: "relative",
        py: 2,
        display: "flex",
        alignItems: "flex-start",
        gap: 0,
        overflowX: "auto",
        "&::-webkit-scrollbar": { display: "none" },
      }}
    >
      {x402Steps.map((step, idx) => {
        const isActive = idx <= activeStep;
        const isCurrent = idx === activeStep;
        return (
          <Box
            key={idx}
            sx={{
              display: "flex",
              alignItems: "flex-start",
              flexShrink: 0,
            }}
          >
            <Box
              sx={{
                width: { xs: 140, sm: 150 },
                minHeight: 160,
                p: 1.5,
                borderRadius: 3,
                border: `1px solid ${
                  isCurrent
                    ? alpha(step.color, 0.4)
                    : isActive
                      ? alpha(step.color, 0.15)
                      : alpha(theme.palette.divider, 0.06)
                }`,
                bgcolor: isCurrent
                  ? alpha(step.color, 0.06)
                  : isActive
                    ? alpha(step.color, 0.02)
                    : "transparent",
                transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                transform: isActive ? "translateY(0)" : "translateY(8px)",
                opacity: isActive ? 1 : 0.35,
                boxShadow: isCurrent
                  ? `0 0 20px ${alpha(step.color, 0.15)}`
                  : "none",
                display: "flex",
                flexDirection: "column",
                gap: 1,
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: isActive
                    ? alpha(step.color, 0.15)
                    : alpha(theme.palette.divider, 0.06),
                  fontSize: "1rem",
                  flexShrink: 0,
                  transition: "all 0.4s ease",
                }}
              >
                {step.icon}
              </Box>
              <Typography
                variant="caption"
                sx={{
                  color: step.color,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontSize: "0.6rem",
                  lineHeight: 1,
                }}
              >
                {step.label}
              </Typography>
              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: "0.72rem",
                  lineHeight: 1.3,
                  color: isActive ? "text.primary" : "text.disabled",
                }}
              >
                {step.title}
              </Typography>
              <Box
                sx={{
                  fontFamily: '"JetBrains Mono", "SF Mono", monospace',
                  fontSize: "0.62rem",
                  lineHeight: 1.6,
                  color: isActive ? step.color : "text.disabled",
                  transition: "color 0.4s ease",
                  wordBreak: "break-all",
                }}
              >
                {step.code}
              </Box>
              <Box
                sx={{
                  fontFamily: '"JetBrains Mono", "SF Mono", monospace',
                  fontSize: "0.58rem",
                  color: isActive ? "text.secondary" : "text.disabled",
                  lineHeight: 1.4,
                  wordBreak: "break-word",
                }}
              >
                {step.response}
              </Box>
            </Box>
            {idx < x402Steps.length - 1 && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 24,
                  alignSelf: "center",
                  flexShrink: 0,
                  position: "relative",
                }}
              >
                <Box
                  sx={{
                    width: "100%",
                    height: 2,
                    bgcolor:
                      idx < activeStep
                        ? alpha(step.color, 0.5)
                        : alpha(theme.palette.divider, 0.1),
                    transition: "all 0.6s ease",
                    position: "relative",
                    "&::after":
                      idx < activeStep
                        ? {
                            content: '""',
                            position: "absolute",
                            top: "50%",
                            right: -2,
                            transform: "translateY(-50%)",
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            bgcolor: x402Steps[idx + 1].color,
                            animation: "flowPulse 1s ease infinite",
                            boxShadow: `0 0 6px ${x402Steps[idx + 1].color}`,
                          }
                        : {},
                  }}
                />
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
}

export default function LandingPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const handleSellData = useWalletAction("/dashboard/list-dataset");
  const handleListDataset = useWalletAction("/dashboard/list-dataset");
  const handleViewBounties = useWalletAction("/bounties");

  return (
    <Box>
      {/* Hero */}
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          pt: { xs: 8, md: 14 },
          pb: { xs: 10, md: 16 },
        }}
      >
        {/* Animated blurred blobs - hero only */}
        <Box
          sx={{
            position: "absolute",
            top: "-10%",
            left: "10%",
            width: { xs: 260, md: 420 },
            height: { xs: 260, md: 420 },
            borderRadius: "50%",
            background: isDark
              ? "radial-gradient(circle, rgba(255,107,53,0.18) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(255,107,53,0.12) 0%, transparent 70%)",
            filter: "blur(80px)",
            animation: "blobDrift1 18s ease-in-out infinite",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            top: "30%",
            right: "5%",
            width: { xs: 200, md: 350 },
            height: { xs: 200, md: 350 },
            borderRadius: "50%",
            background: isDark
              ? "radial-gradient(circle, rgba(46,200,79,0.15) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(19,136,8,0.10) 0%, transparent 70%)",
            filter: "blur(80px)",
            animation: "blobDrift2 22s ease-in-out infinite",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: "-5%",
            left: "40%",
            width: { xs: 180, md: 300 },
            height: { xs: 180, md: 300 },
            borderRadius: "50%",
            background: isDark
              ? "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)",
            filter: "blur(80px)",
            animation: "blobDrift3 20s ease-in-out infinite",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
          <Box sx={{ textAlign: "center", maxWidth: 800, mx: "auto" }}>
            <Typography
              variant="h1"
              sx={{
                fontWeight: 900,
                lineHeight: 1.05,
                mb: 2,
                fontSize: { xs: "2.8rem", sm: "3.8rem", md: "4.5rem" },
                animation: "fadeInUp 0.6s ease both",
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              India Data Exchange
            </Typography>

            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                lineHeight: 1.2,
                mb: 2,
                fontSize: { xs: "1.3rem", sm: "1.6rem", md: "1.8rem" },
                animation: "fadeInUp 0.6s ease 0.1s both",
              }}
            >
              Where Indian Knowledge Becomes{" "}
              <Box
                component="span"
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
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
                maxWidth: 560,
                mx: "auto",
                fontSize: { xs: "1rem", md: "1.15rem" },
                animation: "fadeInUp 0.6s ease 0.2s both",
              }}
            >
              Buy and sell datasets using USDC on Algorand. Instant payments.
              Zero friction. AI agents welcome.
            </Typography>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              justifyContent="center"
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
              <Button
                variant="outlined"
                size="large"
                onClick={handleSellData}
                startIcon={<AccountBalanceWalletIcon />}
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
                Monetize Your Data
              </Button>
            </Stack>
          </Box>

          {/* x402 horizontal flow */}
          <Box
            sx={{
              mt: { xs: 6, md: 8 },
              p: { xs: 2, md: 3 },
              borderRadius: 4,
              bgcolor: alpha(theme.palette.background.paper, 0.6),
              backdropFilter: "blur(20px)",
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              animation: "scaleIn 0.6s ease 0.4s both",
            }}
          >
            <Typography
              variant="overline"
              sx={{
                color: "text.secondary",
                letterSpacing: "0.1em",
                fontSize: "0.65rem",
              }}
            >
              x402 Protocol — AI Agent Purchase Flow
            </Typography>
            <X402AnimationSequence />
            <Typography
              variant="caption"
              sx={{
                color: "text.disabled",
                mt: 1,
                display: "block",
                fontSize: "0.7rem",
              }}
            >
              AI agents pay automatically via x402 protocol — no wallet
              connection required
            </Typography>
          </Box>
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
          <Grid container spacing={4} justifyContent="center">
            {stats.map((stat, idx) => (
              <Grid size={{ xs: 6, sm: 3 }} key={stat.label}>
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
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    fontWeight={500}
                  >
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
          <Grid
            container
            spacing={3}
            justifyContent="center"
            sx={{ maxWidth: 800, mx: "auto" }}
          >
            {features.map((f, idx) => (
              <Grid size={{ xs: 12, sm: 6 }} key={f.title}>
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
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      lineHeight={1.7}
                    >
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
          <Grid container spacing={2.5} justifyContent="center">
            {categories.map((cat, idx) => (
              <Grid size={{ xs: 6, sm: 4, md: 2 }} key={cat.label}>
                <Link
                  href={`/marketplace?category=${cat.label.toLowerCase()}`}
                  style={{ textDecoration: "none" }}
                >
                  <Card
                    elevation={0}
                    sx={{
                      cursor: "pointer",
                      height: "100%",
                      textAlign: "center",
                      animation: `fadeInUp 0.5s ease ${0.08 * idx}s both`,
                    }}
                  >
                    <CardContent
                      sx={{
                        p: { xs: 2, sm: 2.5 },
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <Typography
                        sx={{ fontSize: { xs: "2rem", sm: "2.5rem" } }}
                      >
                        {cat.emoji}
                      </Typography>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {cat.label}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: { xs: "none", sm: "block" },
                          lineHeight: 1.4,
                        }}
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
            <Button
              variant="contained"
              size="large"
              startIcon={<StorageIcon />}
              onClick={handleListDataset}
              sx={{ px: 5 }}
            >
              List a Dataset
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<EmojiEventsIcon />}
              onClick={handleViewBounties}
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
          <Typography variant="body2" color="text.disabled" sx={{ mb: 0.5 }}>
            Built on Algorand · Powered by x402 Protocol
          </Typography>
          <Typography variant="body2" color="text.disabled">
            Crafted with{" "}
            <Box component="span" sx={{ color: "#FF6B35" }}>
              &#10084;&#65039;
            </Box>{" "}
            by{" "}
            <Box
              component="a"
              href="https://ibhagyesh.com/"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: "primary.main",
                textDecoration: "none",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              ibhagyesh
            </Box>
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
