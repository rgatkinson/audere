// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { getLogger } from "./LogUtil";

const logger = getLogger("transport");

export class Pump {
  private readonly handler: () => Promise<void>;
  private isRunning = false;

  public constructor(handler: () => Promise<void>) {
    this.handler = handler;
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
      logger.error(`Pump completed with error: ${error}`)
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
