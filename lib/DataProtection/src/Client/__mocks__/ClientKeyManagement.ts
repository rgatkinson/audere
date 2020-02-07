// Copyright (c) 2020 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import * as Remote from "../../Server/__mocks__/ServerKeyManagement";
import { DataProtectionError, PublicKey } from "../../Types";

let storedLocalKey: PublicKey = null;

export function fetchPublicKeyFromLocal(): PublicKey {
  return storedLocalKey;
}

function fetchPublicKeyFromRemote(): PublicKey {
  Remote.ensureCurrentKeyPair();
  const keyPair = Remote.fetchKeyPair("ignored");

  return {
    id: keyPair.id,
    key: keyPair.publicKey,
    isExpired: () => false,
  };
}

function storePublicKeyToLocal(key: PublicKey): void {
  storedLocalKey = key;
}

// I don't seem to be clever enough to figure out a way to reference
// the non-mock ensureCurrentLocalKey and have it use the mock
// fetch/store functions defined above, so I've just copied and pasted
// the whole thing here. :(
export function ensureCurrentLocalKey(): void {
  const localKey = fetchPublicKeyFromLocal();
  if (localKey === null || localKey.isExpired()) {
    const remoteKey = fetchPublicKeyFromRemote();
    if (remoteKey !== null) {
      storePublicKeyToLocal(remoteKey);
    } else {
      throw new DataProtectionError(
        DataProtectionError.Code.NoKey,
        "Could not ensure current local key."
      );
    }
  }
}
