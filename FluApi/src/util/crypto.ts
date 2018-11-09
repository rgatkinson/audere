import crypto from "crypto";
import base64url from "base64url";

export async function generateRandomKey(length = 64): Promise<string> {
  const bytes = await generateRandomBytes((length * 3) / 4);
  return base64url(String.fromCharCode(...new Uint8Array(bytes)));
}

function generateRandomBytes(numBytes: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(numBytes, (err, buf) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(buf);
    });
  });
}
