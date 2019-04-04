// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import WinstonTransport from "winston-transport";

export class WinstonBuffer extends WinstonTransport {
  private logs: LogInfo[] = [];

  constructor(opts = {}) {
    super(opts);
  }

  log(info, done) {
    setImmediate(() => this.emit("logged", info));
    this.logs.push(info);
    done();
  }

  consume(): LogInfo[] {
    const logs = this.logs;
    this.logs = [];
    return logs;
  }
}

interface LogInfo {
  message: string;
  level: string
}
