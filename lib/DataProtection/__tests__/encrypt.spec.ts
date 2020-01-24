import {
  applyEncryptionPolicy,
  unapplyEncryptionPolicy,
  EncryptionPolicy,
  ensureCurrentKey,
  CURRENT_KEY,
  VisibleForTesting,
} from "../src/encrypt";

test("After ensureCurrentKey() called, current key should not be expired (else exception was thrown).", () => {
  ensureCurrentKey();
  const key = VisibleForTesting.getKey(CURRENT_KEY);
  expect(key.isExpired()).toBe(false);
});

test("encryptObject() creates right fields with right types.", () => {
  const obj: any = { foo: "bar", quux: [1, 2, 3] };
  const key = VisibleForTesting.getKey(CURRENT_KEY);
  const encryptedObj = VisibleForTesting.encryptObject(obj, key);
  const payload = new Uint8Array();
  const expected = {
    keyId: key.id,
    payload: payload,
    encryptionPolicy: EncryptionPolicy.AlreadyEncrypted,
  };
  for (let k in encryptedObj) {
    expect(expected.hasOwnProperty(k)).toBe(true);
    expect(typeof encryptedObj[k]).toBe(typeof expected[k]);
  }
  expect(encryptedObj.keyId).toBe(key.id);
  expect(encryptedObj.encryptionPolicy).toBe(EncryptionPolicy.AlreadyEncrypted);
});

test("decryptObject() is inverse of encryptObject().", () => {
  const obj: any = { foo: "bar", quux: [1, 2, 3] };
  const key = VisibleForTesting.getKey(CURRENT_KEY);
  const encryptedObj = VisibleForTesting.encryptObject(obj, key);
  const decryptedObj = VisibleForTesting.decryptObject(encryptedObj);
  expect(decryptedObj).toEqual(obj);
});

test("applyEncryptionPolicy() should handle nulls and non-object types gracefully.", () => {
  for (let x of [null, 1, true, "foo", Symbol(29), [1, 2, 3, { a: 1 }]]) {
    expect(applyEncryptionPolicy(x)).toStrictEqual(x);
  }
});

test("unapplyEncryptionPolicy() should handle nulls and non-object types gracefully.", () => {
  for (let x of [null, 1, true, "foo", Symbol(29), [1, 2, 3, { a: 1 }]]) {
    expect(unapplyEncryptionPolicy(x)).toStrictEqual(x);
  }
});

test("applyEncryptionPolicy() should deep copy objects (apart from those already encrypted).", () => {
  {
    let obj: any = { a: { b: [1, 2, 3] } };
    const newObj = applyEncryptionPolicy(obj);
    obj.a.b.push(4);
    newObj.a.b.push(5);
    expect(newObj.a.b).not.toStrictEqual(obj.a.b);
  }

  {
    let obj: any = applyEncryptionPolicy({
      a: {
        encryptionPolicy: EncryptionPolicy.MustEncrypt,
        b: {
          c: [1, 2, 3],
          d: "foo",
        },
      },
    });
    const newObj = applyEncryptionPolicy(obj);
    expect(newObj.a.b).toBe(obj.a.b);
  }
});

test("unapplyEncryptionPolicy() should deep copy objects.", () => {
  let obj: any = applyEncryptionPolicy({
    a: {
      encryptionPolicy: EncryptionPolicy.MustEncrypt,
      b: {
        c: [1, 2, 3],
        d: "foo",
      },
    },
  });
  const newObj1 = unapplyEncryptionPolicy(obj);
  const newObj2 = unapplyEncryptionPolicy(obj);
  expect(newObj1.a).toStrictEqual(newObj2.a);
  expect(newObj1.a).not.toBe(newObj2.a);
});

test("unapplyEncryptionPolicy() inverse of applyEncryptionPolicy() (encrypting from root).", () => {
  const obj: any = {
    encryptionPolicy: EncryptionPolicy.MustEncrypt,
    foo: "bar",
    quux: [1, 2, 3],
    subobject: { a: 1 },
  };
  const payload = new Uint8Array();
  const key = VisibleForTesting.getKey(CURRENT_KEY);
  const expected = {
    keyId: key.id,
    payload: payload,
    encryptionPolicy: EncryptionPolicy.AlreadyEncrypted,
  };
  const encryptedObj = applyEncryptionPolicy(obj);
  for (let k in encryptedObj) {
    expect(expected.hasOwnProperty(k)).toBe(true);
    expect(typeof encryptedObj[k]).toBe(typeof expected[k]);
  }
  expect(encryptedObj.keyId).toBe(key.id);
  expect(encryptedObj.encryptionPolicy).toBe(EncryptionPolicy.AlreadyEncrypted);
  const decryptedObj = unapplyEncryptionPolicy(encryptedObj);
  expect(decryptedObj).toEqual(obj);
});

test("unapplyEncryptionPolicy() inverse of applyEncryptionPolicy() (encrypting only subobjects).", () => {
  const obj: any = {
    foo: "bar",
    quux: [1, 2, 3],
    subobject1: { a: 1, encryptionPolicy: EncryptionPolicy.MustEncrypt },
    subobject2: {
      encryptionPolicy: EncryptionPolicy.None,
      b: 2,
      subobject3: {
        encryptionPolicy: EncryptionPolicy.MustEncrypt,
        c: { d: 4, e: 5 },
      },
    },
  };
  const encryptedObj = applyEncryptionPolicy(obj);
  const decryptedObj = unapplyEncryptionPolicy(encryptedObj);
  expect(decryptedObj).toEqual(obj);
});

test("unapplyEncryptionPolicy() inverse of applyEncryptionPolicy() (with doubly encrypted subobjects).", () => {
  const original: any = {
    foo: "bar",
    quux: [1, 2, 3],
    subobject1: {
      a: 1,
      encryptionPolicy: EncryptionPolicy.MustEncrypt,
      subobject2: {
        encryptionPolicy: EncryptionPolicy.MustEncrypt,
        c: { d: 4, e: 5 },
      },
    },
  };
  let obj: any = {
    foo: "bar",
    quux: [1, 2, 3],
    subobject1: {
      a: 1,
      encryptionPolicy: EncryptionPolicy.MustEncrypt,
      subobject2: {
        encryptionPolicy: EncryptionPolicy.MustEncrypt,
        c: { d: 4, e: 5 },
      },
    },
  };
  obj["subobject1"]["subobject2"] = applyEncryptionPolicy(
    obj["subobject1"]["subobject2"]
  );
  obj = unapplyEncryptionPolicy(obj);
  expect(obj).toEqual(original);
  obj["subobject1"]["subobject2"] = applyEncryptionPolicy(
    obj["subobject1"]["subobject2"]
  );
  obj = applyEncryptionPolicy(obj);
  const decryptedObj = unapplyEncryptionPolicy(obj);
  expect(decryptedObj).toEqual(original);
});

test("(un)applyEncryptionPolicy() should correctly handle arrays nested at various levels.", () => {
  const obj: any = [
    1,
    2,
    {
      encryptionPolicy: EncryptionPolicy.MustEncrypt,
      b: [1, 2, 3],
      c: "foo"
    },
    [4, 5, 6]
  ];
  const roundtrippedObj = unapplyEncryptionPolicy(applyEncryptionPolicy(obj));
  expect(roundtrippedObj).toStrictEqual(obj);
});
