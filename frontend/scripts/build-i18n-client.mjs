/**
 * Regenerates src/i18n/client.ts from folders under src/locales.
 * A language is included only if it contains the same .json files as en/.
 *
 * Usage: node scripts/build-i18n-client.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const LOCALES = path.join(ROOT, "src", "locales");
const OUT = path.join(ROOT, "src", "i18n", "client.ts");

const EN_DIR = path.join(LOCALES, "en");
if (!fs.existsSync(EN_DIR)) {
  console.error("Missing", EN_DIR);
  process.exit(1);
}

const namespaces = fs
  .readdirSync(EN_DIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => f.replace(/\.json$/, ""))
  .sort();

function hasFullLocale(lang) {
  const dir = path.join(LOCALES, lang);
  if (!fs.statSync(dir).isDirectory()) return false;
  return namespaces.every((ns) => fs.existsSync(path.join(dir, `${ns}.json`)));
}

const allDirs = fs
  .readdirSync(LOCALES, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

let languages = allDirs.filter((name) => hasFullLocale(name));
if (!languages.includes("en")) {
  console.error('Locale "en" must exist with all namespace files.');
  process.exit(1);
}
languages = languages.sort((a, b) => {
  if (a === "en") return -1;
  if (b === "en") return 1;
  return a.localeCompare(b);
});

// Endonyms / English names for switcher labels (extend when you add folders)
const DISPLAY_NAMES = {
  en: "English",
  as: "অসমীয়া",
  bn: "বাংলা",
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
};

function displayName(code) {
  return DISPLAY_NAMES[code] ?? code.toUpperCase();
}

function importVar(lang, ns) {
  const cap = ns.charAt(0).toUpperCase() + ns.slice(1);
  return `${lang}${cap}`;
}

const importLines = [];
for (const lang of languages) {
  for (const ns of namespaces) {
    const v = importVar(lang, ns);
    importLines.push(`import ${v} from "@/locales/${lang}/${ns}.json";`);
  }
}

const resourcesInner = languages
  .map((lang) => {
    const pairs = namespaces.map((ns) => `    ${ns}: ${importVar(lang, ns)},`).join("\n");
    return `  ${lang}: {\n${pairs}\n  },`;
  })
  .join("\n");

const displayEntries = languages.map((l) => `  ${l}: ${JSON.stringify(displayName(l))},`).join("\n");

const nsList = namespaces.map((n) => `      "${n}",`).join("\n");

const content = `import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

${importLines.join("\n")}

const resources = {
${resourcesInner}
} as const;

/** Locales that have every namespace file (same set as en). Regenerate with npm run i18n:gen */
export const supportedLngs = [${languages.map((l) => `"${l}"`).join(", ")}] as const;
export type SupportedLanguage = (typeof supportedLngs)[number];

/** Labels for the language switcher (endonyms where known). */
export const languageDisplayNames = {
${displayEntries}
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
${nsList}
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
`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, content, "utf8");
console.log(
  "Wrote",
  path.relative(ROOT, OUT),
  `(${languages.length} languages, ${namespaces.length} namespaces each)`,
);
