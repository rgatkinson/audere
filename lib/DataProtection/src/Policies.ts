// Copyright (c) 2020 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Crypt } from "hybrid-crypto-js";

import {
  DataProtectionPolicy,
  DataProtectionError,
  EncryptedObject,
  PolicyActions,
} from "./Types";

export function applyDataProtectionPolicy(
  policyActions: PolicyActions,
  root: any
): any {
  function visit(obj: any): any {
    if (obj === null || typeof obj !== "object") {
      return obj;
    } else if (obj instanceof Array) {
      return obj.map(e => visit(e));
    }

    const policy = obj.dataProtectionPolicy || DataProtectionPolicy.None;
    switch (policy) {
      case DataProtectionPolicy.None: {
        // Go to a little trouble here to make full deep copies of
        // fields.
        let copy = {};
        for (let k in obj) {
          copy[k] = visit(obj[k]);
        }
        return copy;
      }

      case DataProtectionPolicy.MustEncrypt: {
        return policyActions.encryptObject(obj);
      }

      // For the sake of idempotency, we expect
      // already-encrypted objects to have been marked as such,
      // and we recurse on them no further. Note that
      // idempotency allows us to apply an encryption policy
      // even to a "partially constructed" object. This could be
      // useful if we need to save and resume as the app fills
      // out a complete record.
      case DataProtectionPolicy.AlreadyEncrypted: {
        // Note this is the one place where we are not making a deep
        // copy of a subobject of the record being encrypted, on the
        // theory that there's no good reason to ever mutate the
        // subobject... Famous last words, I know.
        return Object.assign({}, obj);
      }

      default: {
        throw new DataProtectionError(
          DataProtectionError.Code.UnknownDataProtectionPolicy,
          `Unknown or unimplemented data protection policy '${policy}'.`
        );
      }
    }
  }

  return visit(root);
}

export function unapplyDataProtectionPolicy(
  policyActions: PolicyActions,
  root: any
): any {
  if (root === null || typeof root !== "object") {
    return root;
  } else if (root instanceof Array) {
    return root.map(e => unapplyDataProtectionPolicy(policyActions, e));
  }

  function visitChildren(parent: any): any {
    let copy = {};
    for (let k in parent) {
      copy[k] = unapplyDataProtectionPolicy(policyActions, parent[k]);
    }
    return copy;
  }

  const policy = root.dataProtectionPolicy || DataProtectionPolicy.None;
  switch (policy) {
    case DataProtectionPolicy.None: {
      return visitChildren(root);
    }

    case DataProtectionPolicy.MustEncrypt: {
      return visitChildren(root);
    }

    case DataProtectionPolicy.AlreadyEncrypted: {
      return visitChildren(policyActions.decryptObject(root));
    }

    default: {
      throw new DataProtectionError(
        DataProtectionError.Code.UnknownDataProtectionPolicy,
        `Unknown or unimplemented data protection policy '${policy}'.`
      );
    }
  }
}
