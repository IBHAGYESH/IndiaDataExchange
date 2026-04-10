"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";
import {
  ThemeProvider as MuiThemeProvider,
  createTheme,
  CssBaseline,
  PaletteMode,
} from "@mui/material";

type ThemeContextType = {
  mode: PaletteMode;
  toggleTheme: () => void;
};

export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined
);

export const useAppTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useAppTheme must be used within ThemeProvider");
  return ctx;
};

const sharedTypography = {
  fontFamily: '"Inter", "SF Pro Display", -apple-system, sans-serif',
  h1: { fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1 },
  h2: { fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.15 },
  h3: { fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.2 },
  h4: { fontWeight: 700, letterSpacing: "-0.015em", lineHeight: 1.25 },
  h5: { fontWeight: 600, letterSpacing: "-0.01em" },
  h6: { fontWeight: 600, letterSpacing: "-0.005em" },
  button: { fontWeight: 600, textTransform: "none" as const, letterSpacing: "0" },
};

const sharedComponents = {
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        padding: "8px 20px",
        fontSize: "0.875rem",
        boxShadow: "none",
        "&:hover": { boxShadow: "none" },
      },
      sizeLarge: { padding: "12px 28px", fontSize: "1rem" },
      contained: {
        backgroundImage: "linear-gradient(135deg, #FF6B35, #FF8C5A)",
        "&:hover": {
          backgroundImage: "linear-gradient(135deg, #e55a24, #FF6B35)",
        },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 16,
        border: "1px solid",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: { borderRadius: 8, fontWeight: 500 },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        "& .MuiOutlinedInput-root": { borderRadius: 12 },
      },
    },
  },
  MuiSelect: {
    styleOverrides: {
      root: { borderRadius: 12 },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: { borderRadius: 20 },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: { backgroundImage: "none" },
    },
  },
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setMode] = useState<PaletteMode>("dark");

  useEffect(() => {
    const stored = localStorage.getItem("ide_theme") as PaletteMode;
    if (stored) setMode(stored);
  }, []);

  const toggleTheme = () => {
    const newMode = mode === "light" ? "dark" : "light";
    setMode(newMode);
    localStorage.setItem("ide_theme", newMode);
  };

  const theme = useMemo(() => {
    const isLight = mode === "light";
    return createTheme({
      palette: {
        mode,
        primary: { main: "#FF6B35", light: "#FF8C5A", dark: "#E05520" },
        secondary: { main: isLight ? "#138808" : "#2EC84F", light: "#4ADE7B" },
        background: {
          default: isLight ? "#FAFAF8" : "#09090B",
          paper: isLight ? "#FFFFFF" : "#111113",
        },
        text: {
          primary: isLight ? "#0C0C0D" : "#FAFAFA",
          secondary: isLight ? "#64748B" : "#A1A1AA",
        },
        divider: isLight
          ? "rgba(0, 0, 0, 0.06)"
          : "rgba(255, 255, 255, 0.06)",
      },
      typography: sharedTypography,
      shape: { borderRadius: 12 },
      components: {
        ...sharedComponents,
        MuiCard: {
          styleOverrides: {
            root: {
              ...(sharedComponents.MuiCard.styleOverrides.root as object),
              borderColor: isLight
                ? "rgba(0, 0, 0, 0.06)"
                : "rgba(255, 255, 255, 0.06)",
              backgroundColor: isLight ? "#FFFFFF" : "#111113",
              "&:hover": {
                borderColor: "#FF6B35",
                transform: "translateY(-4px)",
                boxShadow: isLight
                  ? "0 20px 40px -12px rgba(255, 107, 53, 0.15)"
                  : "0 20px 40px -12px rgba(255, 107, 53, 0.2)",
              },
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            ...(sharedComponents.MuiButton.styleOverrides as object),
            contained: {
              ...(sharedComponents.MuiButton.styleOverrides.contained as object),
              color: "#fff",
            },
          },
        },
      },
    });
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
