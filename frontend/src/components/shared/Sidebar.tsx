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
import Link from "next/link";

const navItems = [
  { label: "Overview", href: "/dashboard", icon: <DashboardIcon fontSize="small" /> },
  { label: "My Listings", href: "/dashboard/listings", icon: <StorageIcon fontSize="small" /> },
  { label: "My Purchases", href: "/dashboard/purchases", icon: <ShoppingCartIcon fontSize="small" /> },
  { label: "My Bounties", href: "/dashboard/bounties", icon: <EmojiEventsIcon fontSize="small" /> },
  { label: "My Submissions", href: "/dashboard/submissions", icon: <AssignmentIcon fontSize="small" /> },
  { divider: true },
  { label: "List Dataset", href: "/dashboard/list-dataset", icon: <AddIcon fontSize="small" /> },
  { label: "Post Bounty", href: "/dashboard/post-bounty", icon: <PostAddIcon fontSize="small" /> },
] as const;

interface Props {
  activePath: string;
}

export default function Sidebar({ activePath }: Props) {
  const theme = useTheme();

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
        Dashboard
      </Typography>
      <List dense disablePadding>
        {navItems.map((item, idx) => {
          if ("divider" in item && item.divider)
            return <Divider key={idx} sx={{ my: 1.5, opacity: 0.06 }} />;
          if (!("href" in item)) return null;
          const isActive = activePath === item.href;
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
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: "primary.main",
                    "& .MuiListItemIcon-root": { color: "primary.main" },
                  },
                  "&:hover": {
                    bgcolor: alpha(theme.palette.primary.main, 0.04),
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
