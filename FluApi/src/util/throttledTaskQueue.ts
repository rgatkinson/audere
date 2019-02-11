// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

/**
 * A queue of fixed tasks performing async work. The queue accepts a maximum
 * amount of concurrency to limit throughput.
 */
export class ThrottledTaskQueue<T> {
  private workers: Array<() => Promise<T[]>>;
  private tasks: Array<() => Promise<T>> = [];

  constructor(tasks: Array<() => Promise<T>>, maxConcurrent: number) {
    this.workers = Array(maxConcurrent).fill(() => this.doWork());
    this.tasks = tasks;
  }

  private async doWork(): Promise<T[]> {
    const result: T[] = [];

    while(this.tasks.length > 0) {
      const task = this.tasks.pop();
      result.push(await task());
    }

    return result;
  }

  /**
   * Returns the result of processing all tasks. Errors in tasks will reject
   * the resulting promise.
   */
  public async drain(): Promise<Array<T>> {
    const out = await Promise.all(this.workers.map(w => w()));
    return out.reduce((acc, x) => acc.concat(x), []);
  }
}