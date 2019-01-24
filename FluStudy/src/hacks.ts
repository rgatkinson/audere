import { AxiosInstance } from "axios";
import base64url from "base64url";
import { getLogger } from "./transport/LogUtil";

const logger = getLogger("hacks");

// See https://github.com/facebook/react-native/issues/9599
const scope: any = global;
if (scope && typeof scope.self === "undefined") {
  scope.self = scope;
}

// Expo doesn't support secure random number generation. Instead fetch some random
// bytes from the api server and serve them up from global.crypto.getRandomValues()
let randomBytes: Buffer;
let nextRandomByteIndex = 0;

export async function loadRandomBytes(api: AxiosInstance, numBytes: number) {
  let result;
  try {
    result = await api.get(`/randomBytes/${numBytes}`);
  } catch {
    // Ignore, getRandomValues() will fall back to PRNG
    return;
  }
  if (result.status === 200) {
    randomBytes = base64url.toBuffer(result.data.bytes);
    nextRandomByteIndex = 0;
  } else {
    logger.error("Unable to load more secure random bytes.");
  }
}

scope.crypto = {
  getRandomValues(array: Uint8Array) {
    if (!randomBytes) {
      randomBytes = Buffer.alloc(0);
    }
    let i = 0;
    while (i < array.length && nextRandomByteIndex < randomBytes.length) {
      array[i] = randomBytes.readUInt8(nextRandomByteIndex);
      i++;
      nextRandomByteIndex++;
    }
    if (i < array.length) {
      logger.error(
        `Not enough random bytes loaded, requested ${array.length - i} more. ` +
          `Falling back to pseudorandom bytes`
      );
    }
    while (i < array.length) {
      array[i] = Math.floor(Math.random() * 256);
      i++;
    }
  },
};
