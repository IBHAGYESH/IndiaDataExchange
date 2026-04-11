"use client";

import {
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDeleteAccountMutation } from "@/redux/api/userApi";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";

export default function AccountPage() {
  const { t } = useTranslation("dashboard");
  const { t: tc } = useTranslation("common");
  const { disconnectWallet } = useAuth();
  const { showToast } = useToast();
  const [deleteAccount, { isLoading }] = useDeleteAccountMutation();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteAccount().unwrap();
      showToast(t("deleteSuccess"), "success");
      setConfirmOpen(false);
      disconnectWallet();
    } catch {
      showToast(t("deleteFailed"), "error");
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} gutterBottom>
        {t("accountTitle")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 560 }}>
        {t("accountIntro")}
      </Typography>
      <Button variant="outlined" color="error" onClick={() => setConfirmOpen(true)} disabled={isLoading}>
        {t("deleteAccount")}
      </Button>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>{t("deleteConfirmTitle")}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {t("deleteConfirmBody")}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmOpen(false)}>{tc("cancel")}</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={isLoading}>
            {isLoading ? <CircularProgress size={22} /> : tc("confirm")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
