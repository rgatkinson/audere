import base64url from "base64url";
import bufferXor from "buffer-xor";

export function createAccessKey() {
  const components = [
    "X12ct9Go-AqgxyjnuCT4uOHFFokVfnB03BXo3vxw_TEQVBAaK53Kkk74mEwU5Nuw",
    process.env.ACCESS_KEY_A || "",
    process.env.ACCESS_KEY_B || "",
  ];
  const buffers = components.map(base64url.toBuffer);
  const buffer = buffers.reduce(bufferXor, new Buffer(0));
  return base64url(buffer);
}
