"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Typography,
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Chip,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import USDCOptInPrompt from "@/components/shared/USDCOptInPrompt";
import { useAuth } from "@/providers/auth-provider";
import { useCreateDatasetMutation } from "@/redux/api/datasetApi";
import FormSection from "@/components/forms/FormSection";
import FileDropZone from "@/components/forms/FileDropZone";
import { DatasetCategory, DatasetFormat } from "@/types";

const categories: DatasetCategory[] = ["agriculture", "language", "traffic", "healthcare", "cultural", "financial", "other"];
const formats: DatasetFormat[] = ["csv", "json", "images", "audio", "video", "pdf", "other"];

export default function ListDatasetPage() {
  const { t } = useTranslation("forms");
  const router = useRouter();
  const { isOptedIn, refreshUser } = useAuth();
  const [createDataset, { isLoading }] = useCreateDatasetMutation();
  const [optInOpen, setOptInOpen] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "" as DatasetCategory,
    tags: [] as string[],
    tagInput: "",
    priceUSDC: "",
    format: "" as DatasetFormat,
    recordCount: "",
    sizeBytes: "",
  });
  const [sampleFile, setSampleFile] = useState<File | null>(null);
  const [fullDataFile, setFullDataFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sellerAttestation, setSellerAttestation] = useState(false);

  const handleAddTag = () => {
    if (form.tagInput.trim() && !form.tags.includes(form.tagInput.trim())) {
      setForm((p) => ({ ...p, tags: [...p.tags, p.tagInput.trim()], tagInput: "" }));
    }
  };

  const handleRemoveTag = (tag: string) => {
    setForm((p) => ({ ...p, tags: p.tags.filter((t) => t !== tag) }));
  };

  const handleSubmit = async () => {
    if (!isOptedIn) { setOptInOpen(true); return; }
    const requiredFields = ["title", "description", "category", "priceUSDC", "format"];
    for (const field of requiredFields) {
      if (!form[field as keyof typeof form]) { setError(`${field} is required`); return; }
    }
    if (!sampleFile || !fullDataFile) { setError("Both sample file and full data file are required"); return; }
    if (!sellerAttestation) {
      setError(t("attestationRequired"));
      return;
    }
    const price = parseFloat(form.priceUSDC);
    if (isNaN(price) || price < 0.1 || price > 100) { setError("Price must be between $0.10 and $100.00 USDC"); return; }
    setError(null);

    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("description", form.description);
    formData.append("category", form.category);
    formData.append("tags", JSON.stringify(form.tags));
    formData.append("priceUSDC", form.priceUSDC);
    formData.append("format", form.format);
    formData.append("recordCount", form.recordCount || "0");
    formData.append("sizeBytes", form.sizeBytes || "0");
    formData.append("sampleFile", sampleFile);
    formData.append("fullDataFile", fullDataFile);
    formData.append("sellerAttestationAccepted", "true");

    try {
      await createDataset(formData).unwrap();
      setSuccess(true);
      setTimeout(() => router.push("/dashboard/listings"), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create dataset");
    }
  };

  if (success) {
    return (
      <Box sx={{ py: 10, textAlign: "center", maxWidth: 480, mx: "auto" }}>
        <CheckCircleOutlineIcon sx={{ fontSize: 56, color: "#2EC84F", mb: 2 }} />
        <Typography variant="h5" fontWeight={800}>{t("listSuccessTitle")}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {t("listSuccessBody")}
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ maxWidth: 680, mx: "auto" }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5 }}>
            {t("listDatasetTitle")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("listDatasetSubtitle")}
          </Typography>
        </Box>

        {!isOptedIn && (
          <Alert severity="warning" sx={{ mb: 3, borderRadius: 3 }} action={
            <Button size="small" onClick={() => setOptInOpen(true)}>{t("optInButton")}</Button>
          }>
            {t("usdcRequiredBeforeList")}
          </Alert>
        )}
        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>{error}</Alert>}

        <FormSection title={t("datasetDetails")}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <TextField fullWidth required label={t("title")} value={form.title}
              onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
              inputProps={{ maxLength: 100 }}
              placeholder="e.g. Indian Crop Disease Image Dataset"
            />
            <TextField fullWidth required multiline rows={4} label={t("description")} value={form.description}
              onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
              inputProps={{ maxLength: 2000 }}
              placeholder="What data does this dataset contain? How was it collected? What can it be used for?"
            />
            <Box sx={{ display: "flex", gap: 2 }}>
              <FormControl fullWidth required>
                <InputLabel>{t("category")}</InputLabel>
                <Select value={form.category} label={t("category")}
                  onChange={(e) => setForm(p => ({ ...p, category: e.target.value as DatasetCategory }))}>
                  {categories.map((c) => <MenuItem key={c} value={c} sx={{ textTransform: "capitalize" }}>{c}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth required>
                <InputLabel>{t("format")}</InputLabel>
                <Select value={form.format} label={t("format")}
                  onChange={(e) => setForm(p => ({ ...p, format: e.target.value as DatasetFormat }))}>
                  {formats.map((f) => <MenuItem key={f} value={f}>{f.toUpperCase()}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
          </Box>
        </FormSection>

        <FormSection title={t("filesPricing")}>
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <TextField
              fullWidth required label={t("priceUsdc")} type="number"
              value={form.priceUSDC}
              onChange={(e) => setForm(p => ({ ...p, priceUSDC: e.target.value }))}
              inputProps={{ min: 0.1, max: 100, step: 0.1 }}
              helperText={t("priceHelper")}
              InputProps={{ startAdornment: <AttachMoneyIcon sx={{ mr: 0.5, color: "text.disabled", fontSize: 20 }} /> }}
            />
            <TextField fullWidth label={t("recordCount")} type="number" value={form.recordCount}
              onChange={(e) => setForm(p => ({ ...p, recordCount: e.target.value }))}
              placeholder="e.g. 10000"
            />
            <TextField fullWidth label={t("sizeBytes")} type="number" value={form.sizeBytes}
              onChange={(e) => setForm(p => ({ ...p, sizeBytes: e.target.value }))}
              placeholder="e.g. 5242880"
            />
          </Box>

          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <LocalOfferIcon sx={{ color: "text.disabled", fontSize: 18 }} />
            <TextField
              size="small" label={t("tags")} value={form.tagInput} sx={{ flex: 1 }}
              onChange={(e) => setForm(p => ({ ...p, tagInput: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
              placeholder="Press enter to add"
            />
            <Button onClick={handleAddTag} variant="outlined" size="small" sx={{ minWidth: 60, height: 40 }}>{t("add")}</Button>
          </Box>
          {form.tags.length > 0 && (
            <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 1.5 }}>
              {form.tags.map((tag) => (
                <Chip key={tag} label={`#${tag}`} onDelete={() => handleRemoveTag(tag)} size="small"
                  sx={{ borderRadius: 2 }}
                />
              ))}
            </Box>
          )}
        </FormSection>

        <FormSection title={t("filesUpload")}>
          <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" fontWeight={600} sx={{ mb: 1, display: "block", color: "text.secondary" }}>
                {t("sampleFile")}
              </Typography>
              <FileDropZone
                label={t("dropSample")}
                hint={t("hintSample")}
                file={sampleFile}
                onSelect={setSampleFile}
                onClear={() => setSampleFile(null)}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" fontWeight={600} sx={{ mb: 1, display: "block", color: "text.secondary" }}>
                {t("fullFile")}
              </Typography>
              <FileDropZone
                label={t("dropFull")}
                hint={t("hintFull")}
                file={fullDataFile}
                onSelect={setFullDataFile}
                onClear={() => setFullDataFile(null)}
              />
            </Box>
          </Box>
        </FormSection>

        <FormControlLabel
          sx={{ alignItems: "flex-start", mb: 2, ml: 0 }}
          control={
            <Checkbox
              checked={sellerAttestation}
              onChange={(_, c) => setSellerAttestation(c)}
              sx={{ pt: 0.25 }}
            />
          }
          label={
            <Box>
              <Typography variant="body2">{t("sellerAttestation")}</Typography>
              <Typography variant="caption" color="text.secondary">
                {t("sellerAttestationHint")}
              </Typography>
            </Box>
          }
        />

        <Button
          variant="contained"
          size="large"
          fullWidth
          disabled={isLoading}
          onClick={handleSubmit}
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
          sx={{ py: 1.8, fontWeight: 700, borderRadius: 3, fontSize: "0.95rem" }}
        >
          {isLoading ? t("uploading") : t("submitListing")}
        </Button>
      </Box>

      <USDCOptInPrompt
        open={optInOpen}
        onClose={() => setOptInOpen(false)}
        onOptInSuccess={() => { setOptInOpen(false); refreshUser(); }}
      />
    </>
  );
}
