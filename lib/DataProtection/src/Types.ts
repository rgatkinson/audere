// Copyright (c) 2020 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

export enum DataProtectionPolicy {
  None = "None",
  MustEncrypt = "MustEncrypt",
  AlreadyEncrypted = "AlreadyEncrypted",
}

export class DataProtectionError {
  constructor(
    readonly code: DataProtectionError.Code,
    readonly message: string = ""
  ) {}

  toString(): string {
    return `DataProtectionError ${this.code}: ${this.message}`;
  }
}

export namespace DataProtectionError {
  export enum Code {
    UnknownDataProtectionPolicy = "UnknownDataProtectionPolicy",
    NoKey = "NoKey",
    ExpiredKey = "ExpiredKey",
  }
}

export interface EncryptedObject {
  keyId: string;
  dataProtectionPolicy: DataProtectionPolicy;
  payload: any;
}

export interface PolicyActions {
  encryptObject?: (any) => EncryptedObject;
  decryptObject?: (EncryptedObject) => any;
}

export interface PublicKey {
  id: string;
  key: string;
  isExpired(): boolean;
}

export interface KeyPair {
  id: string;
  privateKey: string;
  publicKey: string;
  expiryDate?: Date;
}
