// Copyright (c) 2020 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Crypt } from "hybrid-crypto-js";

import {
  EncryptedObject,
  KeyPair,
  PolicyActions,
} from "../Types";
import { fetchKeyPair } from "./ServerKeyManagement";

export class ServerPolicyActions implements PolicyActions {
  private keyPairs = {};

  private getPrivateKey(keyId: string): KeyPair {
    if (!(keyId in this.keyPairs)) {
      this.keyPairs[keyId] = fetchKeyPair(keyId);
    }

    return this.keyPairs[keyId].privateKey;
  }

  // POLICY ACTIONS
  decryptObject(encryptedObj: EncryptedObject) {
    return JSON.parse(
      new Crypt().decrypt(
        this.getPrivateKey(encryptedObj.keyId),
        encryptedObj.payload
      ).message
    );
  }
}
