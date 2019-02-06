import { Localization } from "expo-localization";
import i18n from "i18next";
import { getResources } from "./LocaleConfig";

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
  resources: getResources(),
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
