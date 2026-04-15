"use client";

import { Chip, Stack } from "@mui/material";
import { useTranslation } from "react-i18next";
import { formatBytes } from "@/utils";
import { DATASET_FORMAT_ICONS } from "@/constants/datasetFormatDisplay";
import type { DatasetFormat } from "@/types";

type Props = {
  format?: string;
  recordCount?: number;
  sizeBytes?: number;
};

/** Format / records / size row matching marketplace dataset cards. */
export default function SubmissionDataChips({ format, recordCount, sizeBytes }: Props) {
  const { t } = useTranslation("marketplace");
  const fmt = (format || "other") as DatasetFormat;
  const rows = typeof recordCount === "number" && !Number.isNaN(recordCount) ? recordCount : 0;
  const bytes = typeof sizeBytes === "number" && !Number.isNaN(sizeBytes) && sizeBytes >= 0 ? sizeBytes : 0;

  return (
    <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ gap: 0.5, mb: 1.5 }}>
      <Chip
        label={`${DATASET_FORMAT_ICONS[fmt] || "📦"} ${fmt.toUpperCase()}`}
        size="small"
        variant="outlined"
        sx={{ fontSize: "0.7rem", height: 24 }}
      />
      <Chip label={t("rowsCount", { count: rows })} size="small" variant="outlined" sx={{ fontSize: "0.7rem", height: 24 }} />
      <Chip label={formatBytes(bytes)} size="small" variant="outlined" sx={{ fontSize: "0.7rem", height: 24 }} />
    </Stack>
  );
}
