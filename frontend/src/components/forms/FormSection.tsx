"use client";

import { Box, Typography, useTheme, alpha } from "@mui/material";

export default function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        p: { xs: 2.5, sm: 3 },
        borderRadius: 3,
        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        bgcolor: alpha(theme.palette.background.paper, 0.6),
        mb: 3,
      }}
    >
      <Typography
        variant="subtitle2"
        fontWeight={700}
        sx={{
          mb: 2.5,
          color: "text.secondary",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          fontSize: "0.7rem",
        }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
}
