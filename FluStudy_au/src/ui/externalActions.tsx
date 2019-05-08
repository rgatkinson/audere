// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Linking } from "react-native";

const scheduleUSPSUrl = "https://www.usps.com/pickup/";

export function scheduleUSPSPickUp(next: any) {
  Linking.openURL(scheduleUSPSUrl);
  next && next();
}
