"use client";

import { Card, CardContent, CardActions, Typography, Chip, Box, Button, Stack } from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import Link from "next/link";
import { Bounty } from "@/types";
import { formatUSDC, truncateAddress, formatDate, isDeadlinePassed } from "@/utils";

const statusColors: Record<string, "success" | "warning" | "error" | "default"> = {
  open: "success",
  accepted: "warning",
  cancelled: "error",
  expired: "default",
};

interface Props {
  bounty: Bounty;
}

export default function BountyCard({ bounty }: Props) {
  const deadlinePassed = isDeadlinePassed(bounty.deadline);

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 3,
        transition: "all 0.2s",
        "&:hover": { boxShadow: 4, borderColor: "secondary.main", transform: "translateY(-2px)" },
      }}
    >
      <CardContent sx={{ flex: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
          <Chip
            label={bounty.status.toUpperCase()}
            size="small"
            color={statusColors[bounty.status]}
            sx={{ fontWeight: 700 }}
          />
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <EmojiEventsIcon sx={{ fontSize: 16, color: "#FFB800" }} />
            <Typography variant="h6" color="secondary" fontWeight={800}>
              {formatUSDC(bounty.rewardUSDC)}
            </Typography>
          </Box>
        </Box>

        <Typography variant="h6" fontWeight={700} sx={{ mb: 1, lineHeight: 1.3 }}>
          {bounty.title}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {bounty.description}
        </Typography>

        <Chip label={bounty.category} size="small" color="primary" sx={{ mb: 1 }} />

        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2, gap: 0.5 }}>
          {bounty.tags.slice(0, 3).map((tag) => (
            <Chip key={tag} label={`#${tag}`} size="small" sx={{ fontSize: "0.7rem", height: 20 }} />
          ))}
        </Stack>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <AccessTimeIcon sx={{ fontSize: 14, color: deadlinePassed ? "error.main" : "text.secondary" }} />
            <Typography
              variant="caption"
              color={deadlinePassed ? "error" : "text.secondary"}
            >
              {deadlinePassed ? "Expired" : `Due ${formatDate(bounty.deadline)}`}
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            {bounty.submissionCount} submission{bounty.submissionCount !== 1 ? "s" : ""}
          </Typography>
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
          Posted by {truncateAddress(bounty.buyerWalletAddress)}
        </Typography>
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        <Link href={`/bounty/${bounty._id}`} style={{ width: "100%" }}>
          <Button variant="contained" color="secondary" fullWidth sx={{ fontWeight: 700 }}>
            View Details & Submit
          </Button>
        </Link>
      </CardActions>
    </Card>
  );
}
