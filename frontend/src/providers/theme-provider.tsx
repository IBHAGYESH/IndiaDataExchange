"use client";

import React, { createContext, useContext, useMemo, useState, useEffect } from "react";
import {
  ThemeProvider as MuiThemeProvider,
  createTheme,
  CssBaseline,
  PaletteMode,
} from "@mui/material";
import { deepmerge } from "@mui/utils";

type ThemeContextType = {
  mode: PaletteMode;
  toggleTheme: () => void;
};

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useAppTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useAppTheme must be used within ThemeProvider");
  return ctx;
};

const lightPalette = {
  palette: {
    mode: "light" as PaletteMode,
    primary: { main: "#FF6B35" },        // India saffron orange
    secondary: { main: "#138808" },       // India green
    background: { default: "#FFF8F0", paper: "#FFFFFF" },
    text: { primary: "#1A1A1A" },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
  },
};

const darkPalette = {
  palette: {
    mode: "dark" as PaletteMode,
    primary: { main: "#FF8C5A" },
    secondary: { main: "#2EC84F" },
    background: { default: "#0D1117", paper: "#161B22" },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
  },
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setMode] = useState<PaletteMode>("light");

  useEffect(() => {
    const stored = localStorage.getItem("ide_theme") as PaletteMode;
    if (stored) setMode(stored);
  }, []);

  const toggleTheme = () => {
    const newMode = mode === "light" ? "dark" : "light";
    setMode(newMode);
    localStorage.setItem("ide_theme", newMode);
  };

  const theme = useMemo(
    () => createTheme(deepmerge(mode === "light" ? lightPalette : darkPalette, {})),
    [mode]
  );

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
