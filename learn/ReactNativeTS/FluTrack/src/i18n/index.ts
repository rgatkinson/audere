import i18n from "i18next";
import Expo from "expo";
import enStrings from "./en.json";
import zhStrings from "./zh.json";

const languageDetector = {
  type: "languageDetector",
  async: true,
  detect: callback => {
    return /*'en'; */ Expo.DangerZone.Localization.getCurrentLocaleAsync().then(
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
    zh: zhStrings,
  },
  ns: ["common"],
  defaultNS: "common",
  interpolation: {
    escapeValue: false,
  },
});
export default i18n;
