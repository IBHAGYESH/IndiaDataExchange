import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enCommon from "@/locales/en/common.json";
import enNav from "@/locales/en/nav.json";
import enAuth from "@/locales/en/auth.json";
import enLegal from "@/locales/en/legal.json";
import enLanding from "@/locales/en/landing.json";
import enDashboard from "@/locales/en/dashboard.json";
import enMarketplace from "@/locales/en/marketplace.json";
import enBounties from "@/locales/en/bounties.json";
import enForms from "@/locales/en/forms.json";
import enAdmin from "@/locales/en/admin.json";

import hiCommon from "@/locales/hi/common.json";
import hiNav from "@/locales/hi/nav.json";
import hiAuth from "@/locales/hi/auth.json";
import hiLegal from "@/locales/hi/legal.json";
import hiLanding from "@/locales/hi/landing.json";
import hiDashboard from "@/locales/hi/dashboard.json";
import hiMarketplace from "@/locales/hi/marketplace.json";
import hiBounties from "@/locales/hi/bounties.json";
import hiForms from "@/locales/hi/forms.json";
import hiAdmin from "@/locales/hi/admin.json";

const resources = {
  en: {
    common: enCommon,
    nav: enNav,
    auth: enAuth,
    legal: enLegal,
    landing: enLanding,
    dashboard: enDashboard,
    marketplace: enMarketplace,
    bounties: enBounties,
    forms: enForms,
    admin: enAdmin,
  },
  hi: {
    common: hiCommon,
    nav: hiNav,
    auth: hiAuth,
    legal: hiLegal,
    landing: hiLanding,
    dashboard: hiDashboard,
    marketplace: hiMarketplace,
    bounties: hiBounties,
    forms: hiForms,
    admin: hiAdmin,
  },
} as const;

if (!i18n.isInitialized) {
  i18n.use(LanguageDetector).use(initReactI18next).init({
    resources,
    fallbackLng: "en",
    supportedLngs: ["en", "hi"],
    defaultNS: "common",
    ns: [
      "common",
      "nav",
      "auth",
      "legal",
      "landing",
      "dashboard",
      "marketplace",
      "bounties",
      "forms",
      "admin",
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
