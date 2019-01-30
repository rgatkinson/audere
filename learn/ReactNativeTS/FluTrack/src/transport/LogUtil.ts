// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

export interface Logger {
  debug(s: string): void;
  info(s: string): void;
  warn(s: string): void;
  error(s: string): void;
  fatal(s: string): void;
}

export function summarize(obj: object): string {
  const json = JSON.stringify(obj);
  if (json.length < 70) {
    return json;
  } else {
    const prefix = json.substr(0, 50);
    const suffix = json.substr(json.length - 18);
    return `${prefix}...${suffix}`;
  }
}

export class ArrayLogger implements Logger {
  public readonly records: string[] = [];

  debug(s: string): void { this.records.push(s); }
  info(s: string): void { this.records.push(s); }
  warn(s: string): void { this.records.push(s); }
  error(s: string): void { this.records.push(s); }
  fatal(s: string): void { this.records.push(s); }
}
