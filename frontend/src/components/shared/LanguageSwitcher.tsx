"use client";

import { useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import TranslateIcon from "@mui/icons-material/Translate";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import { languageDisplayNames, normalizeLanguage, supportedLngs } from "@/i18n/client";

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation("common");
  const [open, setOpen] = useState(false);

  const current = normalizeLanguage(i18n.language);
  const currentLabel = languageDisplayNames[current];

  const pick = (code: string) => {
    void i18n.changeLanguage(code);
    setOpen(false);
  };

  return (
    <>
      <Tooltip title={`${t("language")}: ${currentLabel}`} enterDelay={400}>
        <IconButton
          onClick={() => setOpen(true)}
          size="small"
          aria-label={`${t("language")}: ${currentLabel}`}
          aria-haspopup="dialog"
          aria-expanded={open}
          sx={{ color: "text.secondary" }}
        >
          <TranslateIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth={false}
        slotProps={{
          backdrop: { sx: { backdropFilter: "blur(4px)" } },
        }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            backgroundImage: "none",
            width: "100%",
            maxWidth: { xs: "calc(100vw - 24px)", sm: 420 },
            m: 1.5,
            maxHeight: "calc(100vh - 24px)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            position: "relative",
            pr: 5,
            py: 1.5,
            flexShrink: 0,
          }}
        >
          <Typography variant="subtitle1" fontWeight={600} component="span">
            {t("language")}
          </Typography>
          <IconButton
            onClick={() => setOpen(false)}
            aria-label={t("cancel")}
            size="small"
            sx={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            pt: 2,
            pb: 2,
            px: 2,
            overflowX: "hidden",
            overflowY: "auto",
            flex: "1 1 auto",
            minHeight: 0,
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, minmax(0, 1fr))",
                sm: "repeat(3, minmax(0, 1fr))",
              },
              gap: 1,
              width: "100%",
              maxWidth: "100%",
              boxSizing: "border-box",
            }}
          >
            {supportedLngs.map((code) => {
              const selected = code === current;
              return (
                <Button
                  key={code}
                  onClick={() => pick(code)}
                  variant={selected ? "contained" : "outlined"}
                  color={selected ? "primary" : "inherit"}
                  sx={{
                    py: 1.25,
                    px: 1,
                    minHeight: 0,
                    minWidth: 0,
                    width: "100%",
                    maxWidth: "100%",
                    borderRadius: 1.5,
                    textTransform: "none",
                    justifyContent: "center",
                    borderColor: selected ? undefined : "divider",
                    fontWeight: selected ? 600 : 500,
                    fontSize: "0.8125rem",
                    lineHeight: 1.35,
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                  }}
                >
                  {languageDisplayNames[code]}
                </Button>
              );
            })}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
