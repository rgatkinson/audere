// Copyright (c) 2020 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

jest.mock("../src/Server/ServerKeyManagement");
jest.mock("../src/Client/ClientKeyManagement");
import {
  fetchPublicKeyFromLocal,
  ensureCurrentLocalKey,
} from "../src/Client/ClientKeyManagement";
import { fetchKeyPair } from "../src/Server/ServerKeyManagement";
import { ClientPolicyActions } from "../src/Client/ClientPolicies";
import { ServerPolicyActions } from "../src/Server/ServerPolicies";
import {
  applyDataProtectionPolicy,
  unapplyDataProtectionPolicy,
} from "../src/Policies";
import {
  DataProtectionPolicy,
  PolicyActions,
  EncryptedObject,
} from "../src/Types";

const clientPolicyActions: PolicyActions = new ClientPolicyActions();
const serverPolicyActions: PolicyActions = new ServerPolicyActions();

test("unapplyDataProtectionPolicy() should handle nulls and non-object types gracefully.", () => {
  for (let x of [null, 1, true, "foo", Symbol(29), [1, 2, 3, { a: 1 }]]) {
    expect(unapplyDataProtectionPolicy(serverPolicyActions, x)).toStrictEqual(
      x
    );
  }
});

test("ensureCurrentLocalKey() results in non-expired local key", () => {
  expect(fetchPublicKeyFromLocal()).toBe(null);
  ensureCurrentLocalKey();
  const key = fetchPublicKeyFromLocal();
  expect(key.key).not.toBe(null);
  expect(key.isExpired()).toBe(false);
  const remoteKey = fetchKeyPair("ignored");
  expect(remoteKey.publicKey).toBe(key.key);
});

describe("Tests requiring encryption", () => {
  beforeAll(() => {
    ensureCurrentLocalKey();
    const key = fetchPublicKeyFromLocal();
  });

  test("applyDataProtectionPolicy() should deep copy objects (apart from those already encrypted).", () => {
    {
      let obj: any = { a: { b: [1, 2, 3] } };
      const newObj = applyDataProtectionPolicy(clientPolicyActions, obj);
      obj.a.b.push(4);
      newObj.a.b.push(5);
      expect(newObj.a.b).not.toStrictEqual(obj.a.b);
    }

    {
      let obj: any = applyDataProtectionPolicy(clientPolicyActions, {
        a: {
          dataProtectionPolicy: DataProtectionPolicy.MustEncrypt,
          b: {
            c: [1, 2, 3],
            d: "foo",
          },
        },
      });
      const newObj = applyDataProtectionPolicy(clientPolicyActions, obj);
      expect(newObj.a.b).toBe(obj.a.b);
    }
  });

  test("unapplyDataProtectionPolicy() should deep copy objects.", () => {
    let obj: any = applyDataProtectionPolicy(clientPolicyActions, {
      a: {
        dataProtectionPolicy: DataProtectionPolicy.MustEncrypt,
        b: {
          c: [1, 2, 3],
          d: "foo",
        },
      },
    });
    const newObj1 = unapplyDataProtectionPolicy(serverPolicyActions, obj);
    const newObj2 = unapplyDataProtectionPolicy(serverPolicyActions, obj);
    expect(newObj1.a).toStrictEqual(newObj2.a);
    expect(newObj1.a).not.toBe(newObj2.a);
  });

  test("unapplyDataProtectionPolicy() inverse of applyDataProtectionPolicy() (encrypting from root).", () => {
    const obj: any = {
      dataProtectionPolicy: DataProtectionPolicy.MustEncrypt,
      foo: "bar",
      quux: [1, 2, 3],
      subobject: { a: 1 },
    };

    const encryptedObj = applyDataProtectionPolicy(clientPolicyActions, obj);
    expect(encryptedObj.keyId).toBe(fetchPublicKeyFromLocal().id);
    expect(encryptedObj.dataProtectionPolicy).toBe(
      DataProtectionPolicy.AlreadyEncrypted
    );
    const decryptedObj = unapplyDataProtectionPolicy(
      serverPolicyActions,
      encryptedObj
    );
    expect(decryptedObj).toEqual(obj);
  });

  test("unapplyDataProtectionPolicy() inverse of applyDataProtectionPolicy() (encrypting only subobjects).", () => {
    const obj: any = {
      foo: "bar",
      quux: [1, 2, 3],
      subobject1: {
        a: 1,
        dataProtectionPolicy: DataProtectionPolicy.MustEncrypt,
      },
      subobject2: {
        dataProtectionPolicy: DataProtectionPolicy.None,
        b: 2,
        subobject3: {
          dataProtectionPolicy: DataProtectionPolicy.MustEncrypt,
          c: { d: 4, e: 5 },
        },
      },
    };
    const encryptedObj = applyDataProtectionPolicy(clientPolicyActions, obj);
    const decryptedObj = unapplyDataProtectionPolicy(
      serverPolicyActions,
      encryptedObj
    );
    expect(decryptedObj).toEqual(obj);
  });

  test("unapplyDataProtectionPolicy() inverse of applyDataProtectionPolicy() (with doubly encrypted subobjects).", () => {
    const original: any = {
      foo: "bar",
      quux: [1, 2, 3],
      subobject1: {
        a: 1,
        dataProtectionPolicy: DataProtectionPolicy.MustEncrypt,
        subobject2: {
          dataProtectionPolicy: DataProtectionPolicy.MustEncrypt,
          c: { d: 4, e: 5 },
        },
      },
    };
    let obj: any = {
      foo: "bar",
      quux: [1, 2, 3],
      subobject1: {
        a: 1,
        dataProtectionPolicy: DataProtectionPolicy.MustEncrypt,
        subobject2: {
          dataProtectionPolicy: DataProtectionPolicy.MustEncrypt,
          c: { d: 4, e: 5 },
        },
      },
    };
    obj["subobject1"]["subobject2"] = applyDataProtectionPolicy(
      clientPolicyActions,
      obj["subobject1"]["subobject2"]
    );
    obj = unapplyDataProtectionPolicy(serverPolicyActions, obj);
    expect(obj).toEqual(original);
    obj["subobject1"]["subobject2"] = applyDataProtectionPolicy(
      clientPolicyActions,
      obj["subobject1"]["subobject2"]
    );
    obj = applyDataProtectionPolicy(clientPolicyActions, obj);
    const decryptedObj = unapplyDataProtectionPolicy(serverPolicyActions, obj);
    expect(decryptedObj).toEqual(original);
  });

  test("(un)applyDataProtectionPolicy() should correctly handle arrays nested at various levels.", () => {
    const obj: any = [
      1,
      2,
      {
        dataProtectionPolicy: DataProtectionPolicy.MustEncrypt,
        b: [1, 2, 3],
        c: "foo",
      },
      [4, 5, 6],
    ];
    const roundtrippedObj = unapplyDataProtectionPolicy(
      serverPolicyActions,
      applyDataProtectionPolicy(clientPolicyActions, obj)
    );
    expect(roundtrippedObj).toStrictEqual(obj);
  });
});
