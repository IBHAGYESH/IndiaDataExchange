"use client";

import { use, useRef, useEffect, useMemo, useState } from "react";
import {
  Container,
  GridLegacy as Grid,
  Typography,
  Box,
  Chip,
  Stack,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Link as MuiLink,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import MainLayout from "@/components/layouts/MainLayout";
import DatasetPurchaseButton from "@/components/dataset/DatasetPurchaseButton";
import { useGetDatasetQuery, useGetDatasetPurchasesQuery } from "@/redux/api/datasetApi";
import { formatUSDC, truncateAddress, formatBytes, formatDate } from "@/utils";
import { useRouter, useSearchParams } from "next/navigation";
import config from "@/config";
import { useTranslation } from "react-i18next";

export default function DatasetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { t } = useTranslation("marketplace");
  const { t: tCommon } = useTranslation("common");
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const purchaseRef = useRef<HTMLDivElement>(null);
  const { data, isLoading, isError } = useGetDatasetQuery(id);
  const [purchasePage, setPurchasePage] = useState(1);
  const { data: purchasesData, isLoading: purchasesLoading } = useGetDatasetPurchasesQuery(
    { id, page: purchasePage, limit: 10 },
    { skip: isLoading || isError }
  );

  useEffect(() => {
    setPurchasePage(1);
  }, [id]);

  const reportHref = useMemo(() => {
    if (!data?.dataset) return "#";
    const d = data.dataset;
    const subject = t("reportSubject", { id: d._id });
    const body = t("reportBody", { title: d.title, id: d._id });
    return `mailto:${config.reportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, [data?.dataset, t]);

  useEffect(() => {
    if (searchParams.get("purchase") === "true" && data?.dataset && purchaseRef.current) {
      purchaseRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [searchParams, data]);

  if (isLoading) {
    return (
      <MainLayout>
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  if (isError || !data?.dataset) {
    return (
      <MainLayout>
        <Container maxWidth="lg" sx={{ py: 8, textAlign: "center" }}>
          <Typography variant="h5">{t("notFound")}</Typography>
        </Container>
      </MainLayout>
    );
  }

  const { dataset } = data;

  const infoRows = [
    { label: t("formatLabel"), value: dataset.format.toUpperCase() },
    { label: t("records"), value: dataset.recordCount.toLocaleString() },
    { label: t("fileSize"), value: formatBytes(dataset.sizeBytes) },
    { label: t("totalPurchases"), value: dataset.totalPurchases.toString() },
    { label: t("listedOn"), value: formatDate(dataset.createdAt) },
    { label: t("seller"), value: truncateAddress(dataset.sellerWalletAddress) },
  ];

  return (
    <MainLayout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} sx={{ mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push("/marketplace")}
            sx={{ fontWeight: 600 }}
          >
            {t("backToMarketplace")}
          </Button>
          <Button
            component="a"
            href={reportHref}
            startIcon={<FlagOutlinedIcon />}
            size="small"
            variant="outlined"
            color="inherit"
          >
            {tCommon("reportDataset")}
          </Button>
        </Stack>

        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Box sx={{ mb: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Chip label={dataset.category} color="primary" />
              <Chip label={t("formatChipShort", { fmt: dataset.format.toUpperCase() })} variant="outlined" />
              <Chip label={t("rowsCount", { count: dataset.recordCount })} variant="outlined" />
            </Box>

            <Typography variant="h4" fontWeight={800} gutterBottom>
              {dataset.title}
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {dataset.description}
            </Typography>

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
              {dataset.tags.map((tag) => (
                <Chip key={tag} label={`#${tag}`} size="small" sx={{ bgcolor: "background.paper" }} />
              ))}
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" fontWeight={700} gutterBottom>
              {t("datasetInfo")}
            </Typography>
            <Grid container spacing={2}>
              {infoRows.map((item) => (
                <Grid item xs={6} sm={4} key={item.label}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {item.label}
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {item.value}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" fontWeight={700} gutterBottom>
              {t("samplePreview")}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t("sampleBlurb")}
            </Typography>
            <Button
              variant="outlined"
              startIcon={<OpenInNewIcon />}
              href={`${config.pinataGateway}/${dataset.sampleIpfsCid}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("viewSampleFile", { name: dataset.sampleFileName })}
            </Button>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h6" fontWeight={700} gutterBottom>
              {t("recentPurchasesTitle")}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t("recentPurchasesSubtitle")}
            </Typography>

            {purchasesLoading && (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress size={28} />
              </Box>
            )}

            {!purchasesLoading && purchasesData && purchasesData.purchases.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                {t("recentPurchasesEmpty")}
              </Typography>
            )}

            {!purchasesLoading && purchasesData && purchasesData.purchases.length > 0 && (
              <>
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>{t("purchaseColDate")}</TableCell>
                        <TableCell>{t("purchaseColBuyerType")}</TableCell>
                        <TableCell align="right">{t("purchaseColAmount")}</TableCell>
                        <TableCell>{t("purchaseColBuyer")}</TableCell>
                        <TableCell align="right">{t("purchaseColExplorer")}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {purchasesData.purchases.map((row) => (
                        <TableRow key={row.paymentTxId}>
                          <TableCell>{formatDate(row.createdAt)}</TableCell>
                          <TableCell>{row.isHuman ? t("buyerTypeHuman") : t("buyerTypeAgent")}</TableCell>
                          <TableCell align="right">{formatUSDC(row.amountPaidUSDC)}</TableCell>
                          <TableCell>{row.buyerWallet}</TableCell>
                          <TableCell align="right">
                            <MuiLink href={row.explorerTxUrl} target="_blank" rel="noopener noreferrer" variant="body2">
                              {t("viewOnExplorer")}
                            </MuiLink>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {purchasesData.totalPages > 1 && (
                  <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                    <Pagination
                      count={purchasesData.totalPages}
                      page={purchasePage}
                      onChange={(_e, p) => setPurchasePage(p)}
                      color="primary"
                      shape="rounded"
                    />
                  </Box>
                )}
              </>
            )}
          </Grid>

          <Grid item xs={12} md={4}>
            <Card
              ref={purchaseRef}
              elevation={0}
              sx={{
                border: "1px solid",
                borderColor: "primary.main",
                borderRadius: 3,
                position: "sticky",
                top: 80,
              }}
            >
              <CardContent>
                <Typography variant="h4" color="primary" fontWeight={800} gutterBottom>
                  {formatUSDC(dataset.priceUSDC)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {t("oneTimePurchase")}
                </Typography>

                <DatasetPurchaseButton
                  datasetId={dataset._id}
                  priceUSDC={dataset.priceUSDC}
                  sellerWalletAddress={dataset.sellerWalletAddress}
                />

                <Divider sx={{ my: 2 }} />

                <Typography variant="caption" color="text.secondary">
                  {t("paymentNote")}
                </Typography>

                <Box sx={{ mt: 2 }}>
                  <MuiLink
                    href={`https://lora.algokit.io/testnet/account/${dataset.sellerWalletAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="caption"
                    display="block"
                  >
                    {t("viewSellerExplorer")}
                  </MuiLink>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </MainLayout>
  );
}
