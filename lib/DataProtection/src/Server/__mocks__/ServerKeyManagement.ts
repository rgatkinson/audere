// Copyright (c) 2020 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { KeyPair } from "../../Types";

let storedKeyPair: KeyPair = {
  id: "29",
  privateKey:
    "-----BEGIN RSA PRIVATE KEY-----\
MIICXAIBAAKBgQCpa0Rk6xLFP5FrNNn7B9wjgvBgzaqH8XB+jMa8oUZw/rU0ngra\
Xp9ILYnFaCI3ZQq71K4+XxzNBnP6Elsq/BRV5G+s8r1BYgQh8TQmaI0EQTwQsayQ\
LmUrn+iWagOjhiYQxvP4DmdjTf+w4bRfbWJST7RhdDkLlZU0ZcdzPYiLHQIDAQAB\
AoGAXp89fMvaGPaPBnxnPpA+QEsybC6SDwknFlcT7Gh6ykNH+5JFZ38voQVmDC5D\
5gJ2A0Ae7VD76fqvrbyw1Ioj5Iha46t2FwQJH5VQxJ1NdEF9kEergw749xk3Y0ka\
H4zD3xvyOQTDS84ZgOO/+sdiGhVMQ7yhiitDVnGcOJcGtbUCQQDUd/JAHqqRAHLk\
atZFwHwc6lsT++iKfxHJVi5l4u4aLgX+xuNPpTrm6Yz7na4XxqO7IQ4NzLjNt2AB\
4KJZKI1bAkEAzCFbcADxHyLPQQr1dzj7t60deYTML/IdtiiR9mVQnI9dRulPTkIi\
6N8MglsMSdEwguuYqXq0UBr5ESMt8e1a5wJAd3xdCCI22gTemAZdKiztn3VMcxif\
1gNQBWIqBbJxJNftFzLScuABGAsP9hDe7xAO1BXqyWfwJgCSRXwG0Q01MQJAbio+\
d8b6Wmxl39tzOCGXr7wM4S0rKWEIaeuhQpHRHH0+wOtfMoP85SKjVKKgkiIEhVNy\
s1yWfXjhHD+ZJyyK1wJBAL1+Z40Hi+LpzVsCrVVnY/Xn44KmeM7RNhkbsL4WLVWd\
MHfDkp894mTevwRDF1yF0LIlomki9ECsqwYJSERxuGY=\
-----END RSA PRIVATE KEY-----",
  publicKey:
    "-----BEGIN PUBLIC KEY-----\
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCpa0Rk6xLFP5FrNNn7B9wjgvBg\
zaqH8XB+jMa8oUZw/rU0ngraXp9ILYnFaCI3ZQq71K4+XxzNBnP6Elsq/BRV5G+s\
8r1BYgQh8TQmaI0EQTwQsayQLmUrn+iWagOjhiYQxvP4DmdjTf+w4bRfbWJST7Rh\
dDkLlZU0ZcdzPYiLHQIDAQAB\
-----END PUBLIC KEY-----",
  expiryDate: null,
};

function generateKeyPair(expiryDate?: Date): KeyPair {
  return storedKeyPair;
}

function storeKeyPair(keyPair: KeyPair): KeyPair {
  return storedKeyPair;
}

export function fetchKeyPair(keyId: string): KeyPair {
  return storedKeyPair;
}

function fetchCurrentKeyPairs(limit?: number): KeyPair[] {
  throw new Error("not yet implemented");
}

export function ensureCurrentKeyPair(): void {
  if (storedKeyPair === null) {
    const newKeyPair = generateKeyPair();
    storeKeyPair(newKeyPair);
  }
}
