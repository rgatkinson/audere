// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { cronGet } from "../src/handler";
import nock = require("nock");
import Url = require("url-parse");

describe("cronGet handler", () => {
  const OLD_ENV = process.env;
  let serviceUrl;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    process.env.TARGET_URL="https://www.flu.com/upload";
    serviceUrl = new Url(process.env.TARGET_URL);
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it("should error if the request to the endpoint fails", async () => {
    nock(serviceUrl.origin)
      .get(serviceUrl.pathname)
      .reply(400);

    const result = cronGet({});

    await expect(result).rejects.toThrow();
  });

  it("should return the json reply", async () => {
    const reply = { sent: [1, 2, 3], erred: [] };
    nock(serviceUrl.origin)
      .get(serviceUrl.pathname)
      .reply(200, { sent: [1, 2, 3], erred: [] });

    const result = await cronGet({});

    expect(result).toEqual(reply);
  });
});
