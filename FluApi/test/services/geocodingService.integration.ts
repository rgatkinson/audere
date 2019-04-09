// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import _ from "lodash";
import { Op } from "sequelize";
import { AddressInfo, AddressInfoUse } from "audere-lib/snifflesProtocol";
import { SmartyStreetsGeocoder } from "../../src/external/smartyStreetsGeocoder";
import {
  defineSmartyStreetsResponse,
  SmartyStreetsResponseModel
} from "../../src/models/db/smartyStreetsResponses";
import { createSplitSql, SplitSql } from "../../src/util/sql";
import { createGeocoder } from "../../src/util/geocoder";
import {
  GeocodingService,
  canonicalizeAddressInfo
} from "../../src/services/geocodingService";
import { SecretConfig } from "../../src/util/secretsConfig";
import exampleResponse from "../resources/geocodingObjectResponse.json";

describe("geocoder cache", () => {
  const address1 = {
    use: AddressInfoUse.Home,
    line: ["42 Fake Address Ln."],
    city: "CITYVILLE",
    state: "CA",
    postalCode: "99999",
    country: "US"
  };
  const address2 = {
    use: AddressInfoUse.Work,
    line: ["99 THIS IS NOT A PLACE"],
    city: "TOWNOPOLIS",
    state: "WA",
    postalCode: "00000",
    country: "US"
  };
  const address1Key = { ...address1 };
  delete address1Key.use;
  const address2Key = { ...address2 };
  delete address2Key.use;

  const addressInfo: Map<number, AddressInfo[]> = new Map([
    [1, [address1, address2]]
  ]);

  let smartyStreetsResponses: SmartyStreetsResponseModel;
  let geocoder: GeocodingService;
  let sql: SplitSql;
  let secrets: SecretConfig;

  beforeAll(async done => {
    sql = createSplitSql();
    smartyStreetsResponses = defineSmartyStreetsResponse(sql);
    secrets = new SecretConfig(sql);
    done();
  });

  afterEach(async done => {
    try {
      const result = await smartyStreetsResponses.destroy({
        where: {
          inputAddress: [address1Key, address2Key].map(canonicalizeAddressInfo)
        }
      });
    } catch (e) {
      console.error(e);
    }
    done();
  });

  it("should cache SmartyStreets responses in the database", async () => {
    let smartyStreetsCalls = 0;
    const client = {
      async send(request) {
        smartyStreetsCalls++;
        return exampleResponse;
      }
    };
    const smartyStreets = new SmartyStreetsGeocoder(client);
    geocoder = await createGeocoder(secrets, sql, false, smartyStreets);
    await geocoder.geocodeAddresses(addressInfo);

    const [cachedResult1, cachedResult2] = await Promise.all(
      [address1Key, address2Key].map(key =>
        smartyStreetsResponses.find({
          where: {
            inputAddress: {
              [Op.eq]: canonicalizeAddressInfo(key)
            }
          }
        })
      )
    );

    expect(cachedResult1).not.toBeNull();
    expect(cachedResult2).not.toBeNull();
    expect(smartyStreetsCalls).toEqual(1);
  });

  it("should not call smartystreets again if a cached result is available", async () => {
    let smartyStreetsCalls = 0;
    const client = {
      async send(request) {
        smartyStreetsCalls++;
        return exampleResponse;
      }
    };
    const smartyStreets = new SmartyStreetsGeocoder(client);
    geocoder = await createGeocoder(secrets, sql, false, smartyStreets);
    await geocoder.geocodeAddresses(addressInfo);

    smartyStreetsCalls = 0;
    await geocoder.geocodeAddresses(addressInfo);

    expect(smartyStreetsCalls).toEqual(0);
  });

  it("should return an empty cached result", async () => {
    const emptyResponse = _.cloneDeep(exampleResponse);
    emptyResponse.lookups.forEach(lookup => (lookup.result = []));

    const client = {
      async send(request) {
        return emptyResponse;
      }
    };
    const smartyStreets = new SmartyStreetsGeocoder(client);
    geocoder = await createGeocoder(secrets, sql, false, smartyStreets);
    await geocoder.geocodeAddresses(addressInfo);

    const result = await geocoder.geocodeAddresses(addressInfo);

    expect(result).toHaveLength(0);
  });
});
