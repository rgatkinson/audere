import { Transform } from "redux-persist/es/createTransform";
import { encryptionRemovalTransform } from "../../src/store";
import createEncryptor from "redux-persist-transform-encrypt";

const ENCRYPTION_PASSWORD = "hunter2";
const KEY = "somekey";

describe("encryptionRemovalTransform", () => {
  let transform: Transform<any, any>;

  beforeAll(() => {
    transform = encryptionRemovalTransform(
      createEncryptor({ secretKey: ENCRYPTION_PASSWORD })
    );
  });

  it("Rehydrates from unencrypted stored data", () => {
    const storedData = '{"isDemo":true}';
    const rehydratedState = JSON.parse(transform.out(storedData, KEY));
    expect(rehydratedState).toEqual({ isDemo: true });
  });

  it("Rehydrates from encrypted stored data", () => {
    const storedData = "U2FsdGVkX19kV/Wp0NuLLP/otodcVBwvYOtYLdhVvyo=";
    const rehydratedState = JSON.parse(transform.out(storedData, KEY));
    expect(rehydratedState).toEqual({ isDemo: true });
  });

  it("Converts encrypted stored data to unencrypted stored data", () => {
    const storedData = "U2FsdGVkX19kV/Wp0NuLLP/otodcVBwvYOtYLdhVvyo=";
    const rehydratedState = JSON.parse(transform.out(storedData, KEY));
    const newStoredData = JSON.stringify(transform.in(rehydratedState, KEY));
    expect(newStoredData).toEqual('{"isDemo":true}');
  });

  it("Roundtrips state without changing it", () => {
    const persistedState = { isDemo: true };
    const storedData = transform.in(persistedState, KEY);
    const rehydratedState = JSON.parse(transform.out(storedData, KEY));
    expect(rehydratedState).toEqual(persistedState);
  });
});
