"use client";

import { Box, Typography, Link as MuiLink, alpha, useTheme } from "@mui/material";
import Link from "next/link";
import { useTranslation } from "react-i18next";

/**
 * Single site footer: tagline, landing credit lines, then Privacy & Terms.
 * Used by MainLayout (home, marketplace, legal pages, etc.).
 */
export default function SiteFooter() {
  const theme = useTheme();
  const { t } = useTranslation("common");
  const { t: tl } = useTranslation("landing");

  return (
    <Box
      component="footer"
      sx={{
        py: 4,
        px: 2,
        borderTop: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
        textAlign: "center",
      }}
    >
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
        {t("footerTagline")}
      </Typography>
      <Typography variant="body2" color="text.disabled" sx={{ mb: 0.5 }}>
        {tl("footerBuilt")}
      </Typography>
      <Typography variant="body2" color="text.disabled" sx={{ mb: 1.5 }}>
        {tl("footerCredit")}{" "}
        <Box component="span" sx={{ color: "#FF6B35" }}>
          &#10084;&#65039;
        </Box>{" "}
        {tl("footerBy")}{" "}
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
      <Box sx={{ display: "flex", justifyContent: "center", gap: 2, flexWrap: "wrap" }}>
        <MuiLink component={Link} href="/privacy" variant="body2" color="text.secondary" underline="hover">
          {t("privacy")}
        </MuiLink>
        <MuiLink component={Link} href="/terms" variant="body2" color="text.secondary" underline="hover">
          {t("terms")}
        </MuiLink>
      </Box>
    </Box>
  );
}
