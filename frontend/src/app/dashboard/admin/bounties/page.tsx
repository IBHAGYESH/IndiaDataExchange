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
import { useTranslation } from "react-i18next";

const statusColors: Record<string, string> = {
  open: "#2EC84F",
  accepted: "#60A5FA",
  cancelled: "#EF4444",
  expired: "#A1A1AA",
};

export default function AdminBountiesPage() {
  const { t } = useTranslation("admin");
  const { t: tb } = useTranslation("bounties");
  const { t: tc } = useTranslation("common");
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
      showToast(t("toastBountyUpdated"), "success");
      refetch();
    } catch {
      showToast(t("toastUpdateFailed"), "error");
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
            {t("manageBounties")}
          </Typography>
          {data && (
            <Chip label={t("totalCount", { count: data.total })} size="small" variant="outlined" />
          )}
        </Box>

        {isLoading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
            <CircularProgress />
          </Box>
        )}

        {isError && (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Typography color="error" gutterBottom>
              {t("failedLoadBounties")}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ cursor: "pointer", textDecoration: "underline" }}
              onClick={() => refetch()}
            >
              {t("clickRetry")}
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
                    <TableCell sx={{ fontWeight: 700 }}>{t("colTitle")}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t("colBuyer")}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t("colCategory")}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t("colReward")}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t("colSubmissions")}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t("colStatus")}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      {t("colActions")}
                    </TableCell>
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
                          {t("deadlineShort", { date: new Date(bounty.deadline).toLocaleDateString() })}
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
                          <Tooltip title={t("tooltipCancelBounty")}>
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
                        <Typography color="text.secondary">{t("noBountiesTable")}</Typography>
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
          onClose={() => { setConfirmDialog(null); setSelectedStatus(""); }}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 700 }}>{t("bountyDialogTitle")}</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {t("bountyChangingIntro", { title: confirmDialog?.title ?? "" })}
            </Typography>
            <FormControl fullWidth size="small">
              <InputLabel>{t("newStatus")}</InputLabel>
              <Select
                value={selectedStatus}
                label={t("newStatus")}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  if (confirmDialog) {
                    setConfirmDialog({ ...confirmDialog, newStatus: e.target.value });
                  }
                }}
              >
                <MenuItem value="open">{tb("status_open")}</MenuItem>
                <MenuItem value="accepted">{tb("status_accepted")}</MenuItem>
                <MenuItem value="cancelled">{tb("status_cancelled")}</MenuItem>
                <MenuItem value="expired">{tb("status_expired")}</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => {
                setConfirmDialog(null);
                setSelectedStatus("");
              }}
              color="inherit"
            >
              {tc("cancel")}
            </Button>
            <Button onClick={handleStatusChange} variant="contained" disabled={updating || !selectedStatus}>
              {updating ? t("updating") : t("confirm")}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AdminProtectedRoute>
  );
}
