"use client";

import { useMemo } from "react";
import { ApiReferenceReact } from "@scalar/api-reference-react";
import "@scalar/api-reference-react/style.css";
import { Box, useTheme } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type { AnyApiReferenceConfiguration } from "@scalar/types/api-reference";

import MainLayout from "@/components/layouts/MainLayout";
import config from "@/config";
import publicAgentSpec from "@/docs/public-agent-openapi.json";

/** Map MUI palette to Scalar CSS variables so /docs matches the rest of IDE. */
function scalarCssFromTheme(theme: Theme) {
  const { palette, typography } = theme;
  const font: string =
    typeof typography.fontFamily === "string"
      ? typography.fontFamily
      : "system-ui, -apple-system, BlinkMacSystemFont, sans-serif";

  return `
    :where(.scalar-app) {
      --scalar-background-1: ${palette.background.default};
      --scalar-background-2: ${palette.background.paper};
      --scalar-background-3: ${palette.action.hover};
      --scalar-color-1: ${palette.text.primary};
      --scalar-color-2: ${palette.text.secondary};
      --scalar-color-3: ${palette.text.disabled};
      --scalar-border-color: ${palette.divider};
      --scalar-color-accent: ${palette.primary.main};
      --scalar-link-color: ${palette.primary.main};
      --scalar-font: ${font};
      --scalar-font-code: ui-monospace, "SF Mono", "Cascadia Code", monospace;
      --scalar-content-max-width: 100%;
      background: ${palette.background.default};
      width: 100%;
      max-width: 100%;
    }
  `;
}

export default function DocsPage() {
  const theme = useTheme();

  const configuration = useMemo((): AnyApiReferenceConfiguration => {
    const base = publicAgentSpec as Record<string, unknown>;
    return {
      content: {
        ...base,
        servers: [
          {
            url: config.apiUrl.replace(/\/$/, ""),
            description: "API",
          },
        ],
      },
      theme: "none",
      customCss: scalarCssFromTheme(theme),
      withDefaultFonts: false,
      _integration: "react",
      hideDarkModeToggle: true,
      darkMode: theme.palette.mode === "dark",
      defaultOpenFirstTag: true,
    };
  }, [theme]);

  return (
    <MainLayout>
      <Box
        sx={{
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          flex: 1,
          py: 2,
          boxSizing: "border-box",
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: "100%",
            minWidth: 0,
            borderTop: 1,
            borderBottom: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
            overflow: "visible",
            "& > div": { width: "100% !important", maxWidth: "100% !important", minWidth: 0 },
          }}
        >
          <ApiReferenceReact configuration={configuration} />
        </Box>
      </Box>
    </MainLayout>
  );
}
