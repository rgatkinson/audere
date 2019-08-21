// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import uuidv4 from "uuid/v4";
import Constants from "expo-constants";

export async function newUID(): Promise<string> {
  // The UUID is first because in de-identified contexts we use the first 21
  // characters of UIDs as a short identifier for the record.
  //
  // Adding an installationId suffix can help identify where a unique id came
  // from.  (e.g. it could simplify querying all items that originated from a
  // particular device for tech support).
  return `${uuidv4()}.${Constants.installationId}`;
}
