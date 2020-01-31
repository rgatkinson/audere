"use strict";
exports.__esModule = true;
var encrypt_1 = require("../src/encrypt");
test("After ensureCurrentKey() called, current key should not be expired (else exception was thrown).", function () {
    encrypt_1.ensureCurrentKey();
    var key = encrypt_1.VisibleForTesting.getKey(encrypt_1.CURRENT_KEY);
    expect(key.isExpired()).toBe(false);
});
test("encryptObject() creates right fields with right types.", function () {
    var obj = { foo: "bar", quux: [1, 2, 3] };
    var key = encrypt_1.VisibleForTesting.getKey(encrypt_1.CURRENT_KEY);
    var encryptedObj = encrypt_1.VisibleForTesting.encryptObject(obj, key);
    var payload = new Uint8Array();
    var expected = {
        keyId: key.id,
        payload: payload,
        encryptionPolicy: encrypt_1.EncryptionPolicy.AlreadyEncrypted
    };
    for (var k in encryptedObj) {
        expect(expected.hasOwnProperty(k)).toBe(true);
        expect(typeof encryptedObj[k]).toBe(typeof expected[k]);
    }
    expect(encryptedObj.keyId).toBe(key.id);
    expect(encryptedObj.encryptionPolicy).toBe(encrypt_1.EncryptionPolicy.AlreadyEncrypted);
});
test("decryptObject() is inverse of encryptObject().", function () {
    var obj = { foo: "bar", quux: [1, 2, 3] };
    var key = encrypt_1.VisibleForTesting.getKey(encrypt_1.CURRENT_KEY);
    var encryptedObj = encrypt_1.VisibleForTesting.encryptObject(obj, key);
    var decryptedObj = encrypt_1.VisibleForTesting.decryptObject(encryptedObj);
    expect(decryptedObj).toEqual(obj);
});
test("applyEncryptionPolicy() should handle nulls and non-object types gracefully.", function () {
    for (var _i = 0, _a = [null, 1, true, "foo", Symbol(29), [1, 2, 3, { a: 1 }]]; _i < _a.length; _i++) {
        var x = _a[_i];
        expect(encrypt_1.applyEncryptionPolicy(x)).toStrictEqual(x);
    }
});
test("unapplyEncryptionPolicy() should handle nulls and non-object types gracefully.", function () {
    for (var _i = 0, _a = [null, 1, true, "foo", Symbol(29), [1, 2, 3, { a: 1 }]]; _i < _a.length; _i++) {
        var x = _a[_i];
        expect(encrypt_1.unapplyEncryptionPolicy(x)).toStrictEqual(x);
    }
});
test("applyEncryptionPolicy() should deep copy objects (apart from those already encrypted).", function () {
    {
        var obj = { a: { b: [1, 2, 3] } };
        var newObj = encrypt_1.applyEncryptionPolicy(obj);
        obj.a.b.push(4);
        newObj.a.b.push(5);
        expect(newObj.a.b).not.toStrictEqual(obj.a.b);
    }
    {
        var obj = encrypt_1.applyEncryptionPolicy({
            a: {
                encryptionPolicy: encrypt_1.EncryptionPolicy.MustEncrypt,
                b: {
                    c: [1, 2, 3],
                    d: "foo"
                }
            }
        });
        var newObj = encrypt_1.applyEncryptionPolicy(obj);
        expect(newObj.a.b).toBe(obj.a.b);
    }
});
test("unapplyEncryptionPolicy() should deep copy objects.", function () {
    var obj = encrypt_1.applyEncryptionPolicy({
        a: {
            encryptionPolicy: encrypt_1.EncryptionPolicy.MustEncrypt,
            b: {
                c: [1, 2, 3],
                d: "foo"
            }
        }
    });
    var newObj1 = encrypt_1.unapplyEncryptionPolicy(obj);
    var newObj2 = encrypt_1.unapplyEncryptionPolicy(obj);
    expect(newObj1.a).toStrictEqual(newObj2.a);
    expect(newObj1.a).not.toBe(newObj2.a);
});
test("unapplyEncryptionPolicy() inverse of applyEncryptionPolicy() (encrypting from root).", function () {
    var obj = {
        encryptionPolicy: encrypt_1.EncryptionPolicy.MustEncrypt,
        foo: "bar",
        quux: [1, 2, 3],
        subobject: { a: 1 }
    };
    var payload = new Uint8Array();
    var key = encrypt_1.VisibleForTesting.getKey(encrypt_1.CURRENT_KEY);
    var expected = {
        keyId: key.id,
        payload: payload,
        encryptionPolicy: encrypt_1.EncryptionPolicy.AlreadyEncrypted
    };
    var encryptedObj = encrypt_1.applyEncryptionPolicy(obj);
    for (var k in encryptedObj) {
        expect(expected.hasOwnProperty(k)).toBe(true);
        expect(typeof encryptedObj[k]).toBe(typeof expected[k]);
    }
    expect(encryptedObj.keyId).toBe(key.id);
    expect(encryptedObj.encryptionPolicy).toBe(encrypt_1.EncryptionPolicy.AlreadyEncrypted);
    var decryptedObj = encrypt_1.unapplyEncryptionPolicy(encryptedObj);
    expect(decryptedObj).toEqual(obj);
});
test("unapplyEncryptionPolicy() inverse of applyEncryptionPolicy() (encrypting only subobjects).", function () {
    var obj = {
        foo: "bar",
        quux: [1, 2, 3],
        subobject1: { a: 1, encryptionPolicy: encrypt_1.EncryptionPolicy.MustEncrypt },
        subobject2: {
            encryptionPolicy: encrypt_1.EncryptionPolicy.None,
            b: 2,
            subobject3: {
                encryptionPolicy: encrypt_1.EncryptionPolicy.MustEncrypt,
                c: { d: 4, e: 5 }
            }
        }
    };
    var encryptedObj = encrypt_1.applyEncryptionPolicy(obj);
    var decryptedObj = encrypt_1.unapplyEncryptionPolicy(encryptedObj);
    expect(decryptedObj).toEqual(obj);
});
test("unapplyEncryptionPolicy() inverse of applyEncryptionPolicy() (with doubly encrypted subobjects).", function () {
    var original = {
        foo: "bar",
        quux: [1, 2, 3],
        subobject1: {
            a: 1,
            encryptionPolicy: encrypt_1.EncryptionPolicy.MustEncrypt,
            subobject2: {
                encryptionPolicy: encrypt_1.EncryptionPolicy.MustEncrypt,
                c: { d: 4, e: 5 }
            }
        }
    };
    var obj = {
        foo: "bar",
        quux: [1, 2, 3],
        subobject1: {
            a: 1,
            encryptionPolicy: encrypt_1.EncryptionPolicy.MustEncrypt,
            subobject2: {
                encryptionPolicy: encrypt_1.EncryptionPolicy.MustEncrypt,
                c: { d: 4, e: 5 }
            }
        }
    };
    obj["subobject1"]["subobject2"] = encrypt_1.applyEncryptionPolicy(obj["subobject1"]["subobject2"]);
    obj = encrypt_1.unapplyEncryptionPolicy(obj);
    expect(obj).toEqual(original);
    obj["subobject1"]["subobject2"] = encrypt_1.applyEncryptionPolicy(obj["subobject1"]["subobject2"]);
    obj = encrypt_1.applyEncryptionPolicy(obj);
    var decryptedObj = encrypt_1.unapplyEncryptionPolicy(obj);
    expect(decryptedObj).toEqual(original);
});
test("(un)applyEncryptionPolicy() should correctly handle arrays nested at various levels.", function () {
    var obj = [
        1,
        2,
        {
            encryptionPolicy: encrypt_1.EncryptionPolicy.MustEncrypt,
            b: [1, 2, 3],
            c: "foo"
        },
        [4, 5, 6],
    ];
    var roundtrippedObj = encrypt_1.unapplyEncryptionPolicy(encrypt_1.applyEncryptionPolicy(obj));
    expect(roundtrippedObj).toStrictEqual(obj);
});
