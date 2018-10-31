import i18n from "i18next";
import Expo from "expo";
import enStrings from "./en.json";
import esStrings from "./es.json";

const languageDetector = {
  type: "languageDetector",
  async: true,
  detect: (callback: any) => {
    return Expo.DangerZone.Localization.getCurrentLocaleAsync().then(
      (lng: string) => {
        callback(lng.replace("_", "-"));
      }
    );
  },
  init: () => {},
  cacheUserLanguage: () => {},
};
i18n.use(languageDetector).init({
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
