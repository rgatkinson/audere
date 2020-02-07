// Copyright (c) 2020 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Crypt } from "hybrid-crypto-js";

import {
  DataProtectionError,
  DataProtectionPolicy,
  EncryptedObject,
  PolicyActions,
} from "../Types";
import { fetchPublicKeyFromLocal } from "./ClientKeyManagement";

interface ClientPolicyActionParams {
  allowEncryptionWithExpiredKey?: boolean;
}

const defaultClientPolicyActionParams: ClientPolicyActionParams = {
  allowEncryptionWithExpiredKey: false,
};

export class ClientPolicyActions implements PolicyActions {
  private params: ClientPolicyActionParams;

  constructor(params: ClientPolicyActionParams = {}) {
    this.params = defaultClientPolicyActionParams;
    Object.assign(this.params, params);
  }

  // POLICY ACTIONS
  encryptObject(obj: any): EncryptedObject {
    const currentKey = fetchPublicKeyFromLocal();

    if (currentKey === null) {
      throw new DataProtectionError(
        DataProtectionError.Code.NoKey,
        "No current key."
      );
    } else if (currentKey.isExpired()) {
      if (this.params.allowEncryptionWithExpiredKey) {
        // TODO: wire in real logger
        console.warn(`Encrypting with expired key ${currentKey.id}!`);
      } else {
        throw new DataProtectionError(
          DataProtectionError.Code.ExpiredKey,
          `Attempt to encrypt with expired key ${currentKey.id}.`
        );
      }
    }

    const payload = new Crypt().encrypt(currentKey.key, JSON.stringify(obj));
    return {
      keyId: currentKey.id,
      dataProtectionPolicy: DataProtectionPolicy.AlreadyEncrypted,
      payload: payload,
    };
  }
}
