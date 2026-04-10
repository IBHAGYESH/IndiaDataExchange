"use client";

import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Box,
  Button,
  Stack,
  alpha,
  useTheme,
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import PeopleIcon from "@mui/icons-material/People";
import Link from "next/link";
import { Bounty } from "@/types";
import {
  formatUSDC,
  truncateAddress,
  formatDate,
  isDeadlinePassed,
} from "@/utils";

const statusConfig: Record<
  string,
  { color: "success" | "warning" | "error" | "default"; label: string }
> = {
  open: { color: "success", label: "Open" },
  accepted: { color: "warning", label: "Accepted" },
  cancelled: { color: "error", label: "Cancelled" },
  expired: { color: "default", label: "Expired" },
};

interface Props {
  bounty: Bounty;
}

export default function BountyCard({ bounty }: Props) {
  const theme = useTheme();
  const deadlinePassed = isDeadlinePassed(bounty.deadline);
  const cfg = statusConfig[bounty.status] || statusConfig.expired;

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardContent sx={{ flex: 1, p: { xs: 2, sm: 2.5 } }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 1.5,
          }}
        >
          <Chip
            label={cfg.label}
            size="small"
            color={cfg.color}
            sx={{ fontWeight: 600, fontSize: "0.7rem" }}
          />
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <EmojiEventsIcon sx={{ fontSize: 18, color: "#F59E0B" }} />
            <Typography
              variant="h6"
              fontWeight={800}
              sx={{
                background: "linear-gradient(135deg, #F59E0B, #FCD34D)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontSize: "1.1rem",
              }}
            >
              {formatUSDC(bounty.rewardUSDC)}
            </Typography>
          </Box>
        </Box>

        <Typography
          variant="subtitle1"
          fontWeight={700}
          sx={{
            mb: 1,
            lineHeight: 1.3,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {bounty.title}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            lineHeight: 1.6,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {bounty.description}
        </Typography>

        <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ gap: 0.5, mb: 2 }}>
          <Chip
            label={bounty.category}
            size="small"
            sx={{
              fontWeight: 600,
              fontSize: "0.7rem",
              bgcolor: alpha(theme.palette.secondary.main, 0.1),
              color: "secondary.main",
            }}
          />
          {bounty.tags.slice(0, 2).map((tag) => (
            <Chip
              key={tag}
              label={`#${tag}`}
              size="small"
              sx={{ fontSize: "0.65rem", height: 22 }}
            />
          ))}
        </Stack>

        <Box
          sx={{
            pt: 1.5,
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="caption" color="text.disabled">
            {truncateAddress(bounty.buyerWalletAddress)}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <PeopleIcon sx={{ fontSize: 14, color: "text.disabled" }} />
            <Typography variant="caption" color="text.disabled">
              {bounty.submissionCount}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            mt: 1.5,
            pt: 1.5,
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
            display: "flex",
            alignItems: "center",
            gap: 0.5,
          }}
        >
          <AccessTimeIcon
            sx={{
              fontSize: 14,
              color: deadlinePassed ? "error.main" : "text.disabled",
            }}
          />
          <Typography
            variant="caption"
            color={deadlinePassed ? "error" : "text.disabled"}
          >
            {deadlinePassed ? "Expired" : `Due ${formatDate(bounty.deadline)}`}
          </Typography>
        </Box>
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        <Link href={`/bounty/${bounty._id}`} style={{ width: "100%" }}>
          <Button
            variant="outlined"
            fullWidth
            size="small"
            endIcon={<ArrowForwardIcon />}
            sx={{
              fontSize: "0.8rem",
              borderColor: alpha(theme.palette.divider, 0.2),
              "&:hover": { borderColor: "primary.main" },
            }}
          >
            View Details
          </Button>
        </Link>
      </CardActions>
    </Card>
  );
}
