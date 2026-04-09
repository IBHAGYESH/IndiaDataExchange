"use client";

import {
  AppBar, Toolbar, Typography, Box, IconButton, useTheme
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import Link from "next/link";
import WalletConnectButton from "./WalletConnectButton";
import { useAppTheme } from "@/providers/theme-provider";

interface Props {
  toggleSidebar?: () => void;
  showMenu?: boolean;
}

export default function Topbar({ toggleSidebar, showMenu = true }: Props) {
  const { mode, toggleTheme } = useAppTheme();
  const theme = useTheme();

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        bgcolor: "background.paper",
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Toolbar sx={{ gap: 2 }}>
        {showMenu && toggleSidebar && (
          <IconButton onClick={toggleSidebar} edge="start" color="inherit">
            <MenuIcon />
          </IconButton>
        )}

        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              background: "linear-gradient(135deg, #FF6B35, #138808)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            🇮🇳 India Data Exchange
          </Typography>
        </Link>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Link href="/marketplace" style={{ textDecoration: "none" }}>
            <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500, "&:hover": { color: "primary.main" } }}>
              Marketplace
            </Typography>
          </Link>
          <Link href="/bounties" style={{ textDecoration: "none" }}>
            <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500, "&:hover": { color: "primary.main" } }}>
              Bounties
            </Typography>
          </Link>
          <IconButton onClick={toggleTheme} color="inherit">
            {mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
          <WalletConnectButton />
        </Box>
      </Toolbar>
    </AppBar>
  );
}
