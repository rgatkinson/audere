// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import crypto from "crypto";
import util from "util";

const randomBytes = util.promisify(crypto.randomBytes);

export async function newCSRUID(): Promise<string> {
  const bytes = await randomBytes(64);
  return bytes.toString("hex");
}
