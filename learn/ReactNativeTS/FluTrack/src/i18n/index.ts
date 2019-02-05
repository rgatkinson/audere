import { Localization } from "expo-localization";
import i18n from "i18next";
import enStrings from "./locales/en.json";
import esStrings from "./locales/es.json";

const languageDetector = {
  type: "languageDetector",
  async: true,
  detect: () => Localization.locale,
  init: () => {},
  cacheUserLanguage: () => {},
};
i18n.use(languageDetector).init({
  lng: "en",
  fallbackLng: "en",
  resources: {
    en: enStrings,
    es: esStrings,
  },
  ns: ["common"],
  defaultNS: "common",
  interpolation: {
    escapeValue: false,
  },
  react: {
    bindI18n: "languageChanged",
    bindStore: false,
  },
});
export default i18n;
