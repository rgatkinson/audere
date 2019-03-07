// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import _ from "lodash";
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

    it("should batch every 100 lookups", async () => {
      let calls = 0;

      const client = {
        async send(request) {
          const response = _.cloneDeep(exampleResponse);
          let lookups = [];

          for (let i = 0; i < 50; i++) {
            const tmp = _.cloneDeep(exampleResponse.lookups);
            tmp[0].inputId = `${calls * 50 + i}_home`;
            tmp[1].inputId = `${calls * 50 + i}_work`;
            lookups = lookups.concat(tmp);
          }

          response.lookups = lookups;
          calls++;
          return response;
        }
      };

      const lotsOfAddressInfo = new Map();

      for (let i = 1; i <= 500; i++) {
        lotsOfAddressInfo.set(i, _.cloneDeep(addressInfo.get(1)));
      }

      const geocoder = new SmartyStreetsGeocoder(client);
      const result = await geocoder.geocode(lotsOfAddressInfo);

      expect(calls).toBe(10);
      expect(result).toHaveLength(1000);
    });

    it("should parse the responses as GeocodingResponses", async () => {
      const client = {
        async send(request) {
          return exampleResponse;
        }
      };

      const geocoder = new SmartyStreetsGeocoder(client);
      const result = await geocoder.geocode(addressInfo);

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
