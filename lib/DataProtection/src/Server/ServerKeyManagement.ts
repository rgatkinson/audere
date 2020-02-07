// Copyright (c) 2020 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { RSA } from "hybrid-crypto-js";
import { KeyPair } from "../Types";

function generateKeyPair(expiryDate?: Date): KeyPair {
  const keyPair = {
    id: null,
    privateKey: null,
    publicKey: null,
    expiryDate: expiryDate,
  };

  new RSA().generateKeyPair(function(kp) {
    keyPair.publicKey = kp.publicKey;
    keyPair.privateKey = kp.privateKey;
  });

  return keyPair;
}

// Write key pair to permanent storage, returning copy but with id
// set.
function storeKeyPair(keyPair: KeyPair): KeyPair {
  throw new Error("not yet implemented");
}

export function fetchKeyPair(keyId: string): KeyPair {
  throw new Error("not yet implemented");
}

// Fetch all unexpired key pairs from permanent storage, ordering them
// from farthest-off *finite* expiry to nearest; then by *infinite*,
// i.e. no, expiry date. Pass limit=1 to get only the most current key
// pair.
function fetchCurrentKeyPairs(limit?: number): KeyPair[] {
  throw new Error("not yet implemented");
}

// TODO: Add expiryDate parameter
export function ensureCurrentKeyPair(): void {
  // The following lookups and stores should probably all be part of a
  // single transaction, but no one will die if they aren't...
  const currentKeyPairs = fetchCurrentKeyPairs();
  if (currentKeyPairs.length == 0) {
    const newKeyPair = generateKeyPair();
    storeKeyPair(newKeyPair);
  }
}
