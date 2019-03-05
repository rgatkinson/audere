// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { ThrottledTaskQueue } from "../../src/util/throttledTaskQueue";

describe("task queue", () => {
  it("should return the results from tasks", async () => {
    const tasks = [async () => 1, async () => 2, async () => 3];

    const queue = new ThrottledTaskQueue(tasks, 10);
    const result = await queue.drain();

    expect(result.sort()).toEqual([1, 2, 3]);
  });

  it("should propagate errors from tasks", async () => {
    const tasks = [
      async () => 1,
      async () => {
        throw new Error("Uh oh");
      },
      async () => 3
    ];

    const queue = new ThrottledTaskQueue(tasks, 10);
    const promise = queue.drain();

    expect(promise).rejects.toThrow("Uh oh");
  });

  it("should limit concurrent active tasks", async () => {
    let curr: number = 0;
    let max: number = 0;

    function work(): Promise<number> {
      curr += 1;
      if (curr > max) max = curr;

      return new Promise((resolve, reject) => {
        setTimeout(() => {
          curr = curr - 1;
          resolve(max);
        }, 10);
      });
    }

    const tasks: Array<() => Promise<number>> = Array(10).fill(() => work());
    const queue = new ThrottledTaskQueue(tasks, 4);
    await queue.drain();

    expect(curr).toBe(0);
    expect(max).toBe(4);
  });
});
