// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Secrets } from "../models/secrets";

export async function getSecret(key: string): Promise<string> {
  // First check process environment variables.
  const envVar = process.env[key];

  if (envVar != null) {
    return envVar;
  } else {
    // Fallback to the database.
    const s = await Secrets.find({
      where: {
        key: key
      }
    });

    if (s == null) {
      throw Error("No value found for secret: " + key);
    }

    return s.value;
  }
}