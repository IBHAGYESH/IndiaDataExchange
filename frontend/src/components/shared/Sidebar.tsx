"use client";

import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  alpha,
  useTheme,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import StorageIcon from "@mui/icons-material/Storage";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AddIcon from "@mui/icons-material/Add";
import PostAddIcon from "@mui/icons-material/PostAdd";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import TableChartIcon from "@mui/icons-material/TableChart";
import GavelIcon from "@mui/icons-material/Gavel";
import PrivacyTipIcon from "@mui/icons-material/PrivacyTip";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/providers/auth-provider";

type NavItem =
  | { label: string; href: string; icon: React.ReactNode }
  | { divider: true }
  | { sectionLabel: string };

interface Props {
  activePath: string;
}

export default function Sidebar({ activePath }: Props) {
  const theme = useTheme();
  const { t } = useTranslation("nav");
  const { user } = useAuth();

  const navItems: NavItem[] = [
    { label: t("overview"), href: "/dashboard", icon: <DashboardIcon fontSize="small" /> },
    { label: t("myListings"), href: "/dashboard/listings", icon: <StorageIcon fontSize="small" /> },
    { label: t("myPurchases"), href: "/dashboard/purchases", icon: <ShoppingCartIcon fontSize="small" /> },
    { label: t("myBounties"), href: "/dashboard/bounties", icon: <EmojiEventsIcon fontSize="small" /> },
    { label: t("mySubmissions"), href: "/dashboard/submissions", icon: <AssignmentIcon fontSize="small" /> },
    { divider: true },
    { label: t("listDataset"), href: "/dashboard/list-dataset", icon: <AddIcon fontSize="small" /> },
    { label: t("postBounty"), href: "/dashboard/post-bounty", icon: <PostAddIcon fontSize="small" /> },
    { label: t("accountPrivacy"), href: "/dashboard/account", icon: <PrivacyTipIcon fontSize="small" /> },
    ...(user?.isAdmin
      ? [
          { divider: true } as NavItem,
          { sectionLabel: t("adminSection") } as NavItem,
          { label: t("platformOverview"), href: "/dashboard/admin", icon: <AdminPanelSettingsIcon fontSize="small" /> } as NavItem,
          { label: t("adminDatasets"), href: "/dashboard/admin/datasets", icon: <TableChartIcon fontSize="small" /> } as NavItem,
          { label: t("adminBounties"), href: "/dashboard/admin/bounties", icon: <GavelIcon fontSize="small" /> } as NavItem,
        ]
      : []),
  ];

  return (
    <Box
      sx={{
        height: "100%",
        p: 2,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Typography
        variant="overline"
        color="text.disabled"
        sx={{ px: 1, mb: 1, letterSpacing: "0.1em", fontSize: "0.65rem" }}
      >
        {t("sidebarHeading")}
      </Typography>
      <List dense disablePadding>
        {navItems.map((item, idx) => {
          if ("divider" in item)
            return <Divider key={`div-${idx}`} sx={{ my: 1.5, opacity: 0.06 }} />;
          if ("sectionLabel" in item)
            return (
              <Typography
                key={`section-${idx}`}
                variant="overline"
                color="warning.main"
                sx={{ px: 1, mb: 0.5, mt: 0.5, letterSpacing: "0.1em", fontSize: "0.6rem", display: "block" }}
              >
                {item.sectionLabel}
              </Typography>
            );
          const isActive = activePath === item.href;
          const isAdminItem = item.href.includes("/admin");
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{ textDecoration: "none" }}
            >
              <ListItemButton
                selected={isActive}
                sx={{
                  borderRadius: 2.5,
                  mb: 0.25,
                  py: 0.75,
                  transition: "all 0.2s ease",
                  "&.Mui-selected": {
                    bgcolor: alpha(isAdminItem ? "#F59E0B" : theme.palette.primary.main, 0.1),
                    color: isAdminItem ? "#F59E0B" : "primary.main",
                    "& .MuiListItemIcon-root": { color: isAdminItem ? "#F59E0B" : "primary.main" },
                  },
                  "&:hover": {
                    bgcolor: alpha(isAdminItem ? "#F59E0B" : theme.palette.primary.main, 0.04),
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 32, color: "inherit" }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: "0.85rem",
                    fontWeight: isActive ? 600 : 400,
                  }}
                />
              </ListItemButton>
            </Link>
          );
        })}
      </List>
    </Box>
  );
}
