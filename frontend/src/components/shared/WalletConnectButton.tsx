"use client";

import {
  Button,
  Box,
  Typography,
  Menu,
  MenuItem,
  Chip,
  CircularProgress,
  alpha,
  useTheme,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DashboardIcon from "@mui/icons-material/Dashboard";
import LogoutIcon from "@mui/icons-material/Logout";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { truncateAddress } from "@/utils";
import { useRouter } from "next/navigation";

export default function WalletConnectButton() {
  const {
    walletAddress,
    isConnected,
    loading,
    connectWallet,
    disconnectWallet,
    isOptedIn,
  } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await connectWallet();
      showToast("Wallet connected successfully!", "success");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to connect wallet";
      if (!msg.includes("cancelled") && !msg.includes("rejected")) {
        showToast(msg, "error");
      }
    } finally {
      setConnecting(false);
    }
  };

  if (loading && !connecting) {
    return <CircularProgress size={20} color="inherit" />;
  }

  if (isConnected && walletAddress) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {!isOptedIn && (
          <Chip
            icon={<WarningAmberIcon sx={{ fontSize: 14 }} />}
            label="USDC"
            size="small"
            color="warning"
            variant="outlined"
            sx={{ height: 28, fontSize: "0.7rem" }}
          />
        )}
        <Button
          variant="outlined"
          size="small"
          startIcon={
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: "#4ADE7B",
              }}
            />
          }
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{
            borderRadius: 100,
            textTransform: "none",
            px: 2,
            fontFamily: "monospace",
            fontSize: "0.8rem",
            borderColor: alpha(theme.palette.divider, 0.2),
            "&:hover": { borderColor: "primary.main" },
          }}
        >
          {truncateAddress(walletAddress)}
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          PaperProps={{
            sx: {
              mt: 1,
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
              minWidth: 200,
            },
          }}
        >
          <MenuItem
            onClick={() => {
              navigator.clipboard.writeText(walletAddress);
              showToast("Address copied!", "success");
              setAnchorEl(null);
            }}
          >
            <ListItemIcon>
              <ContentCopyIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Copy Address</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => {
              router.push("/dashboard");
              setAnchorEl(null);
            }}
          >
            <ListItemIcon>
              <DashboardIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Dashboard</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => {
              disconnectWallet();
              showToast("Wallet disconnected", "info");
              setAnchorEl(null);
              router.push("/");
            }}
            sx={{ color: "error.main" }}
          >
            <ListItemIcon>
              <LogoutIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Disconnect</ListItemText>
          </MenuItem>
        </Menu>
      </Box>
    );
  }

  return (
    <Button
      variant="contained"
      size="small"
      startIcon={
        connecting ? (
          <CircularProgress size={16} color="inherit" />
        ) : (
          <AccountBalanceWalletIcon fontSize="small" />
        )
      }
      onClick={handleConnect}
      disabled={connecting}
      sx={{
        borderRadius: 100,
        textTransform: "none",
        fontWeight: 600,
        px: { xs: 2, sm: 2.5 },
        fontSize: "0.85rem",
      }}
    >
      {connecting ? "Connecting..." : "Connect"}
    </Button>
  );
}
