// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import {
  barcodeScan,
  callForPickup,
  callNumber,
  contactSupport,
  dropOffPackage,
  websiteForPickup,
} from "./LinkConfig";

export const textActions = {
  PHONE: callNumber,
  CONTACTSUPPORT: contactSupport,
  BARCODESCAN: barcodeScan,
  CALLFORPICKUP: callForPickup,
  WEBSITEFORPICKUP: websiteForPickup,
  DROPOFFPACKAGE: dropOffPackage,
};
