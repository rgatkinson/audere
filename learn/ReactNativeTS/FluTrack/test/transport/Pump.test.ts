// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Pump } from "../../src/transport/Pump";
import { ArrayLogger, ticks } from "../util";

const logger = new ArrayLogger();

describe("Pump", () => {
  it("invokes the handler", async () => {
    let markAsRan: Function;
    const pumpRan = new Promise(resolve => (markAsRan = resolve));
    const pump = new Pump(async () => {
      markAsRan();
    }, logger);
    pump.start();
    await pumpRan;
  });

  it("will not run the handler if it's already running", async () => {
    let runs = 0;
    const pump = new Pump(() => {
      runs += 1;
      // never resolve
      return new Promise(() => {});
    }, logger);

    pump.start();
    await ticks(2);
    expect(runs).toEqual(1);

    pump.start();
    await ticks(2);
    expect(runs).toEqual(1);
  });

  it("will rerun the handler if the previous run completed", async () => {
    let runs = 0;
    const pump = new Pump(async () => {
      runs += 1;
    }, logger);

    pump.start();
    await ticks(2);
    expect(runs).toEqual(1);

    pump.start();
    await ticks(2);
    expect(runs).toEqual(2);
  });
});
