"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";

type PageTitleKey =
  | "home"
  | "marketplace"
  | "dataset"
  | "bounties"
  | "bounty"
  | "dashboard"
  | "listDataset"
  | "listings"
  | "purchases"
  | "myBounties"
  | "submissions"
  | "postBounty"
  | "account"
  | "docsApi"
  | "docsMcp"
  | "terms"
  | "privacy"
  | "admin"
  | "adminDatasets"
  | "adminBounties";

function titleKeyForPath(pathname: string): PageTitleKey | null {
  if (pathname === "/") return "home";
  if (pathname === "/marketplace") return "marketplace";
  if (/^\/marketplace\/[^/]+$/.test(pathname)) return "dataset";
  if (pathname === "/bounties") return "bounties";
  if (/^\/bounty\/[^/]+$/.test(pathname)) return "bounty";
  if (pathname === "/dashboard" || pathname === "/dashboard/") return "dashboard";
  if (pathname === "/dashboard/list-dataset") return "listDataset";
  if (pathname === "/dashboard/listings") return "listings";
  if (pathname === "/dashboard/purchases") return "purchases";
  if (pathname === "/dashboard/bounties") return "myBounties";
  if (pathname === "/dashboard/submissions") return "submissions";
  if (pathname === "/dashboard/post-bounty") return "postBounty";
  if (pathname === "/dashboard/account") return "account";
  if (pathname === "/docs-api") return "docsApi";
  if (pathname === "/docs-mcp") return "docsMcp";
  if (pathname === "/terms") return "terms";
  if (pathname === "/privacy") return "privacy";
  if (pathname === "/dashboard/admin") return "admin";
  if (pathname === "/dashboard/admin/datasets") return "adminDatasets";
  if (pathname === "/dashboard/admin/bounties") return "adminBounties";
  return null;
}

export default function RouteDocumentTitle() {
  const pathname = usePathname();
  const { t, ready } = useTranslation("pageTitles");

  useEffect(() => {
    if (!ready) return;
    const key = titleKeyForPath(pathname || "/");
    const suffix = t("suffix");
    if (!key) {
      document.title = suffix;
      return;
    }
    document.title = `${t(key)} · ${suffix}`;
  }, [pathname, ready, t]);

  return null;
}
