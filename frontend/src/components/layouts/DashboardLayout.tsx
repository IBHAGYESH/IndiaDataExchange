"use client";

import { useState } from "react";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import Topbar from "../shared/Topbar";
import Sidebar from "../shared/Sidebar";
import { usePathname } from "next/navigation";
import ProtectedRoute from "../shared/ProtectedRoute";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  return (
    <ProtectedRoute>
      <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        {sidebarOpen && (
          <Box
            component="nav"
            sx={{
              width: 240,
              flexShrink: 0,
              bgcolor: "background.paper",
              borderRight: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Sidebar activePath={pathname} />
          </Box>
        )}
        <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <Topbar toggleSidebar={() => setSidebarOpen((p) => !p)} />
          <Box
            component="main"
            sx={{
              flex: 1,
              overflowY: "auto",
              p: { xs: 2, sm: 3 },
              bgcolor: "background.default",
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>
    </ProtectedRoute>
  );
}
