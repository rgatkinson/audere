// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { NativeModules } from "react-native";
import i18n from "i18next";
import enStrings from "./locales/en.json";
import frStrings from "./locales/fr.json";
import { format } from "date-fns";

const languageDetector = {
  type: "languageDetector",
  async: false,
  detect: () => NativeModules.I18nManager.localeIdentifier.substring(0, 2),
  init: () => {},
  cacheUserLanguage: () => {},
};
i18n.use(languageDetector).init({
  fallbackLng: ["en"],
  resources: {
    en: enStrings,
    fr: frStrings,
  },
  ns: ["common"],
  defaultNS: "common",
  interpolation: {
    escapeValue: false,
    format: function(value, frmt, lng) {
      if (value instanceof Date) {
        return format(value, frmt);
      }
      return value;
    },
  },
  react: {
    bindI18n: "languageChanged",
    bindStore: false,
  },
});
export default i18n;
