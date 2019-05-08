// Copyright (c) 2018, 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { when } from "ts-mockito";
import { AxiosResponse } from "axios";
import { Logger } from "../src/transport/LogUtil";

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

export class ArrayLogger implements Logger {
  public readonly records: string[] = [];

  debug(s: string): void { this.records.push(s); }
  info(s: string): void { this.records.push(s); }
  warn(s: string): void { this.records.push(s); }
  error(s: string): void { this.records.push(s); }
  fatal(s: string): void { this.records.push(s); }
}
