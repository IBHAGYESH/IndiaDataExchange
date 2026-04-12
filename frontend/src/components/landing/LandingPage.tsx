"use client";

import { Fragment, useState, useEffect, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
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

type X402StepRow = {
  label: string;
  title: string;
  code: string;
  response: string;
  color: string;
  icon: string;
};

function useWalletAction(targetPath: string) {
  const { isConnected, connectWallet } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const { t } = useTranslation("auth");

  return async () => {
    if (isConnected) {
      router.push(targetPath);
    } else {
      try {
        await connectWallet();
        showToast(t("walletConnectedShort"), "success");
        router.push(targetPath);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to connect";
        if (
          !msg.includes("cancelled") &&
          !msg.includes("rejected") &&
          !msg.includes("Consent declined")
        ) {
          showToast(msg, "error");
        }
      }
    }
  };
}

function X402AnimationSequence({ steps }: { steps: X402StepRow[] }) {
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
    if (!isVisible || steps.length === 0) return;
    setActiveStep(-1);
    let intervalId: ReturnType<typeof setInterval> | undefined;
    const startTimeout = setTimeout(() => {
      let step = 0;
      intervalId = setInterval(() => {
        setActiveStep(step);
        step++;
        if (step >= steps.length) {
          if (intervalId) clearInterval(intervalId);
          intervalId = undefined;
          setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => setIsVisible(true), 600);
          }, 3000);
        }
      }, 1200);
    }, 400);
    return () => {
      clearTimeout(startTimeout);
      if (intervalId) clearInterval(intervalId);
    };
  }, [isVisible, steps.length]);

  return (
    <Box
      ref={containerRef}
      sx={{
        position: "relative",
        py: 2,
        display: "flex",
        alignItems: "stretch",
        flexDirection: { xs: "column", sm: "row" },
        width: "100%",
        gap: { xs: 0, sm: 0 },
        overflowX: "hidden",
      }}
    >
      {steps.map((step, idx) => {
        const isActive = idx <= activeStep;
        const isCurrent = idx === activeStep;
        return (
          <Fragment key={idx}>
            <Box
              sx={{
                flex: { xs: "0 0 auto", sm: "1 1 0" },
                width: { xs: "100%", sm: "auto" },
                minWidth: { xs: 0, sm: 0 },
                maxWidth: { xs: "100%", sm: "100%" },
                display: "flex",
                alignItems: "stretch",
              }}
            >
              <Box
                sx={{
                  width: "100%",
                  minWidth: 0,
                  minHeight: 160,
                  p: { xs: 1.25, sm: 1.5 },
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
            </Box>
            {idx < steps.length - 1 && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: { xs: "0 0 auto", sm: "0 0 14px" },
                  alignSelf: "center",
                  position: "relative",
                  py: { xs: 0.5, sm: 0 },
                }}
              >
                {/* Mobile: vertical link between stacked cards */}
                <Box
                  sx={{
                    display: { xs: "block", sm: "none" },
                    width: 2,
                    height: 18,
                    borderRadius: 1,
                    bgcolor:
                      idx < activeStep
                        ? alpha(step.color, 0.45)
                        : alpha(theme.palette.divider, 0.12),
                    transition: "all 0.6s ease",
                    position: "relative",
                    "&::after":
                      idx < activeStep
                        ? {
                            content: '""',
                            position: "absolute",
                            bottom: -3,
                            left: "50%",
                            transform: "translateX(-50%)",
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            bgcolor: steps[idx + 1].color,
                            animation: "flowPulse 1s ease infinite",
                            boxShadow: `0 0 6px ${steps[idx + 1].color}`,
                          }
                        : {},
                  }}
                />
                {/* Desktop: horizontal link */}
                <Box
                  sx={{
                    display: { xs: "none", sm: "block" },
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
                            bgcolor: steps[idx + 1].color,
                            animation: "flowPulse 1s ease infinite",
                            boxShadow: `0 0 6px ${steps[idx + 1].color}`,
                          }
                        : {},
                  }}
                />
              </Box>
            )}
          </Fragment>
        );
      })}
    </Box>
  );
}

export default function LandingPage() {
  const { t } = useTranslation("landing");
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const categories = useMemo(() => {
    const raw = t("categories", { returnObjects: true }) as Array<{
      key: string;
      label: string;
      emoji: string;
      description: string;
    }>;
    return Array.isArray(raw) ? raw : [];
  }, [t]);

  const stats = useMemo(() => {
    const raw = t("stats", { returnObjects: true }) as Array<{
      label: string;
      value: string;
      icon: string;
    }>;
    return Array.isArray(raw) ? raw : [];
  }, [t]);

  const features = useMemo(() => {
    const raw = t("features", { returnObjects: true }) as Array<{ title: string; desc: string }>;
    const icons = [
      <FlashOnIcon key="f1" sx={{ fontSize: 32 }} />,
      <SmartToyIcon key="f2" sx={{ fontSize: 32 }} />,
      <EmojiEventsIcon key="f3" sx={{ fontSize: 32 }} />,
      <SecurityIcon key="f4" sx={{ fontSize: 32 }} />,
    ];
    const gradients = [
      "linear-gradient(135deg, #FF6B35, #FF8C5A)",
      "linear-gradient(135deg, #2EC84F, #4ADE7B)",
      "linear-gradient(135deg, #F59E0B, #FCD34D)",
      "linear-gradient(135deg, #8B5CF6, #A78BFA)",
    ];
    if (!Array.isArray(raw)) return [];
    return raw.map((item, i) => ({
      title: item.title,
      desc: item.desc,
      icon: icons[i],
      gradient: gradients[i],
    }));
  }, [t]);

  const x402Steps = useMemo(() => {
    const raw = t("x402Steps", { returnObjects: true }) as Array<{
      label: string;
      title: string;
      code: string;
      response: string;
    }>;
    const colors = ["#4ADE7B", "#60A5FA", "#F59E0B", "#FF6B35", "#4ADE7B"];
    const icons = ["\u{1F50D}", "\u{1F4E5}", "\u{1F512}", "\u{1F4B3}", "\u2705"];
    if (!Array.isArray(raw)) return [];
    return raw.map((s, i) => ({ ...s, color: colors[i], icon: icons[i] }));
  }, [t]);

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
              {t("heroTitle")}
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
              {t("heroSubtitle")}{" "}
              <Box
                component="span"
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {t("heroHighlight")}
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
              {t("heroDescription")}
            </Typography>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              justifyContent="center"
              alignItems={{ xs: "stretch", sm: "center" }}
              sx={{ animation: "fadeInUp 0.6s ease 0.3s both" }}
            >
              <Button
                component={Link}
                href="/marketplace"
                variant="contained"
                size="large"
                endIcon={<ArrowForwardIcon />}
                sx={{
                  px: 4,
                  py: 1.5,
                  width: { xs: "100%", sm: "auto" },
                }}
              >
                {t("browseMarketplace")}
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={handleSellData}
                startIcon={<AccountBalanceWalletIcon />}
                sx={{
                  px: 4,
                  py: 1.5,
                  width: { xs: "100%", sm: "auto" },
                  borderColor: alpha(theme.palette.text.primary, 0.2),
                  color: "text.primary",
                  "&:hover": {
                    borderColor: "primary.main",
                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                  },
                }}
              >
                {t("monetizeData")}
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
                textAlign: "center",
                display: "block",
                width: "100%",
                mb: 0.5,
              }}
            >
              {t("x402Overline")}
            </Typography>
            <X402AnimationSequence steps={x402Steps} />
            <Typography
              variant="caption"
              sx={{
                color: "text.disabled",
                mt: 1.5,
                display: "block",
                width: "100%",
                fontSize: "0.7rem",
                textAlign: "center",
                lineHeight: 1.5,
                px: { xs: 0, sm: 2 },
              }}
            >
              {t("x402Caption")}
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
              {t("whyTitle")}
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ maxWidth: 500, mx: "auto" }}
            >
              {t("whySubtitle")}
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
              {t("categoriesTitle")}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t("categoriesSubtitle")}
            </Typography>
          </Box>
          <Grid container spacing={2.5} justifyContent="center">
            {categories.map((cat, idx) => (
              <Grid size={{ xs: 6, sm: 4, md: 2 }} key={cat.key}>
                <Link
                  href={`/marketplace?category=${cat.key}`}
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
            {t("ctaTitleLine1")}
            <br />
            {t("ctaTitleLine2")}
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 5, maxWidth: 480, mx: "auto" }}
          >
            {t("ctaBody")}
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
              {t("listDataset")}
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
              {t("viewBounties")}
            </Button>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
