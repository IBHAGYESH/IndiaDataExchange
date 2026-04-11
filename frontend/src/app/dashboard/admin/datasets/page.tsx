"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Pagination,
  CircularProgress,
  alpha,
  useTheme,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Link from "next/link";
import AdminProtectedRoute from "@/components/shared/AdminProtectedRoute";
import { useGetAdminDatasetsQuery, useUpdateDatasetStatusMutation } from "@/redux/api/adminApi";
import { useToast } from "@/providers/toast-provider";
import { Dataset } from "@/types";

export default function AdminDatasetsPage() {
  const theme = useTheme();
  const { showToast } = useToast();
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useGetAdminDatasetsQuery({ page, limit: 20 });
  const [updateStatus, { isLoading: updating }] = useUpdateDatasetStatusMutation();
  const [confirmDialog, setConfirmDialog] = useState<{ id: string; title: string; newStatus: string } | null>(null);

  const handleStatusChange = async () => {
    if (!confirmDialog) return;
    try {
      await updateStatus({ id: confirmDialog.id, status: confirmDialog.newStatus }).unwrap();
      showToast(`Dataset ${confirmDialog.newStatus === "active" ? "activated" : "unlisted"} successfully`, "success");
      refetch();
    } catch {
      showToast("Failed to update status", "error");
    }
    setConfirmDialog(null);
  };

  const datasets = (data?.datasets || []) as Dataset[];

  return (
    <AdminProtectedRoute>
      <Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
          <Link href="/dashboard/admin">
            <IconButton size="small">
              <ArrowBackIcon />
            </IconButton>
          </Link>
          <Typography variant="h5" fontWeight={800}>
            Manage Datasets
          </Typography>
          {data && (
            <Chip label={`${data.total} total`} size="small" variant="outlined" />
          )}
        </Box>

        {isLoading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
            <CircularProgress />
          </Box>
        )}

        {isError && (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Typography color="error" gutterBottom>Failed to load datasets.</Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ cursor: "pointer", textDecoration: "underline" }}
              onClick={() => refetch()}
            >
              Click to retry
            </Typography>
          </Box>
        )}

        {data && (
          <>
            <TableContainer
              sx={{
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                bgcolor: "background.paper",
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Seller</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Price</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Purchases</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {datasets.map((ds) => (
                    <TableRow key={ds._id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 220 }}>
                          {ds.title}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
                          {ds.sellerWalletAddress?.slice(0, 6)}...{ds.sellerWalletAddress?.slice(-4)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={ds.category} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} color="primary.main">
                          ${ds.priceUSDC}
                        </Typography>
                      </TableCell>
                      <TableCell>{ds.totalPurchases}</TableCell>
                      <TableCell>
                        <Chip
                          label={ds.status}
                          size="small"
                          sx={{
                            bgcolor: ds.status === "active"
                              ? alpha("#2EC84F", 0.12)
                              : alpha("#F59E0B", 0.12),
                            color: ds.status === "active" ? "#2EC84F" : "#F59E0B",
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {ds.status === "active" ? (
                          <Tooltip title="Unlist dataset">
                            <IconButton
                              size="small"
                              onClick={() => setConfirmDialog({ id: ds._id, title: ds.title, newStatus: "unlisted" })}
                              sx={{ color: "#F59E0B" }}
                            >
                              <VisibilityOffIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Activate dataset">
                            <IconButton
                              size="small"
                              onClick={() => setConfirmDialog({ id: ds._id, title: ds.title, newStatus: "active" })}
                              sx={{ color: "#2EC84F" }}
                            >
                              <CheckCircleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {datasets.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: "center", py: 6 }}>
                        <Typography color="text.secondary">No datasets found</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {data.totalPages > 1 && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                <Pagination
                  count={data.totalPages}
                  page={page}
                  onChange={(_e, p) => setPage(p)}
                  color="primary"
                  shape="rounded"
                />
              </Box>
            )}
          </>
        )}

        <Dialog
          open={!!confirmDialog}
          onClose={() => setConfirmDialog(null)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 700 }}>
            Confirm Status Change
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2">
              Are you sure you want to{" "}
              <strong>{confirmDialog?.newStatus === "active" ? "activate" : "unlist"}</strong>{" "}
              the dataset &ldquo;{confirmDialog?.title}&rdquo;?
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setConfirmDialog(null)} color="inherit">
              Cancel
            </Button>
            <Button
              onClick={handleStatusChange}
              variant="contained"
              disabled={updating}
              color={confirmDialog?.newStatus === "active" ? "success" : "warning"}
            >
              {updating ? "Updating..." : "Confirm"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AdminProtectedRoute>
  );
}
