// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

export class ScriptLogger {
  _verbose = false;
  _closed = false;

  setVerbose(value: boolean): void {
    this._verbose = value;
  }

  close(): void {
    this.info("Closing script log.");
    this._closed = true;
  }

  error(s: string): void {
    console.error(s);
  }

  info(s: string): void {
    if (this._closed) {
      throw new Error(`BUG (missing await?) - operation after Logger close: '${s}'`);
    }
    if (this._verbose) {
      console.log(s);
    }
  }
}

export function idtxt(uid: string): string {
  return uid.length <= 16 ? uid : (uid.substring(0, 16) + '...');
}
