// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import crypto from "crypto";
import base64url from "base64url";

export async function generateRandomKey(length = 64): Promise<string> {
  const bytes = await generateRandomBytes(Math.ceil((length * 3) / 4));
  return base64url(bytes).substring(0, length);
}

export function generateRandomBytes(numBytes: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(numBytes, (err, buf) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(buf);
    });
  });
}

export function sha256(...values: string[]): string {
  const hash = crypto.createHash("SHA256");
  hash.update([...values].join(" "));
  return hash.digest("hex");
}

// Simplified version of crypto.createHash() that:
// * supports builder pattern by update() returning this.
// * tolerates nulls in update().
// * only generates "hex" digests via toString().
// * supports toString() any number of times.
export class Hash {
  private readonly hash;
  private value: string | null;

  constructor(kind?: string) {
    this.hash = crypto.createHash(kind || "SHA256");
    this.value = null;
  }

  update(x: string | null) {
    this.hash.update(x || "");
    return this;
  }

  toString(): string {
    if (this.value == null) {
      this.value = this.hash.digest("hex");
    }
    return this.value;
  }
}
