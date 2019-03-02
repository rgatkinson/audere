// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { hutchUpload } from "../src/handler";
import nock = require("nock");
import Url = require("url-parse");

describe("sendEncounters handler", () => {
  const OLD_ENV = process.env;
  let serviceUrl;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    process.env.FLU_SERVICE_UPLOAD_PATH="https://www.flu.com/upload";
    serviceUrl = new Url(process.env.FLU_SERVICE_UPLOAD_PATH);
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it("should error if the request to send encounters fails", async () => {
    nock(serviceUrl.origin)
      .get(serviceUrl.pathname)
      .reply(400);

    const result = hutchUpload({});

    await expect(result).rejects.toThrow();
  });

  it("should error upon receiving an unknown response payload", async () => {
    nock(serviceUrl.origin)
      .get(serviceUrl.pathname)
      .reply(200, {});

    const result = hutchUpload({});

    await expect(result).rejects.toThrow();
  });

  it("should return the number of successfully uploaded records", async () => {
    nock(serviceUrl.origin)
      .get(serviceUrl.pathname)
      .reply(200, { sent: [1, 2, 3], erred: [] });

    const result = await hutchUpload({});

    expect(result).toBe(3);
  });
});
