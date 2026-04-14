"use client";

import { Box } from "@mui/material";
import Topbar from "../shared/Topbar";
import SiteFooter from "../shared/SiteFooter";
import RouteDocumentTitle from "./RouteDocumentTitle";

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
      <RouteDocumentTitle />
      <Topbar />
      <Box
        component="main"
        sx={{
          flex: 1,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        {children}
      </Box>
      <SiteFooter />
    </Box>
  );
}
