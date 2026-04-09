"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useAuth } from "@/providers/auth-provider";

interface Props {
  children: React.ReactNode;
  redirectTo?: string;
}

export default function ProtectedRoute({ children, redirectTo = "/" }: Props) {
  const { isConnected, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isConnected) {
      router.replace(redirectTo);
    }
  }, [loading, isConnected, router, redirectTo]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isConnected) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <Typography color="text.secondary">Redirecting...</Typography>
      </Box>
    );
  }

  return <>{children}</>;
}
