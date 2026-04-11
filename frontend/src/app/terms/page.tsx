"use client";

import { Container, Typography, Box } from "@mui/material";
import MainLayout from "@/components/layouts/MainLayout";
import { useTranslation } from "react-i18next";

type Section = { title: string; body: string };

export default function TermsPage() {
  const { t } = useTranslation("legal");
  const sections = t("termsSections", { returnObjects: true }) as Section[];

  return (
    <MainLayout>
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography variant="h4" fontWeight={800} gutterBottom>
          {t("termsTitle")}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {t("lastUpdated")}
        </Typography>
        {Array.isArray(sections) &&
          sections.map((s) => (
            <Box key={s.title} sx={{ mb: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                {s.title}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
                {s.body}
              </Typography>
            </Box>
          ))}
      </Container>
    </MainLayout>
  );
}
