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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import CancelIcon from "@mui/icons-material/Cancel";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Link from "next/link";
import AdminProtectedRoute from "@/components/shared/AdminProtectedRoute";
import { useGetAdminBountiesQuery, useUpdateBountyStatusMutation } from "@/redux/api/adminApi";
import { useToast } from "@/providers/toast-provider";
import { Bounty } from "@/types";

const statusColors: Record<string, string> = {
  open: "#2EC84F",
  accepted: "#60A5FA",
  cancelled: "#EF4444",
  expired: "#A1A1AA",
};

export default function AdminBountiesPage() {
  const theme = useTheme();
  const { showToast } = useToast();
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useGetAdminBountiesQuery({ page, limit: 20 });
  const [updateStatus, { isLoading: updating }] = useUpdateBountyStatusMutation();
  const [confirmDialog, setConfirmDialog] = useState<{ id: string; title: string; newStatus: string } | null>(null);
  const [selectedStatus, setSelectedStatus] = useState("");

  const handleStatusChange = async () => {
    if (!confirmDialog) return;
    try {
      await updateStatus({ id: confirmDialog.id, status: confirmDialog.newStatus }).unwrap();
      showToast(`Bounty status updated to "${confirmDialog.newStatus}"`, "success");
      refetch();
    } catch {
      showToast("Failed to update status", "error");
    }
    setConfirmDialog(null);
    setSelectedStatus("");
  };

  const bounties = (data?.bounties || []) as Bounty[];

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
            Manage Bounties
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
            <Typography color="error" gutterBottom>Failed to load bounties.</Typography>
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
                    <TableCell sx={{ fontWeight: 700 }}>Buyer</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Reward</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Submissions</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bounties.map((bounty) => (
                    <TableRow key={bounty._id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 220 }}>
                          {bounty.title}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          Deadline: {new Date(bounty.deadline).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
                          {bounty.buyerWalletAddress?.slice(0, 6)}...{bounty.buyerWalletAddress?.slice(-4)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={bounty.category} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700} sx={{ color: "#FFB800" }}>
                          ${bounty.rewardUSDC}
                        </Typography>
                      </TableCell>
                      <TableCell>{bounty.submissionCount}</TableCell>
                      <TableCell>
                        <Chip
                          label={bounty.status}
                          size="small"
                          sx={{
                            bgcolor: alpha(statusColors[bounty.status] || "#A1A1AA", 0.12),
                            color: statusColors[bounty.status] || "#A1A1AA",
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {bounty.status === "open" && (
                          <Tooltip title="Cancel bounty">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedStatus("cancelled");
                                setConfirmDialog({ id: bounty._id, title: bounty.title, newStatus: "cancelled" });
                              }}
                              sx={{ color: "#EF4444" }}
                            >
                              <CancelIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {bounty.status !== "open" && (
                          <Typography variant="caption" color="text.disabled">—</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {bounties.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: "center", py: 6 }}>
                        <Typography color="text.secondary">No bounties found</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {((data as { totalPages?: number }).totalPages ?? 0) > 1 && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                <Pagination
                  count={(data as { totalPages: number }).totalPages}
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
          onClose={() => { setConfirmDialog(null); setSelectedStatus(""); }}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 700 }}>
            Update Bounty Status
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Changing status of &ldquo;{confirmDialog?.title}&rdquo;
            </Typography>
            <FormControl fullWidth size="small">
              <InputLabel>New Status</InputLabel>
              <Select
                value={selectedStatus}
                label="New Status"
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  if (confirmDialog) {
                    setConfirmDialog({ ...confirmDialog, newStatus: e.target.value });
                  }
                }}
              >
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="accepted">Accepted</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
                <MenuItem value="expired">Expired</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => { setConfirmDialog(null); setSelectedStatus(""); }} color="inherit">
              Cancel
            </Button>
            <Button
              onClick={handleStatusChange}
              variant="contained"
              disabled={updating || !selectedStatus}
            >
              {updating ? "Updating..." : "Confirm"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AdminProtectedRoute>
  );
}
