"use client";

import { FormControl, Select, MenuItem, SelectChangeEvent } from "@mui/material";
import { useTranslation } from "react-i18next";

export default function LanguageSwitcher({ size = "small" }: { size?: "small" | "medium" }) {
  const { i18n, t } = useTranslation("common");

  const handle = (e: SelectChangeEvent<string>) => {
    void i18n.changeLanguage(e.target.value);
  };

  return (
    <FormControl size={size} sx={{ minWidth: 110 }}>
      <Select
        value={i18n.language?.startsWith("hi") ? "hi" : "en"}
        onChange={handle}
        variant="outlined"
        sx={{ fontSize: size === "small" ? "0.8rem" : undefined }}
        aria-label={t("language")}
      >
        <MenuItem value="en">{t("english")}</MenuItem>
        <MenuItem value="hi">{t("hindi")}</MenuItem>
      </Select>
    </FormControl>
  );
}
