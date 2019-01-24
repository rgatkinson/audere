import { when } from "ts-mockito";
import { AxiosResponse } from "axios";

/**
 * Returns a promise that resolves when methodName is called on the mock
 */
export function nextCall(
  mock: any,
  methodName: string,
  matchers: Array<Function>,
  ret?: any
): Promise<void> {
  return new Promise(resolve => {
    when(mock[methodName](...matchers)).thenCall(() => {
      process.nextTick(resolve);
      return ret;
    });
  });
}

export async function axiosResponse(data?: any): Promise<AxiosResponse> {
  return {
    data,
    status: 200,
    statusText: "OK",
    headers: [],
    config: {},
  };
}

/**
 * Returns a promise that resolves after n ticks
 */
export function ticks(n: number): Promise<void> {
  if (n <= 0) {
    return Promise.resolve();
  }
  return new Promise(resolve =>
    ticks(n - 1).then(() => process.nextTick(resolve))
  );
}
