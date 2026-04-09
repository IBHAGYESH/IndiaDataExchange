"use client";

import {
  Box, List, ListItemButton, ListItemIcon, ListItemText, Typography, Divider
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
  { label: "Overview", href: "/dashboard", icon: <DashboardIcon /> },
  { label: "My Listings", href: "/dashboard/listings", icon: <StorageIcon /> },
  { label: "My Purchases", href: "/dashboard/purchases", icon: <ShoppingCartIcon /> },
  { label: "My Bounties", href: "/dashboard/bounties", icon: <EmojiEventsIcon /> },
  { label: "My Submissions", href: "/dashboard/submissions", icon: <AssignmentIcon /> },
  { divider: true },
  { label: "List Dataset", href: "/list-dataset", icon: <AddIcon /> },
  { label: "Post Bounty", href: "/post-bounty", icon: <PostAddIcon /> },
];

interface Props {
  activePath: string;
}

export default function Sidebar({ activePath }: Props) {
  return (
    <Box sx={{ height: "100%", p: 2, display: "flex", flexDirection: "column" }}>
      <Typography variant="overline" color="text.secondary" sx={{ px: 1, mb: 1 }}>
        Dashboard
      </Typography>
      <List dense>
        {navItems.map((item, idx) => {
          if ("divider" in item) return <Divider key={idx} sx={{ my: 1 }} />;
          const isActive = activePath === item.href;
          return (
            <Link key={item.href} href={item.href!} style={{ textDecoration: "none" }}>
              <ListItemButton
                selected={isActive}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  "&.Mui-selected": {
                    bgcolor: "primary.main",
                    color: "white",
                    "& .MuiListItemIcon-root": { color: "white" },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14, fontWeight: isActive ? 600 : 400 }} />
              </ListItemButton>
            </Link>
          );
        })}
      </List>
    </Box>
  );
}
