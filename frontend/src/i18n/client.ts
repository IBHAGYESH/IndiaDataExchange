import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enAdmin from "@/locales/en/admin.json";
import enAuth from "@/locales/en/auth.json";
import enBounties from "@/locales/en/bounties.json";
import enCommon from "@/locales/en/common.json";
import enDashboard from "@/locales/en/dashboard.json";
import enForms from "@/locales/en/forms.json";
import enLanding from "@/locales/en/landing.json";
import enLegal from "@/locales/en/legal.json";
import enMarketplace from "@/locales/en/marketplace.json";
import enNav from "@/locales/en/nav.json";
import guAdmin from "@/locales/gu/admin.json";
import guAuth from "@/locales/gu/auth.json";
import guBounties from "@/locales/gu/bounties.json";
import guCommon from "@/locales/gu/common.json";
import guDashboard from "@/locales/gu/dashboard.json";
import guForms from "@/locales/gu/forms.json";
import guLanding from "@/locales/gu/landing.json";
import guLegal from "@/locales/gu/legal.json";
import guMarketplace from "@/locales/gu/marketplace.json";
import guNav from "@/locales/gu/nav.json";
import hiAdmin from "@/locales/hi/admin.json";
import hiAuth from "@/locales/hi/auth.json";
import hiBounties from "@/locales/hi/bounties.json";
import hiCommon from "@/locales/hi/common.json";
import hiDashboard from "@/locales/hi/dashboard.json";
import hiForms from "@/locales/hi/forms.json";
import hiLanding from "@/locales/hi/landing.json";
import hiLegal from "@/locales/hi/legal.json";
import hiMarketplace from "@/locales/hi/marketplace.json";
import hiNav from "@/locales/hi/nav.json";
import knAdmin from "@/locales/kn/admin.json";
import knAuth from "@/locales/kn/auth.json";
import knBounties from "@/locales/kn/bounties.json";
import knCommon from "@/locales/kn/common.json";
import knDashboard from "@/locales/kn/dashboard.json";
import knForms from "@/locales/kn/forms.json";
import knLanding from "@/locales/kn/landing.json";
import knLegal from "@/locales/kn/legal.json";
import knMarketplace from "@/locales/kn/marketplace.json";
import knNav from "@/locales/kn/nav.json";

const resources = {
  en: {
    admin: enAdmin,
    auth: enAuth,
    bounties: enBounties,
    common: enCommon,
    dashboard: enDashboard,
    forms: enForms,
    landing: enLanding,
    legal: enLegal,
    marketplace: enMarketplace,
    nav: enNav,
  },
  gu: {
    admin: guAdmin,
    auth: guAuth,
    bounties: guBounties,
    common: guCommon,
    dashboard: guDashboard,
    forms: guForms,
    landing: guLanding,
    legal: guLegal,
    marketplace: guMarketplace,
    nav: guNav,
  },
  hi: {
    admin: hiAdmin,
    auth: hiAuth,
    bounties: hiBounties,
    common: hiCommon,
    dashboard: hiDashboard,
    forms: hiForms,
    landing: hiLanding,
    legal: hiLegal,
    marketplace: hiMarketplace,
    nav: hiNav,
  },
  kn: {
    admin: knAdmin,
    auth: knAuth,
    bounties: knBounties,
    common: knCommon,
    dashboard: knDashboard,
    forms: knForms,
    landing: knLanding,
    legal: knLegal,
    marketplace: knMarketplace,
    nav: knNav,
  },
} as const;

/** Locales that have every namespace file (same set as en). Regenerate with npm run i18n:gen */
export const supportedLngs = ["en", "gu", "hi", "kn"] as const;
export type SupportedLanguage = (typeof supportedLngs)[number];

/** Labels for the language switcher (endonyms where known). */
export const languageDisplayNames = {
  en: "English",
  gu: "ગુજરાતી",
  hi: "हिन्दी",
  kn: "ಕನ್ನಡ",
} as const satisfies Record<SupportedLanguage, string>;

export function normalizeLanguage(tag: string | undefined): SupportedLanguage {
  const base = (tag ?? "en").split("-")[0].toLowerCase();
  if ((supportedLngs as readonly string[]).includes(base)) {
    return base as SupportedLanguage;
  }
  return "en";
}

if (!i18n.isInitialized) {
  i18n.use(LanguageDetector).use(initReactI18next).init({
    resources,
    fallbackLng: "en",
    supportedLngs: [...supportedLngs],
    nonExplicitSupportedLngs: true,
    defaultNS: "common",
    ns: [
      "admin",
      "auth",
      "bounties",
      "common",
      "dashboard",
      "forms",
      "landing",
      "legal",
      "marketplace",
      "nav",
    ],
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "ide_i18n_lang",
    },
    interpolation: { escapeValue: false },
  });
}

export default i18n;
