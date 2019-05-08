// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

// TODO - needs to be cryptographically secure
import uuidv4 from "uuid/v4";

export async function newCSRUID(): Promise<string> {
  return uuidv4();
}
