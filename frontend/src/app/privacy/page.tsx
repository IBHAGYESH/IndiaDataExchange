"use client";

import { Container, Typography, Box, Link as MuiLink } from "@mui/material";
import MainLayout from "@/components/layouts/MainLayout";
import { useTranslation } from "react-i18next";
import config from "@/config";

type Section = { title: string; body: string };

export default function PrivacyPage() {
  const { t } = useTranslation("legal");
  const sections = t("privacySections", { returnObjects: true }) as Section[];

  return (
    <MainLayout>
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography variant="h4" fontWeight={800} gutterBottom>
          {t("privacyTitle")}
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
        <Box sx={{ mt: 4, p: 2, borderRadius: 2, bgcolor: "action.hover" }}>
          <Typography variant="body2" fontWeight={600} gutterBottom>
            {t("grievanceIntro")}
          </Typography>
          <MuiLink href={`mailto:${config.privacyContactEmail}`}>{config.privacyContactEmail}</MuiLink>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
          {t("languagesNote")}
        </Typography>
      </Container>
    </MainLayout>
  );
}
