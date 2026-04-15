import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enAdmin from "@/locales/en/admin.json";
import enAuth from "@/locales/en/auth.json";
import enBounties from "@/locales/en/bounties.json";
import enCommon from "@/locales/en/common.json";
import enDashboard from "@/locales/en/dashboard.json";
import enDocumentation from "@/locales/en/documentation.json";
import enForms from "@/locales/en/forms.json";
import enLanding from "@/locales/en/landing.json";
import enLegal from "@/locales/en/legal.json";
import enMarketplace from "@/locales/en/marketplace.json";
import enNav from "@/locales/en/nav.json";
import enPageTitles from "@/locales/en/pageTitles.json";
import asAdmin from "@/locales/as/admin.json";
import asAuth from "@/locales/as/auth.json";
import asBounties from "@/locales/as/bounties.json";
import asCommon from "@/locales/as/common.json";
import asDashboard from "@/locales/as/dashboard.json";
import asDocumentation from "@/locales/as/documentation.json";
import asForms from "@/locales/as/forms.json";
import asLanding from "@/locales/as/landing.json";
import asLegal from "@/locales/as/legal.json";
import asMarketplace from "@/locales/as/marketplace.json";
import asNav from "@/locales/as/nav.json";
import asPageTitles from "@/locales/as/pageTitles.json";
import brxAdmin from "@/locales/brx/admin.json";
import brxAuth from "@/locales/brx/auth.json";
import brxBounties from "@/locales/brx/bounties.json";
import brxCommon from "@/locales/brx/common.json";
import brxDashboard from "@/locales/brx/dashboard.json";
import brxDocumentation from "@/locales/brx/documentation.json";
import brxForms from "@/locales/brx/forms.json";
import brxLanding from "@/locales/brx/landing.json";
import brxLegal from "@/locales/brx/legal.json";
import brxMarketplace from "@/locales/brx/marketplace.json";
import brxNav from "@/locales/brx/nav.json";
import brxPageTitles from "@/locales/brx/pageTitles.json";
import doiAdmin from "@/locales/doi/admin.json";
import doiAuth from "@/locales/doi/auth.json";
import doiBounties from "@/locales/doi/bounties.json";
import doiCommon from "@/locales/doi/common.json";
import doiDashboard from "@/locales/doi/dashboard.json";
import doiDocumentation from "@/locales/doi/documentation.json";
import doiForms from "@/locales/doi/forms.json";
import doiLanding from "@/locales/doi/landing.json";
import doiLegal from "@/locales/doi/legal.json";
import doiMarketplace from "@/locales/doi/marketplace.json";
import doiNav from "@/locales/doi/nav.json";
import doiPageTitles from "@/locales/doi/pageTitles.json";
import guAdmin from "@/locales/gu/admin.json";
import guAuth from "@/locales/gu/auth.json";
import guBounties from "@/locales/gu/bounties.json";
import guCommon from "@/locales/gu/common.json";
import guDashboard from "@/locales/gu/dashboard.json";
import guDocumentation from "@/locales/gu/documentation.json";
import guForms from "@/locales/gu/forms.json";
import guLanding from "@/locales/gu/landing.json";
import guLegal from "@/locales/gu/legal.json";
import guMarketplace from "@/locales/gu/marketplace.json";
import guNav from "@/locales/gu/nav.json";
import guPageTitles from "@/locales/gu/pageTitles.json";
import hiAdmin from "@/locales/hi/admin.json";
import hiAuth from "@/locales/hi/auth.json";
import hiBounties from "@/locales/hi/bounties.json";
import hiCommon from "@/locales/hi/common.json";
import hiDashboard from "@/locales/hi/dashboard.json";
import hiDocumentation from "@/locales/hi/documentation.json";
import hiForms from "@/locales/hi/forms.json";
import hiLanding from "@/locales/hi/landing.json";
import hiLegal from "@/locales/hi/legal.json";
import hiMarketplace from "@/locales/hi/marketplace.json";
import hiNav from "@/locales/hi/nav.json";
import hiPageTitles from "@/locales/hi/pageTitles.json";
import knAdmin from "@/locales/kn/admin.json";
import knAuth from "@/locales/kn/auth.json";
import knBounties from "@/locales/kn/bounties.json";
import knCommon from "@/locales/kn/common.json";
import knDashboard from "@/locales/kn/dashboard.json";
import knDocumentation from "@/locales/kn/documentation.json";
import knForms from "@/locales/kn/forms.json";
import knLanding from "@/locales/kn/landing.json";
import knLegal from "@/locales/kn/legal.json";
import knMarketplace from "@/locales/kn/marketplace.json";
import knNav from "@/locales/kn/nav.json";
import knPageTitles from "@/locales/kn/pageTitles.json";
import kokAdmin from "@/locales/kok/admin.json";
import kokAuth from "@/locales/kok/auth.json";
import kokBounties from "@/locales/kok/bounties.json";
import kokCommon from "@/locales/kok/common.json";
import kokDashboard from "@/locales/kok/dashboard.json";
import kokDocumentation from "@/locales/kok/documentation.json";
import kokForms from "@/locales/kok/forms.json";
import kokLanding from "@/locales/kok/landing.json";
import kokLegal from "@/locales/kok/legal.json";
import kokMarketplace from "@/locales/kok/marketplace.json";
import kokNav from "@/locales/kok/nav.json";
import kokPageTitles from "@/locales/kok/pageTitles.json";
import ksAdmin from "@/locales/ks/admin.json";
import ksAuth from "@/locales/ks/auth.json";
import ksBounties from "@/locales/ks/bounties.json";
import ksCommon from "@/locales/ks/common.json";
import ksDashboard from "@/locales/ks/dashboard.json";
import ksDocumentation from "@/locales/ks/documentation.json";
import ksForms from "@/locales/ks/forms.json";
import ksLanding from "@/locales/ks/landing.json";
import ksLegal from "@/locales/ks/legal.json";
import ksMarketplace from "@/locales/ks/marketplace.json";
import ksNav from "@/locales/ks/nav.json";
import ksPageTitles from "@/locales/ks/pageTitles.json";
import maiAdmin from "@/locales/mai/admin.json";
import maiAuth from "@/locales/mai/auth.json";
import maiBounties from "@/locales/mai/bounties.json";
import maiCommon from "@/locales/mai/common.json";
import maiDashboard from "@/locales/mai/dashboard.json";
import maiDocumentation from "@/locales/mai/documentation.json";
import maiForms from "@/locales/mai/forms.json";
import maiLanding from "@/locales/mai/landing.json";
import maiLegal from "@/locales/mai/legal.json";
import maiMarketplace from "@/locales/mai/marketplace.json";
import maiNav from "@/locales/mai/nav.json";
import maiPageTitles from "@/locales/mai/pageTitles.json";
import mlAdmin from "@/locales/ml/admin.json";
import mlAuth from "@/locales/ml/auth.json";
import mlBounties from "@/locales/ml/bounties.json";
import mlCommon from "@/locales/ml/common.json";
import mlDashboard from "@/locales/ml/dashboard.json";
import mlDocumentation from "@/locales/ml/documentation.json";
import mlForms from "@/locales/ml/forms.json";
import mlLanding from "@/locales/ml/landing.json";
import mlLegal from "@/locales/ml/legal.json";
import mlMarketplace from "@/locales/ml/marketplace.json";
import mlNav from "@/locales/ml/nav.json";
import mlPageTitles from "@/locales/ml/pageTitles.json";
import mniAdmin from "@/locales/mni/admin.json";
import mniAuth from "@/locales/mni/auth.json";
import mniBounties from "@/locales/mni/bounties.json";
import mniCommon from "@/locales/mni/common.json";
import mniDashboard from "@/locales/mni/dashboard.json";
import mniDocumentation from "@/locales/mni/documentation.json";
import mniForms from "@/locales/mni/forms.json";
import mniLanding from "@/locales/mni/landing.json";
import mniLegal from "@/locales/mni/legal.json";
import mniMarketplace from "@/locales/mni/marketplace.json";
import mniNav from "@/locales/mni/nav.json";
import mniPageTitles from "@/locales/mni/pageTitles.json";
import mrAdmin from "@/locales/mr/admin.json";
import mrAuth from "@/locales/mr/auth.json";
import mrBounties from "@/locales/mr/bounties.json";
import mrCommon from "@/locales/mr/common.json";
import mrDashboard from "@/locales/mr/dashboard.json";
import mrDocumentation from "@/locales/mr/documentation.json";
import mrForms from "@/locales/mr/forms.json";
import mrLanding from "@/locales/mr/landing.json";
import mrLegal from "@/locales/mr/legal.json";
import mrMarketplace from "@/locales/mr/marketplace.json";
import mrNav from "@/locales/mr/nav.json";
import mrPageTitles from "@/locales/mr/pageTitles.json";
import neAdmin from "@/locales/ne/admin.json";
import neAuth from "@/locales/ne/auth.json";
import neBounties from "@/locales/ne/bounties.json";
import neCommon from "@/locales/ne/common.json";
import neDashboard from "@/locales/ne/dashboard.json";
import neDocumentation from "@/locales/ne/documentation.json";
import neForms from "@/locales/ne/forms.json";
import neLanding from "@/locales/ne/landing.json";
import neLegal from "@/locales/ne/legal.json";
import neMarketplace from "@/locales/ne/marketplace.json";
import neNav from "@/locales/ne/nav.json";
import nePageTitles from "@/locales/ne/pageTitles.json";
import orAdmin from "@/locales/or/admin.json";
import orAuth from "@/locales/or/auth.json";
import orBounties from "@/locales/or/bounties.json";
import orCommon from "@/locales/or/common.json";
import orDashboard from "@/locales/or/dashboard.json";
import orDocumentation from "@/locales/or/documentation.json";
import orForms from "@/locales/or/forms.json";
import orLanding from "@/locales/or/landing.json";
import orLegal from "@/locales/or/legal.json";
import orMarketplace from "@/locales/or/marketplace.json";
import orNav from "@/locales/or/nav.json";
import orPageTitles from "@/locales/or/pageTitles.json";
import paAdmin from "@/locales/pa/admin.json";
import paAuth from "@/locales/pa/auth.json";
import paBounties from "@/locales/pa/bounties.json";
import paCommon from "@/locales/pa/common.json";
import paDashboard from "@/locales/pa/dashboard.json";
import paDocumentation from "@/locales/pa/documentation.json";
import paForms from "@/locales/pa/forms.json";
import paLanding from "@/locales/pa/landing.json";
import paLegal from "@/locales/pa/legal.json";
import paMarketplace from "@/locales/pa/marketplace.json";
import paNav from "@/locales/pa/nav.json";
import paPageTitles from "@/locales/pa/pageTitles.json";
import saAdmin from "@/locales/sa/admin.json";
import saAuth from "@/locales/sa/auth.json";
import saBounties from "@/locales/sa/bounties.json";
import saCommon from "@/locales/sa/common.json";
import saDashboard from "@/locales/sa/dashboard.json";
import saDocumentation from "@/locales/sa/documentation.json";
import saForms from "@/locales/sa/forms.json";
import saLanding from "@/locales/sa/landing.json";
import saLegal from "@/locales/sa/legal.json";
import saMarketplace from "@/locales/sa/marketplace.json";
import saNav from "@/locales/sa/nav.json";
import saPageTitles from "@/locales/sa/pageTitles.json";
import satAdmin from "@/locales/sat/admin.json";
import satAuth from "@/locales/sat/auth.json";
import satBounties from "@/locales/sat/bounties.json";
import satCommon from "@/locales/sat/common.json";
import satDashboard from "@/locales/sat/dashboard.json";
import satDocumentation from "@/locales/sat/documentation.json";
import satForms from "@/locales/sat/forms.json";
import satLanding from "@/locales/sat/landing.json";
import satLegal from "@/locales/sat/legal.json";
import satMarketplace from "@/locales/sat/marketplace.json";
import satNav from "@/locales/sat/nav.json";
import satPageTitles from "@/locales/sat/pageTitles.json";
import sdAdmin from "@/locales/sd/admin.json";
import sdAuth from "@/locales/sd/auth.json";
import sdBounties from "@/locales/sd/bounties.json";
import sdCommon from "@/locales/sd/common.json";
import sdDashboard from "@/locales/sd/dashboard.json";
import sdDocumentation from "@/locales/sd/documentation.json";
import sdForms from "@/locales/sd/forms.json";
import sdLanding from "@/locales/sd/landing.json";
import sdLegal from "@/locales/sd/legal.json";
import sdMarketplace from "@/locales/sd/marketplace.json";
import sdNav from "@/locales/sd/nav.json";
import sdPageTitles from "@/locales/sd/pageTitles.json";
import taAdmin from "@/locales/ta/admin.json";
import taAuth from "@/locales/ta/auth.json";
import taBounties from "@/locales/ta/bounties.json";
import taCommon from "@/locales/ta/common.json";
import taDashboard from "@/locales/ta/dashboard.json";
import taDocumentation from "@/locales/ta/documentation.json";
import taForms from "@/locales/ta/forms.json";
import taLanding from "@/locales/ta/landing.json";
import taLegal from "@/locales/ta/legal.json";
import taMarketplace from "@/locales/ta/marketplace.json";
import taNav from "@/locales/ta/nav.json";
import taPageTitles from "@/locales/ta/pageTitles.json";
import teAdmin from "@/locales/te/admin.json";
import teAuth from "@/locales/te/auth.json";
import teBounties from "@/locales/te/bounties.json";
import teCommon from "@/locales/te/common.json";
import teDashboard from "@/locales/te/dashboard.json";
import teDocumentation from "@/locales/te/documentation.json";
import teForms from "@/locales/te/forms.json";
import teLanding from "@/locales/te/landing.json";
import teLegal from "@/locales/te/legal.json";
import teMarketplace from "@/locales/te/marketplace.json";
import teNav from "@/locales/te/nav.json";
import tePageTitles from "@/locales/te/pageTitles.json";
import urAdmin from "@/locales/ur/admin.json";
import urAuth from "@/locales/ur/auth.json";
import urBounties from "@/locales/ur/bounties.json";
import urCommon from "@/locales/ur/common.json";
import urDashboard from "@/locales/ur/dashboard.json";
import urDocumentation from "@/locales/ur/documentation.json";
import urForms from "@/locales/ur/forms.json";
import urLanding from "@/locales/ur/landing.json";
import urLegal from "@/locales/ur/legal.json";
import urMarketplace from "@/locales/ur/marketplace.json";
import urNav from "@/locales/ur/nav.json";
import urPageTitles from "@/locales/ur/pageTitles.json";

const resources = {
  en: {
    admin: enAdmin,
    auth: enAuth,
    bounties: enBounties,
    common: enCommon,
    dashboard: enDashboard,
    documentation: enDocumentation,
    forms: enForms,
    landing: enLanding,
    legal: enLegal,
    marketplace: enMarketplace,
    nav: enNav,
    pageTitles: enPageTitles,
  },
  as: {
    admin: asAdmin,
    auth: asAuth,
    bounties: asBounties,
    common: asCommon,
    dashboard: asDashboard,
    documentation: asDocumentation,
    forms: asForms,
    landing: asLanding,
    legal: asLegal,
    marketplace: asMarketplace,
    nav: asNav,
    pageTitles: asPageTitles,
  },
  brx: {
    admin: brxAdmin,
    auth: brxAuth,
    bounties: brxBounties,
    common: brxCommon,
    dashboard: brxDashboard,
    documentation: brxDocumentation,
    forms: brxForms,
    landing: brxLanding,
    legal: brxLegal,
    marketplace: brxMarketplace,
    nav: brxNav,
    pageTitles: brxPageTitles,
  },
  doi: {
    admin: doiAdmin,
    auth: doiAuth,
    bounties: doiBounties,
    common: doiCommon,
    dashboard: doiDashboard,
    documentation: doiDocumentation,
    forms: doiForms,
    landing: doiLanding,
    legal: doiLegal,
    marketplace: doiMarketplace,
    nav: doiNav,
    pageTitles: doiPageTitles,
  },
  gu: {
    admin: guAdmin,
    auth: guAuth,
    bounties: guBounties,
    common: guCommon,
    dashboard: guDashboard,
    documentation: guDocumentation,
    forms: guForms,
    landing: guLanding,
    legal: guLegal,
    marketplace: guMarketplace,
    nav: guNav,
    pageTitles: guPageTitles,
  },
  hi: {
    admin: hiAdmin,
    auth: hiAuth,
    bounties: hiBounties,
    common: hiCommon,
    dashboard: hiDashboard,
    documentation: hiDocumentation,
    forms: hiForms,
    landing: hiLanding,
    legal: hiLegal,
    marketplace: hiMarketplace,
    nav: hiNav,
    pageTitles: hiPageTitles,
  },
  kn: {
    admin: knAdmin,
    auth: knAuth,
    bounties: knBounties,
    common: knCommon,
    dashboard: knDashboard,
    documentation: knDocumentation,
    forms: knForms,
    landing: knLanding,
    legal: knLegal,
    marketplace: knMarketplace,
    nav: knNav,
    pageTitles: knPageTitles,
  },
  kok: {
    admin: kokAdmin,
    auth: kokAuth,
    bounties: kokBounties,
    common: kokCommon,
    dashboard: kokDashboard,
    documentation: kokDocumentation,
    forms: kokForms,
    landing: kokLanding,
    legal: kokLegal,
    marketplace: kokMarketplace,
    nav: kokNav,
    pageTitles: kokPageTitles,
  },
  ks: {
    admin: ksAdmin,
    auth: ksAuth,
    bounties: ksBounties,
    common: ksCommon,
    dashboard: ksDashboard,
    documentation: ksDocumentation,
    forms: ksForms,
    landing: ksLanding,
    legal: ksLegal,
    marketplace: ksMarketplace,
    nav: ksNav,
    pageTitles: ksPageTitles,
  },
  mai: {
    admin: maiAdmin,
    auth: maiAuth,
    bounties: maiBounties,
    common: maiCommon,
    dashboard: maiDashboard,
    documentation: maiDocumentation,
    forms: maiForms,
    landing: maiLanding,
    legal: maiLegal,
    marketplace: maiMarketplace,
    nav: maiNav,
    pageTitles: maiPageTitles,
  },
  ml: {
    admin: mlAdmin,
    auth: mlAuth,
    bounties: mlBounties,
    common: mlCommon,
    dashboard: mlDashboard,
    documentation: mlDocumentation,
    forms: mlForms,
    landing: mlLanding,
    legal: mlLegal,
    marketplace: mlMarketplace,
    nav: mlNav,
    pageTitles: mlPageTitles,
  },
  mni: {
    admin: mniAdmin,
    auth: mniAuth,
    bounties: mniBounties,
    common: mniCommon,
    dashboard: mniDashboard,
    documentation: mniDocumentation,
    forms: mniForms,
    landing: mniLanding,
    legal: mniLegal,
    marketplace: mniMarketplace,
    nav: mniNav,
    pageTitles: mniPageTitles,
  },
  mr: {
    admin: mrAdmin,
    auth: mrAuth,
    bounties: mrBounties,
    common: mrCommon,
    dashboard: mrDashboard,
    documentation: mrDocumentation,
    forms: mrForms,
    landing: mrLanding,
    legal: mrLegal,
    marketplace: mrMarketplace,
    nav: mrNav,
    pageTitles: mrPageTitles,
  },
  ne: {
    admin: neAdmin,
    auth: neAuth,
    bounties: neBounties,
    common: neCommon,
    dashboard: neDashboard,
    documentation: neDocumentation,
    forms: neForms,
    landing: neLanding,
    legal: neLegal,
    marketplace: neMarketplace,
    nav: neNav,
    pageTitles: nePageTitles,
  },
  or: {
    admin: orAdmin,
    auth: orAuth,
    bounties: orBounties,
    common: orCommon,
    dashboard: orDashboard,
    documentation: orDocumentation,
    forms: orForms,
    landing: orLanding,
    legal: orLegal,
    marketplace: orMarketplace,
    nav: orNav,
    pageTitles: orPageTitles,
  },
  pa: {
    admin: paAdmin,
    auth: paAuth,
    bounties: paBounties,
    common: paCommon,
    dashboard: paDashboard,
    documentation: paDocumentation,
    forms: paForms,
    landing: paLanding,
    legal: paLegal,
    marketplace: paMarketplace,
    nav: paNav,
    pageTitles: paPageTitles,
  },
  sa: {
    admin: saAdmin,
    auth: saAuth,
    bounties: saBounties,
    common: saCommon,
    dashboard: saDashboard,
    documentation: saDocumentation,
    forms: saForms,
    landing: saLanding,
    legal: saLegal,
    marketplace: saMarketplace,
    nav: saNav,
    pageTitles: saPageTitles,
  },
  sat: {
    admin: satAdmin,
    auth: satAuth,
    bounties: satBounties,
    common: satCommon,
    dashboard: satDashboard,
    documentation: satDocumentation,
    forms: satForms,
    landing: satLanding,
    legal: satLegal,
    marketplace: satMarketplace,
    nav: satNav,
    pageTitles: satPageTitles,
  },
  sd: {
    admin: sdAdmin,
    auth: sdAuth,
    bounties: sdBounties,
    common: sdCommon,
    dashboard: sdDashboard,
    documentation: sdDocumentation,
    forms: sdForms,
    landing: sdLanding,
    legal: sdLegal,
    marketplace: sdMarketplace,
    nav: sdNav,
    pageTitles: sdPageTitles,
  },
  ta: {
    admin: taAdmin,
    auth: taAuth,
    bounties: taBounties,
    common: taCommon,
    dashboard: taDashboard,
    documentation: taDocumentation,
    forms: taForms,
    landing: taLanding,
    legal: taLegal,
    marketplace: taMarketplace,
    nav: taNav,
    pageTitles: taPageTitles,
  },
  te: {
    admin: teAdmin,
    auth: teAuth,
    bounties: teBounties,
    common: teCommon,
    dashboard: teDashboard,
    documentation: teDocumentation,
    forms: teForms,
    landing: teLanding,
    legal: teLegal,
    marketplace: teMarketplace,
    nav: teNav,
    pageTitles: tePageTitles,
  },
  ur: {
    admin: urAdmin,
    auth: urAuth,
    bounties: urBounties,
    common: urCommon,
    dashboard: urDashboard,
    documentation: urDocumentation,
    forms: urForms,
    landing: urLanding,
    legal: urLegal,
    marketplace: urMarketplace,
    nav: urNav,
    pageTitles: urPageTitles,
  },
} as const;

/** Locales that have every namespace file (same set as en). Regenerate with npm run i18n:gen */
export const supportedLngs = ["en", "as", "brx", "doi", "gu", "hi", "kn", "kok", "ks", "mai", "ml", "mni", "mr", "ne", "or", "pa", "sa", "sat", "sd", "ta", "te", "ur"] as const;
export type SupportedLanguage = (typeof supportedLngs)[number];

/** Labels for the language switcher (endonyms where known). */
export const languageDisplayNames = {
  en: "English",
  as: "অসমীয়া",
  brx: "बड़ो",
  doi: "डोगरी",
  gu: "ગુજરાતી",
  hi: "हिन्दी",
  kn: "ಕನ್ನಡ",
  kok: "कोंकणी",
  ks: "کٲشُر",
  mai: "मैथिली",
  ml: "മലയാളം",
  mni: "ꯃꯤꯇꯩꯂꯣꯟ",
  mr: "मराठी",
  ne: "नेपाली",
  or: "ଓଡ଼ିଆ",
  pa: "ਪੰਜਾਬੀ",
  sa: "संस्कृतम्",
  sat: "ᱥᱟᱱᱛᱟᱲᱤ",
  sd: "سنڌي",
  ta: "தமிழ்",
  te: "తెలుగు",
  ur: "اردو",
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
      "documentation",
      "forms",
      "landing",
      "legal",
      "marketplace",
      "nav",
      "pageTitles",
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
