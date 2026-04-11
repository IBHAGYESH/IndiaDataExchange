"use client";

import { Box } from "@mui/material";
import Topbar from "../shared/Topbar";
import SiteFooter from "../shared/SiteFooter";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
      }}
    >
      <Topbar />
      <Box component="main" sx={{ flex: 1, position: "relative" }}>
        {children}
      </Box>
      <SiteFooter />
    </Box>
  );
}
