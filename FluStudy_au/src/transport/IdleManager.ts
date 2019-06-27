// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

export class IdleManager {
  private isBusy: boolean;
  private waiter: Waiter | null;

  constructor(startsBusy: boolean) {
    this.isBusy = startsBusy;
    this.waiter = null;
  }

  public async waitForIdle(ms?: number): Promise<void> {
    if (this.isBusy) {
      if (this.waiter == null) {
        this.waiter = newWaiter();
      }

      if (ms) {
        let timeout: Promise<void> = new Promise((resolve, reject) => {
          setTimeout(reject, ms);
        });

        return Promise.race([timeout, this.waiter.promise]);
      } else {
        await this.waiter.promise;
      }
    }
  }

  public setBusy() {
    if (!this.isBusy) {
      this.isBusy = true;
    }
  }

  public setIdle() {
    if (this.isBusy) {
      this.isBusy = false;
      if (this.waiter != null) {
        const waiter = this.waiter;
        this.waiter = null;
        waiter.resolve();
      }
    }
  }
}

function newWaiter(): Waiter {
  let resolve: () => void = () => {};
  let reject: (err: Error) => void = () => {};
  const promise: Promise<void> = new Promise((resolveArg, rejectArg) => {
    resolve = resolveArg;
    reject = rejectArg;
  });
  return { promise, resolve, reject };
}

interface Waiter {
  promise: Promise<void>;
  resolve: () => void;
  reject: (err: Error) => void;
}
