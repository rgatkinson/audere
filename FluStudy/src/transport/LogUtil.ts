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
  const json = JSON.stringify(obj, truncatingReplacer(70));
  if (json.length < 70) {
    return json;
  } else {
    const prefix = json.substr(0, 50);
    const suffix = json.substr(json.length - 18);
    return `${prefix}...${suffix}`;
  }
}

interface StringifyReplacer {
  (key: any, value: any): any;
}

export function truncatingReplacer(size: number): StringifyReplacer {
  return (k: any, v: any) => typeof v !== "string" ? v : truncate(v, size);
}

function truncate(str: string, size: number): string {
  return str.length <= size ? str : `${str.substring(0, size - 3)}...`;
}
