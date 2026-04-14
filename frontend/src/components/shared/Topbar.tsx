"use client";

import { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  useTheme,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  ListSubheader,
  Divider,
  useMediaQuery,
  alpha,
  Menu,
  MenuItem,
  ButtonBase,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import HubIcon from "@mui/icons-material/Hub";
import CloseIcon from "@mui/icons-material/Close";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import StorefrontIcon from "@mui/icons-material/Storefront";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import DashboardIcon from "@mui/icons-material/Dashboard";
import Link from "next/link";
import { usePathname } from "next/navigation";
import WalletConnectButton from "./WalletConnectButton";
import LanguageSwitcher from "./LanguageSwitcher";
import { useAppTheme } from "@/providers/theme-provider";
import { useAuth } from "@/providers/auth-provider";
import { useTranslation } from "react-i18next";

interface Props {
  toggleSidebar?: () => void;
  showMenu?: boolean;
}

export default function Topbar({ toggleSidebar, showMenu = false }: Props) {
  const { t } = useTranslation("nav");
  const { t: tc } = useTranslation("common");
  const { t: tDoc } = useTranslation("documentation");
  const { mode, toggleTheme } = useAppTheme();
  const { isConnected } = useAuth();
  const theme = useTheme();
  const pathname = usePathname();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [docsMenuAnchor, setDocsMenuAnchor] = useState<null | HTMLElement>(null);
  const docsMenuOpen = Boolean(docsMenuAnchor);

  const isDocsActive = pathname === "/docs-api" || pathname === "/docs-mcp";

  const navLinks = [
    { href: "/marketplace", label: t("marketplace"), icon: <StorefrontIcon fontSize="small" /> },
    ...(isConnected
      ? [
          { href: "/bounties", label: t("bounties"), icon: <EmojiEventsIcon fontSize="small" /> },
          { href: "/dashboard", label: t("dashboard"), icon: <DashboardIcon fontSize="small" /> },
        ]
      : []),
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const navChipSx = (active: boolean) => ({
    display: "flex",
    alignItems: "center",
    gap: 0.5,
    px: 1.5,
    py: 0.75,
    borderRadius: 2,
    transition: "all 0.2s ease",
    bgcolor: active ? alpha(theme.palette.primary.main, 0.1) : "transparent",
    color: active ? "primary.main" : "text.secondary",
    "&:hover": {
      bgcolor: alpha(theme.palette.primary.main, 0.06),
      color: "primary.main",
    },
  });

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: "blur(20px)",
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          zIndex: theme.zIndex.appBar,
        }}
      >
        <Toolbar sx={{ gap: 1, minHeight: { xs: 56, sm: 64 } }}>
          {showMenu && toggleSidebar && (
            <IconButton onClick={toggleSidebar} edge="start" color="inherit" size="small">
              <MenuIcon />
            </IconButton>
          )}

          <Link
            href="/"
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                fontSize: { xs: "1rem", sm: "1.15rem" },
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "-0.02em",
              }}
            >
              {tc("brand")}
            </Typography>
          </Link>

          <Box sx={{ flexGrow: 1 }} />

          {!isMobile && (
            <Box sx={{ display: "flex", gap: 0.5, alignItems: "center", mr: 1 }}>
              <Box sx={{ position: "relative" }}>
                <ButtonBase
                  disableRipple
                  onClick={(e) => setDocsMenuAnchor(e.currentTarget)}
                  aria-controls={docsMenuOpen ? "topbar-docs-menu" : undefined}
                  aria-haspopup="true"
                  aria-expanded={docsMenuOpen ? "true" : undefined}
                  sx={{
                    ...navChipSx(isDocsActive),
                    font: "inherit",
                    textAlign: "inherit",
                  }}
                >
                  <MenuBookIcon fontSize="small" />
                  <Typography variant="body2" fontWeight={isDocsActive ? 600 : 500}>
                    {t("docs")}
                  </Typography>
                  <KeyboardArrowDownIcon sx={{ fontSize: 18, opacity: 0.85, ml: -0.25 }} />
                </ButtonBase>
                <Menu
                  id="topbar-docs-menu"
                  anchorEl={docsMenuAnchor}
                  open={docsMenuOpen}
                  onClose={() => setDocsMenuAnchor(null)}
                  anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                  transformOrigin={{ vertical: "top", horizontal: "left" }}
                  slotProps={{
                    paper: {
                      sx: { mt: 0.75, minWidth: 220, borderRadius: 2 },
                    },
                  }}
                >
                  <MenuItem
                    component={Link}
                    href="/docs-api"
                    onClick={() => setDocsMenuAnchor(null)}
                    sx={{ py: 1.25 }}
                  >
                    {tDoc("docsHubApiTitle")}
                  </MenuItem>
                  <MenuItem
                    component={Link}
                    href="/docs-mcp"
                    onClick={() => setDocsMenuAnchor(null)}
                    sx={{ py: 1.25 }}
                  >
                    {tDoc("docsHubMcpTitle")}
                  </MenuItem>
                </Menu>
              </Box>

              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} style={{ textDecoration: "none" }}>
                  <Box sx={navChipSx(isActive(link.href))}>
                    {link.icon}
                    <Typography variant="body2" fontWeight={isActive(link.href) ? 600 : 500}>
                      {link.label}
                    </Typography>
                  </Box>
                </Link>
              ))}
            </Box>
          )}

          <IconButton onClick={toggleTheme} size="small" sx={{ color: "text.secondary" }}>
            {mode === "dark" ? <Brightness7Icon fontSize="small" /> : <Brightness4Icon fontSize="small" />}
          </IconButton>

          <LanguageSwitcher />

          <WalletConnectButton />

          {isMobile && (
            <IconButton
              onClick={() => setDrawerOpen(true)}
              size="small"
              sx={{ color: "text.secondary", ml: 0.5 }}
            >
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 280,
            bgcolor: "background.paper",
            borderLeft: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          },
        }}
      >
        <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="subtitle1" fontWeight={700}>
            {t("navigation")}
          </Typography>
          <IconButton onClick={() => setDrawerOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />
        <List sx={{ px: 1, pt: 1 }}>
          <ListSubheader
            disableSticky
            sx={{ bgcolor: "transparent", color: "text.secondary", fontSize: "0.7rem", fontWeight: 700, lineHeight: 2.5 }}
          >
            {t("docs")}
          </ListSubheader>
          <Link href="/docs-api" style={{ textDecoration: "none" }} onClick={() => setDrawerOpen(false)}>
            <ListItemButton selected={pathname === "/docs-api"} sx={{ borderRadius: 2, mb: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 36, color: "inherit" }}>
                <MenuBookIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={tDoc("docsHubApiTitle")}
                primaryTypographyProps={{ fontWeight: pathname === "/docs-api" ? 600 : 400 }}
              />
            </ListItemButton>
          </Link>
          <Link href="/docs-mcp" style={{ textDecoration: "none" }} onClick={() => setDrawerOpen(false)}>
            <ListItemButton selected={pathname === "/docs-mcp"} sx={{ borderRadius: 2, mb: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 36, color: "inherit" }}>
                <HubIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={tDoc("docsHubMcpTitle")}
                primaryTypographyProps={{ fontWeight: pathname === "/docs-mcp" ? 600 : 400 }}
              />
            </ListItemButton>
          </Link>

          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{ textDecoration: "none" }}
              onClick={() => setDrawerOpen(false)}
            >
              <ListItemButton
                selected={isActive(link.href)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  "&.Mui-selected": {
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: "primary.main",
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: "inherit" }}>
                  {link.icon}
                </ListItemIcon>
                <ListItemText
                  primary={link.label}
                  primaryTypographyProps={{ fontWeight: isActive(link.href) ? 600 : 400 }}
                />
              </ListItemButton>
            </Link>
          ))}
        </List>
      </Drawer>
    </>
  );
}
