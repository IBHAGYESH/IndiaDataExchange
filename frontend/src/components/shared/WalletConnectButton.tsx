"use client";

import { Button, Box, Typography, Menu, MenuItem, Chip, CircularProgress } from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import { useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { truncateAddress } from "@/utils";

export default function WalletConnectButton() {
  const { walletAddress, isConnected, loading, connectWallet, disconnectWallet, isOptedIn } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  if (loading) {
    return <CircularProgress size={24} color="inherit" />;
  }

  if (isConnected && walletAddress) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {!isOptedIn && (
          <Chip label="USDC Not Opted In" size="small" color="warning" />
        )}
        <Button
          variant="outlined"
          size="small"
          startIcon={<AccountBalanceWalletIcon />}
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{ borderRadius: 3, textTransform: "none" }}
        >
          {truncateAddress(walletAddress)}
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
        >
          <MenuItem
            onClick={() => {
              navigator.clipboard.writeText(walletAddress);
              setAnchorEl(null);
            }}
          >
            Copy Address
          </MenuItem>
          <MenuItem
            onClick={() => {
              disconnectWallet();
              setAnchorEl(null);
            }}
            sx={{ color: "error.main" }}
          >
            Disconnect
          </MenuItem>
        </Menu>
      </Box>
    );
  }

  return (
    <Button
      variant="contained"
      startIcon={<AccountBalanceWalletIcon />}
      onClick={connectWallet}
      disabled={loading}
      sx={{
        borderRadius: 3,
        textTransform: "none",
        fontWeight: 600,
        background: "linear-gradient(135deg, #FF6B35, #FF8C5A)",
        "&:hover": { background: "linear-gradient(135deg, #e55a24, #FF6B35)" },
      }}
    >
      Connect Wallet
    </Button>
  );
}
