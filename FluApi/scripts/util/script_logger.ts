// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

type WriteFn = (s: string) => void;

export class ScriptLogger {
  _closed = false;
  _verbose = false;
  _write: WriteFn;

  constructor(write: WriteFn) {
    this._write = write;
  }

  setVerbose(value: boolean): void {
    this._verbose = value;
  }

  close(): void {
    this.info("Closing script log.");
    this._closed = true;
  }

  error(s: string): void {
    this._write(s);
  }

  info(s: string): void {
    if (this._closed) {
      throw new Error(
        `BUG (missing await?) - operation after Logger close: '${s}'`
      );
    }
    if (this._verbose) {
      this._write(s);
    }
  }
}

export function idtxt(uid: string): string {
  return uid.length <= 16 ? uid : uid.substring(0, 16) + "...";
}
