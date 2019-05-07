// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import enStrings from "./locales/en.json";
import esStrings from "./locales/es.json";

export const LocaleConfig: {
  [index: string]: {
    languageName: string;
    resources: object;
    dateLocale: any;
    monthFormat: string; // How to display month+year in this language
    dateFormat: string; // How to display date in this language
  };
} = {
  en: {
    languageName: "English",
    resources: require("./locales/en.json"),
    dateLocale: require("date-fns/locale/en"),
    monthFormat: "MMMM YYYY",
    dateFormat: "MMMM D, YYYY",
  },
  es: {
    languageName: "Espanol",
    resources: esStrings,
    dateLocale: require("date-fns/locale/es"),
    monthFormat: "MMMM [de] YYYY",
    dateFormat: "D [de] MMMM [de] YYYY",
  },
};

export function getResources() {
  let res: { [index: string]: object } = {};
  for (const lang in LocaleConfig) {
    res[lang] = LocaleConfig[lang].resources;
  }
  return res;
}
