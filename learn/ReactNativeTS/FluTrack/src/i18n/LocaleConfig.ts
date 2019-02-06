import enStrings from "./locales/en.json";
import esStrings from "./locales/es.json";

export const LocaleConfig: {
  [index: string]: {
    languageName: string;
    resources: object;
    dateLocale: any;
    monthFormat: string; // How to display month+year in this language
  };
} = {
  en: {
    languageName: "English",
    resources: require("./locales/en.json"),
    dateLocale: require("date-fns/locale/en"),
    monthFormat: "MMMM YYYY",
  },
  es: {
    languageName: "Espanol",
    resources: esStrings,
    dateLocale: require("date-fns/locale/es"),
    monthFormat: "MMMM [de] YYYY",
  },
};

export function getResources() {
  let res: { [index: string]: object } = {};
  for (const lang in LocaleConfig) {
    res[lang] = LocaleConfig[lang].resources;
  }
  return res;
}
