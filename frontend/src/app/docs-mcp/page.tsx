"use client";

import {
  Box,
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  alpha,
  useTheme,
  Link as MuiLink,
} from "@mui/material";
import Link from "next/link";
import MainLayout from "@/components/layouts/MainLayout";
import { useTranslation } from "react-i18next";

export default function DocsMcpPage() {
  const theme = useTheme();
  const { t } = useTranslation("documentation");

  const listParams = [
    { name: "limit", type: "number (int)", req: t("mcpParamOptional"), note: t("mcpListLimitNote") },
    { name: "page", type: "number (int)", req: t("mcpParamOptional"), note: t("mcpListPageNote") },
    { name: "search", type: "string", req: t("mcpParamOptional"), note: "" },
    { name: "category", type: "string", req: t("mcpParamOptional"), note: "" },
    { name: "tags", type: "string", req: t("mcpParamOptional"), note: t("mcpTagsNote") },
    { name: "format", type: "string", req: t("mcpParamOptional"), note: "" },
    { name: "minPrice", type: "string", req: t("mcpParamOptional"), note: "" },
    { name: "maxPrice", type: "string", req: t("mcpParamOptional"), note: "" },
    { name: "sortBy", type: "string", req: t("mcpParamOptional"), note: t("mcpSortByNote") },
    { name: "sortOrder", type: "string", req: t("mcpParamOptional"), note: t("mcpSortOrderNote") },
  ];

  return (
    <MainLayout>
      <Box
        sx={{
          py: { xs: 3, md: 5 },
          background: `linear-gradient(180deg, ${alpha(theme.palette.secondary.main, 0.04)} 0%, transparent 45%)`,
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: "-0.02em", mb: 1 }}>
            {t("mcpPageTitle")}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
            {t("mcpPageSubtitle")}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t("mcpEnvNote")}{" "}
            <Box component="code" sx={{ bgcolor: "action.hover", px: 0.75, py: 0.25, borderRadius: 1, fontSize: "0.85em" }}>
              IDE_API_BASE_URL
            </Box>
            . {t("mcpSeeAlso")}{" "}
            <MuiLink component={Link} href="/docs-api">
              {t("mcpApiDocsLink")}
            </MuiLink>
            .
          </Typography>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              {t("mcpToolListTitle")}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t("mcpToolListDesc")}
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>{t("mcpColParameter")}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t("mcpColType")}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t("mcpColRequired")}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t("mcpColNotes")}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {listParams.map((row) => (
                    <TableRow key={row.name}>
                      <TableCell>
                        <Box component="code" sx={{ fontSize: "0.85rem" }}>
                          {row.name}
                        </Box>
                      </TableCell>
                      <TableCell>{row.type}</TableCell>
                      <TableCell>{row.req}</TableCell>
                      <TableCell>{row.note}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
              {t("mcpToolListReturn")}
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              {t("mcpToolGetTitle")}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t("mcpToolGetDesc")}
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>{t("mcpColParameter")}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t("mcpColType")}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t("mcpColRequired")}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t("mcpColNotes")}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <Box component="code" sx={{ fontSize: "0.85rem" }}>
                        datasetId
                      </Box>
                    </TableCell>
                    <TableCell>string</TableCell>
                    <TableCell>{t("mcpParamRequired")}</TableCell>
                    <TableCell>{t("mcpDatasetIdNote")}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
              {t("mcpToolGetReturn")}
            </Typography>
          </Box>
        </Container>
      </Box>
    </MainLayout>
  );
}
