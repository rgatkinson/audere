// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Logger } from "./LogUtil";

export class Pump {
  private readonly handler: () => Promise<void>;
  private readonly logger: Logger;
  private isRunning = false;

  public constructor(handler: () => Promise<void>, logger: Logger) {
    this.handler = handler;
    this.logger = logger;
  }

  // This needs process.nextTick because a reentrant start() request will
  // determine we are already running and have no need to run again.
  // However, the reentrant call may be the final act of something that
  // is queuing up more work, expecting the Pump to take care of it, and
  // is synchronously returning to run().
  //
  // Since we want to write code outside Pump in a way that does not
  // worry about reentrancy, we always check isRunning on a clean thread.
  public start(): void {
    process.nextTick(this.runSafely);
  }

  private runSafely = () => {
    this.run().catch(error =>
      this.logger.error(
        `${error}\nWhile running Pump, callstack:\n${error.stack}`
      )
    );
  };

  private async run(): Promise<void> {
    if (!this.isRunning) {
      this.isRunning = true;
      try {
        await this.handler();
      } finally {
        this.isRunning = false;
      }
    }
  }
}
