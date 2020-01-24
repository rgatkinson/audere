// Copyright (c) 2020 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { TextEncoder, TextDecoder } from "util";

export enum EncryptionPolicy {
  None = "None",
  MustEncrypt = "MustEncrypt",
  AlreadyEncrypted = "AlreadyEncrypted",
}

export class EncryptionError {
  constructor(
    readonly code: EncryptionError.Code,
    readonly message: string = ""
  ) {}
}

export namespace EncryptionError {
  export enum Code {
    NoKey,
    KeyExpired,
    UnknownEncryptionPolicy,
  }
}

export interface Key {
  id: string;
  isExpired(): boolean;
}

export const CURRENT_KEY: unique symbol = Symbol("Current Key");
export const NEW_KEY: unique symbol = Symbol("New Key");

export function ensureCurrentKey(
  forceRenewalEvenIfUnexpired: boolean = false
): void {
  const currentKey = getKey(CURRENT_KEY);
  if (
    currentKey === null ||
    currentKey.isExpired() ||
    forceRenewalEvenIfUnexpired
  ) {
    const newKey = fetchKey(NEW_KEY);
    if (newKey !== null) {
      setCurrentKey(newKey);
    }
  }
}

export function applyEncryptionPolicy(
  root: any,
  allowExpiredKey: boolean = false
): any {
  const currentKey = getKey(CURRENT_KEY);
  if (currentKey === null) {
    throw new EncryptionError(EncryptionError.Code.NoKey, "No current key.");
  }

  if (currentKey.isExpired()) {
    if (allowExpiredKey) {
      // TODO: plug in real logger
      console.warn(
        `Applying encryption policy using expired key ${currentKey.id}.`
      );
    } else {
      throw new EncryptionError(
        EncryptionError.Code.KeyExpired,
        "Cannot apply encryption policy with expired key."
      );
    }
  }

  function visit(obj: any): any {
    if (obj === null || typeof obj !== "object") {
      return obj;
    } else if (obj instanceof Array) {
      return obj.map(e => visit(e));
    }

    const policy = obj.encryptionPolicy || EncryptionPolicy.None;
    switch (policy) {
      case EncryptionPolicy.None: {
        // Go to a little trouble here to make full deep copies of
        // fields.
        let copy = {};
        for (let k in obj) {
          copy[k] = visit(obj[k]);
        }
        return copy;
      }

      case EncryptionPolicy.MustEncrypt: {
        return encryptObject(obj, currentKey as Key);
      }

      // For the sake of idempotency, we expect
      // already-encrypted objects to have been marked as such,
      // and we recurse on them no further. Note that
      // idempotency allows us to apply an encryption policy
      // even to a "partially constructed" object. This could be
      // useful if we need to save and resume as the app fills
      // out a complete record.
      case EncryptionPolicy.AlreadyEncrypted: {
        // Note this is the one place where we are not making a deep
        // copy of a subobject of the record being encrypted, on the
        // theory that there's no good reason to ever mutate the
        // subobject... Famous last words, I know.
        return Object.assign({}, obj);
      }

      default: {
        throw new EncryptionError(
          EncryptionError.Code.UnknownEncryptionPolicy,
          `Unknown or unimplemented encryption policy '${policy}'.`
        );
      }
    }
  }

  return visit(root);
}

export function unapplyEncryptionPolicy(root: any): any {
  if (root === null || typeof root !== "object") {
    return root;
  } else if (root instanceof Array) {
    return root.map(e => unapplyEncryptionPolicy(e));
  }

  function visitChildren(parent: any): any {
    let copy = {};
    for (let k in parent) {
      copy[k] = unapplyEncryptionPolicy(parent[k]);
    }
    return copy;
  }

  const policy = root.encryptionPolicy || EncryptionPolicy.None;
  switch (policy) {
    case EncryptionPolicy.None: {
      return visitChildren(root);
    }

    case EncryptionPolicy.MustEncrypt: {
      return visitChildren(root);
    }

    case EncryptionPolicy.AlreadyEncrypted: {
      return visitChildren(decryptObject(root));
    }

    default: {
      throw new EncryptionError(
        EncryptionError.Code.UnknownEncryptionPolicy,
        `Unknown or unimplemented encryption policy '${policy}'.`
      );
    }
  }
}

function getKey(keyId: string | typeof CURRENT_KEY = CURRENT_KEY): Key | null {
  return { id: "abcde29", isExpired: () => false };
}

function fetchKey(keyId: string | typeof NEW_KEY = NEW_KEY): Key | null {
  return { id: "abcde29", isExpired: () => false };
}

function setCurrentKey(key: Key): void {
  // TODO
}

function encryptObject(
  obj: any,
  key: Key
): {
  encryptionPolicy: EncryptionPolicy;
  keyId: string;
  payload: Array<number>;
} {
  return {
    encryptionPolicy: EncryptionPolicy.AlreadyEncrypted,
    keyId: key.id,
    payload: Array.from(new TextEncoder().encode(JSON.stringify(obj))),
  };
}

function decryptObject(obj: any): object {
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(obj.payload)));
}

// Should be used exclusively for testing.
export const VisibleForTesting = {
  getKey: getKey,
  encryptObject: encryptObject,
  decryptObject: decryptObject,
};
