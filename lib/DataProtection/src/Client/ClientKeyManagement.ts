// Copyright (c) 2020 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { DataProtectionError, PublicKey } from "../Types";

export function fetchPublicKeyFromLocal(): PublicKey {
  throw new Error("not yet implemented");
}

function fetchPublicKeyFromRemote(): PublicKey {
  throw new Error("not yet implemented");
}

function storePublicKeyToLocal(key: PublicKey): void {
  throw new Error("not yet implemented");
}

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
