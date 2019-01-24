// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

export interface Logger {
  trace(s: string): void;
  debug(s: string): void;
  info(s: string): void;
  warn(s: string): void;
  error(s: string): void;
  fatal(s: string): void;
}

// Short-term workaround to issues using "log4js" in an RN context
export function getLogger(name?: string): Logger {
  if (name != null) {
    return makeLogger(s => console.log(`${name}: ${s}`));
  } else {
    return makeLogger(s => console.log(s));
  }
}

function makeLogger(write: (s: string) => void): Logger {
  return {
    trace: write,
    debug: write,
    info: write,
    warn: write,
    error: write,
    fatal: write,
  };
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
