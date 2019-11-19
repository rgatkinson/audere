// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import {
  callNumber,
  contactSupport,
  dropOffPackage,
  emailAddress,
  pushNavigate,
} from "./LinkConfig";

export const textActions = {
  PHONE: callNumber,
  EMAIL: emailAddress,
  CONTACTSUPPORT: contactSupport,
  PUSHNAVIGATE: pushNavigate,
  DROPOFFPACKAGE: dropOffPackage,
};
