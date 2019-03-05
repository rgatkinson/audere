// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { AddressInfo, AddressInfoUse } from "audere-lib/snifflesProtocol";
import { SmartyStreetsGeocoder } from "../../src/external/smartyStreetsGeocoder";
import exampleResponse from "../resources/geocodingObjectResponse.json";

describe("Smarty Streets geocoder", () => {
  const addressInfo: Map<number, AddressInfo[]> = new Map([
    [
      1,
      [
        {
          use: AddressInfoUse.Home,
          line: ["3301 S Greenfield Road"],
          city: "Gilbert",
          state: "AZ",
          postalCode: "85297",
          country: "US"
        },
        {
          use: AddressInfoUse.Work,
          line: ["100 Hinckley Way"],
          city: "Belmont",
          state: "MA",
          postalCode: "02478",
          country: "US"
        }
      ]
    ]
  ]);

  describe("geocode", () => {
    it("should batch and send requests to the geocoding API", async () => {
      let validBatch = false;
      function validate(request) {
        validBatch =
          request.lookups.some(x => x.inputId === "1_home") &&
          request.lookups.some(x => x.inputId === "1_work");
      }

      const client = {
        async send(request) {
          validate(request);
          return exampleResponse;
        }
      };

      const geocoder = new SmartyStreetsGeocoder(client);
      await geocoder.geocode(addressInfo);

      expect(validBatch).toBe(true);
    });

    it("should parse the responses as GeocodingResponses", async () => {
      const client = {
        async send(request) {
          return exampleResponse;
        }
      };

      const geocoder = new SmartyStreetsGeocoder(client);
      const result = await geocoder.geocode(addressInfo);
      const x = 5;

      expect(result.length).toBe(2);
      expect(
        result.some(
          x =>
            x.id === 1 &&
            x.use === AddressInfoUse.Home &&
            x.address.latitude === 33.28748 &&
            x.address.longitude === -111.75881 &&
            x.address.postalCode === "85297"
        )
      ).toBe(true);
      expect(
        result.some(
          x =>
            x.id === 1 &&
            x.use === AddressInfoUse.Work &&
            x.address.latitude === 42.41062 &&
            x.address.longitude === -71.18248 &&
            x.address.postalCode === "02478"
        )
      ).toBe(true);
    });
  });
});
