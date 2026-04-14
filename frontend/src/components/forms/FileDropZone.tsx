"use client";

import { useState, useRef } from "react";
import { Box, Typography, IconButton, alpha, useTheme } from "@mui/material";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

export default function FileDropZone({
  label,
  hint,
  file,
  onSelect,
  onClear,
}: {
  label: string;
  hint: string;
  file: File | null;
  onSelect: (f: File) => void;
  onClear: () => void;
}) {
  const theme = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  return (
    <Box
      onClick={() => !file && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onSelect(f);
      }}
      sx={{
        p: 3,
        borderRadius: 3,
        border: `2px dashed ${
          file
            ? alpha("#2EC84F", 0.4)
            : dragOver
              ? alpha(theme.palette.primary.main, 0.4)
              : alpha(theme.palette.divider, 0.15)
        }`,
        bgcolor: file
          ? alpha("#2EC84F", 0.04)
          : dragOver
            ? alpha(theme.palette.primary.main, 0.04)
            : "transparent",
        textAlign: "center",
        cursor: file ? "default" : "pointer",
        transition: "all 0.2s ease",
        ...(!file
          ? {
              "&:hover": {
                borderColor: alpha(theme.palette.primary.main, 0.3),
                bgcolor: alpha(theme.palette.primary.main, 0.02),
              },
            }
          : {}),
      }}
    >
      <input
        ref={inputRef}
        type="file"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onSelect(f);
        }}
      />
      {file ? (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5 }}>
          <CheckCircleOutlineIcon sx={{ color: "#2EC84F", fontSize: 22 }} />
          <Box sx={{ textAlign: "left" }}>
            <Typography variant="body2" fontWeight={600}>
              {file.name}
            </Typography>
            <Typography variant="caption" color="text.disabled">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            sx={{ color: "text.disabled" }}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Box>
      ) : (
        <>
          <InsertDriveFileIcon sx={{ fontSize: 32, color: "text.disabled", mb: 1 }} />
          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
            {label}
          </Typography>
          <Typography variant="caption" color="text.disabled">
            {hint}
          </Typography>
        </>
      )}
    </Box>
  );
}
