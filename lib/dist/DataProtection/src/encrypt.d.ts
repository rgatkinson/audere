export declare enum EncryptionPolicy {
    None = "None",
    MustEncrypt = "MustEncrypt",
    AlreadyEncrypted = "AlreadyEncrypted"
}
export declare class EncryptionError {
    readonly code: EncryptionError.Code;
    readonly message: string;
    constructor(code: EncryptionError.Code, message?: string);
}
export declare namespace EncryptionError {
    enum Code {
        NoKey = 0,
        KeyExpired = 1,
        UnknownEncryptionPolicy = 2
    }
}
export interface Key {
    id: string;
    isExpired(): boolean;
}
export declare const CURRENT_KEY: unique symbol;
export declare const NEW_KEY: unique symbol;
export declare function ensureCurrentKey(forceRenewalEvenIfUnexpired?: boolean): void;
export declare function applyEncryptionPolicy(root: any, allowExpiredKey?: boolean): any;
export declare function unapplyEncryptionPolicy(root: any): any;
declare function getKey(keyId?: string | typeof CURRENT_KEY): Key | null;
declare function encryptObject(obj: any, key: Key): {
    encryptionPolicy: EncryptionPolicy;
    keyId: string;
    payload: Array<number>;
};
declare function decryptObject(obj: any): object;
export declare const VisibleForTesting: {
    getKey: typeof getKey;
    encryptObject: typeof encryptObject;
    decryptObject: typeof decryptObject;
};
export {};
