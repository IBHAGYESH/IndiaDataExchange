"use client";

import { FormControl, Select, MenuItem, SelectChangeEvent } from "@mui/material";
import { useTranslation } from "react-i18next";

import { languageDisplayNames, normalizeLanguage, supportedLngs } from "@/i18n/client";

export default function LanguageSwitcher({ size = "small" }: { size?: "small" | "medium" }) {
  const { i18n, t } = useTranslation("common");

  const handle = (e: SelectChangeEvent<string>) => {
    void i18n.changeLanguage(e.target.value);
  };

  const current = normalizeLanguage(i18n.language);

  return (
    <FormControl size={size} sx={{ minWidth: 110 }}>
      <Select
        value={current}
        onChange={handle}
        variant="outlined"
        sx={{ fontSize: size === "small" ? "0.8rem" : undefined }}
        aria-label={t("language")}
        MenuProps={{ PaperProps: { sx: { maxHeight: 360 } } }}
      >
        {supportedLngs.map((code) => (
          <MenuItem key={code} value={code}>
            {languageDisplayNames[code]}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
