// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import strings from "../../src/i18n/locales/en.json";

export const content = [
  {
    type: "basic",
    title: strings.Welcome.title,
    button: {
      name: strings.common.button.next.toUpperCase(),
      onClick: "EnterInformation",
    },
    key: "Welcome",
  },
  {
    type: "basic",
    title: strings.EnterInformation.title,
    button: {
      name: strings.common.button.next.toUpperCase(),
    },
    key: "EnterInformation",
  },
];
