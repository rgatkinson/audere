// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Localization } from "expo-localization";
import i18n from "i18next";
import enStrings from "./locales/en.json";
import enAuStrings from "./locales/en-AU.json";
import esStrings from "./locales/es.json";

const languageDetector = {
  type: "languageDetector",
  async: false,
  detect: () => Localization.locale,
  init: () => {},
  cacheUserLanguage: () => {},
};
i18n.use(languageDetector).init({
  fallbackLng: "en",
  resources: {
    "en-AU": enAuStrings,
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
