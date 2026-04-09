"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Container, Typography, Box, TextField, Select, MenuItem, FormControl,
  InputLabel, Button, Grid, Chip, Alert, CircularProgress, Paper, Divider
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import MainLayout from "@/components/layouts/MainLayout";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import USDCOptInPrompt from "@/components/shared/USDCOptInPrompt";
import { useAuth } from "@/providers/auth-provider";
import { useCreateDatasetMutation } from "@/redux/api/datasetApi";
import { DatasetCategory, DatasetFormat } from "@/types";

const categories: DatasetCategory[] = ["agriculture", "language", "traffic", "healthcare", "cultural", "financial", "other"];
const formats: DatasetFormat[] = ["csv", "json", "images", "audio", "video", "pdf", "other"];

export default function ListDatasetPage() {
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

  const handleAddTag = () => {
    if (form.tagInput.trim() && !form.tags.includes(form.tagInput.trim())) {
      setForm((p) => ({ ...p, tags: [...p.tags, p.tagInput.trim()], tagInput: "" }));
    }
  };

  const handleRemoveTag = (tag: string) => {
    setForm((p) => ({ ...p, tags: p.tags.filter((t) => t !== tag) }));
  };

  const handleSubmit = async () => {
    if (!isOptedIn) {
      setOptInOpen(true);
      return;
    }

    const requiredFields = ["title", "description", "category", "priceUSDC", "format"];
    for (const field of requiredFields) {
      if (!form[field as keyof typeof form]) {
        setError(`${field} is required`);
        return;
      }
    }
    if (!sampleFile || !fullDataFile) {
      setError("Both sample file and full data file are required");
      return;
    }

    const price = parseFloat(form.priceUSDC);
    if (isNaN(price) || price < 0.1 || price > 100) {
      setError("Price must be between $0.10 and $100.00 USDC");
      return;
    }

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
      <ProtectedRoute>
        <MainLayout>
          <Container maxWidth="md" sx={{ py: 8, textAlign: "center" }}>
            <Typography variant="h4">🎉 Dataset Listed!</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
              Your dataset is now live on the marketplace. Redirecting to your listings...
            </Typography>
          </Container>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <MainLayout>
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            📦 List a Dataset
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Earn USDC every time someone downloads your dataset. Payments go directly to your wallet.
          </Typography>

          {!isOptedIn && (
            <Alert severity="warning" sx={{ mb: 3 }} action={
              <Button size="small" onClick={() => setOptInOpen(true)}>Opt In Now</Button>
            }>
              You need to opt-in to USDC before listing datasets.
            </Alert>
          )}

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField fullWidth required label="Dataset Title" value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} inputProps={{ maxLength: 100 }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth required multiline rows={4} label="Description" value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} inputProps={{ maxLength: 2000 }} />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select value={form.category} label="Category" onChange={(e) => setForm(p => ({ ...p, category: e.target.value as DatasetCategory }))}>
                  {categories.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth required>
                <InputLabel>Format</InputLabel>
                <Select value={form.format} label="Format" onChange={(e) => setForm(p => ({ ...p, format: e.target.value as DatasetFormat }))}>
                  {formats.map((f) => <MenuItem key={f} value={f}>{f.toUpperCase()}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth required label="Price (USDC)" type="number"
                value={form.priceUSDC}
                onChange={(e) => setForm(p => ({ ...p, priceUSDC: e.target.value }))}
                inputProps={{ min: 0.1, max: 100, step: 0.1 }}
                helperText="$0.10 - $100.00"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Record Count" type="number" value={form.recordCount} onChange={(e) => setForm(p => ({ ...p, recordCount: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Size (bytes)" type="number" value={form.sizeBytes} onChange={(e) => setForm(p => ({ ...p, sizeBytes: e.target.value }))} />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                <TextField
                  size="small"
                  label="Add Tag"
                  value={form.tagInput}
                  onChange={(e) => setForm(p => ({ ...p, tagInput: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                />
                <Button onClick={handleAddTag} variant="outlined" size="small">Add</Button>
              </Box>
              <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                {form.tags.map((tag) => (
                  <Chip key={tag} label={`#${tag}`} onDelete={() => handleRemoveTag(tag)} size="small" />
                ))}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="h6" fontWeight={700} gutterBottom>Files</Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Paper elevation={0} sx={{ border: "2px dashed", borderColor: "divider", p: 3, textAlign: "center", borderRadius: 2 }}>
                <CloudUploadIcon sx={{ fontSize: 40, color: "text.secondary", mb: 1 }} />
                <Typography variant="subtitle2" gutterBottom>Sample File (Public Preview)</Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                  Max 10MB · Users see this before buying
                </Typography>
                <input type="file" onChange={(e) => setSampleFile(e.target.files?.[0] || null)} />
                {sampleFile && <Typography variant="caption" color="success.main">✓ {sampleFile.name}</Typography>}
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Paper elevation={0} sx={{ border: "2px dashed", borderColor: "divider", p: 3, textAlign: "center", borderRadius: 2 }}>
                <CloudUploadIcon sx={{ fontSize: 40, color: "text.secondary", mb: 1 }} />
                <Typography variant="subtitle2" gutterBottom>Full Dataset (Private)</Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                  Max 500MB · Only accessible after purchase
                </Typography>
                <input type="file" onChange={(e) => setFullDataFile(e.target.files?.[0] || null)} />
                {fullDataFile && <Typography variant="caption" color="success.main">✓ {fullDataFile.name}</Typography>}
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                disabled={isLoading}
                onClick={handleSubmit}
                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
                sx={{ py: 1.5, fontWeight: 700 }}
              >
                {isLoading ? "Uploading to IPFS & Listing..." : "List Dataset"}
              </Button>
            </Grid>
          </Grid>
        </Container>

        <USDCOptInPrompt
          open={optInOpen}
          onClose={() => setOptInOpen(false)}
          onOptInSuccess={() => { setOptInOpen(false); refreshUser(); }}
        />
      </MainLayout>
    </ProtectedRoute>
  );
}
