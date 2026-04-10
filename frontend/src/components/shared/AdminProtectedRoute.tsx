"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useAuth } from "@/providers/auth-provider";

interface Props {
  children: React.ReactNode;
}

export default function AdminProtectedRoute({ children }: Props) {
  const { isConnected, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!isConnected || !user?.isAdmin)) {
      router.replace("/dashboard");
    }
  }, [loading, isConnected, user, router]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isConnected || !user?.isAdmin) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <Typography color="text.secondary">Redirecting...</Typography>
      </Box>
    );
  }

  return <>{children}</>;
}
