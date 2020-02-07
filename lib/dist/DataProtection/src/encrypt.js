"use strict";
// Copyright (c) 2020 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.
exports.__esModule = true;
var util_1 = require("util");
var EncryptionPolicy;
(function (EncryptionPolicy) {
    EncryptionPolicy["None"] = "None";
    EncryptionPolicy["MustEncrypt"] = "MustEncrypt";
    EncryptionPolicy["AlreadyEncrypted"] = "AlreadyEncrypted";
})(EncryptionPolicy = exports.EncryptionPolicy || (exports.EncryptionPolicy = {}));
var EncryptionError = /** @class */ (function () {
    function EncryptionError(code, message) {
        if (message === void 0) { message = ""; }
        this.code = code;
        this.message = message;
    }
    return EncryptionError;
}());
exports.EncryptionError = EncryptionError;
(function (EncryptionError) {
    var Code;
    (function (Code) {
        Code[Code["NoKey"] = 0] = "NoKey";
        Code[Code["KeyExpired"] = 1] = "KeyExpired";
        Code[Code["UnknownEncryptionPolicy"] = 2] = "UnknownEncryptionPolicy";
    })(Code = EncryptionError.Code || (EncryptionError.Code = {}));
})(EncryptionError = exports.EncryptionError || (exports.EncryptionError = {}));
exports.EncryptionError = EncryptionError;
exports.CURRENT_KEY = Symbol("Current Key");
exports.NEW_KEY = Symbol("New Key");
function ensureCurrentKey(forceRenewalEvenIfUnexpired) {
    if (forceRenewalEvenIfUnexpired === void 0) { forceRenewalEvenIfUnexpired = false; }
    var currentKey = getKey(exports.CURRENT_KEY);
    if (currentKey === null ||
        currentKey.isExpired() ||
        forceRenewalEvenIfUnexpired) {
        var newKey = fetchKey(exports.NEW_KEY);
        if (newKey !== null) {
            setCurrentKey(newKey);
        }
    }
}
exports.ensureCurrentKey = ensureCurrentKey;
function applyEncryptionPolicy(root, allowExpiredKey) {
    if (allowExpiredKey === void 0) { allowExpiredKey = false; }
    var currentKey = getKey(exports.CURRENT_KEY);
    if (currentKey === null) {
        throw new EncryptionError(EncryptionError.Code.NoKey, "No current key.");
    }
    if (currentKey.isExpired()) {
        if (allowExpiredKey) {
            // TODO: plug in real logger
            console.warn("Applying encryption policy using expired key " + currentKey.id + ".");
        }
        else {
            throw new EncryptionError(EncryptionError.Code.KeyExpired, "Cannot apply encryption policy with expired key.");
        }
    }
    function visit(obj) {
        if (obj === null || typeof obj !== "object") {
            return obj;
        }
        else if (obj instanceof Array) {
            return obj.map(function (e) { return visit(e); });
        }
        var policy = obj.encryptionPolicy || EncryptionPolicy.None;
        switch (policy) {
            case EncryptionPolicy.None: {
                // Go to a little trouble here to make full deep copies of
                // fields.
                var copy = {};
                for (var k in obj) {
                    copy[k] = visit(obj[k]);
                }
                return copy;
            }
            case EncryptionPolicy.MustEncrypt: {
                return encryptObject(obj, currentKey);
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
                throw new EncryptionError(EncryptionError.Code.UnknownEncryptionPolicy, "Unknown or unimplemented encryption policy '" + policy + "'.");
            }
        }
    }
    return visit(root);
}
exports.applyEncryptionPolicy = applyEncryptionPolicy;
function unapplyEncryptionPolicy(root) {
    if (root === null || typeof root !== "object") {
        return root;
    }
    else if (root instanceof Array) {
        return root.map(function (e) { return unapplyEncryptionPolicy(e); });
    }
    function visitChildren(parent) {
        var copy = {};
        for (var k in parent) {
            copy[k] = unapplyEncryptionPolicy(parent[k]);
        }
        return copy;
    }
    var policy = root.encryptionPolicy || EncryptionPolicy.None;
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
            throw new EncryptionError(EncryptionError.Code.UnknownEncryptionPolicy, "Unknown or unimplemented encryption policy '" + policy + "'.");
        }
    }
}
exports.unapplyEncryptionPolicy = unapplyEncryptionPolicy;
function getKey(keyId) {
    if (keyId === void 0) { keyId = exports.CURRENT_KEY; }
    return { id: "abcde29", isExpired: function () { return false; } };
}
function fetchKey(keyId) {
    if (keyId === void 0) { keyId = exports.NEW_KEY; }
    return { id: "abcde29", isExpired: function () { return false; } };
}
function setCurrentKey(key) {
    // TODO
}
function encryptObject(obj, key) {
    return {
        encryptionPolicy: EncryptionPolicy.AlreadyEncrypted,
        keyId: key.id,
        payload: Array.from(new util_1.TextEncoder().encode(JSON.stringify(obj)))
    };
}
function decryptObject(obj) {
    return JSON.parse(new util_1.TextDecoder().decode(Uint8Array.from(obj.payload)));
}
// Should be used exclusively for testing.
exports.VisibleForTesting = {
    getKey: getKey,
    encryptObject: encryptObject,
    decryptObject: decryptObject
};