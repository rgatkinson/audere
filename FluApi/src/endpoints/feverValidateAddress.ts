// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.
import { createGeocoder } from "../util/geocoder";
import { LazyAsync } from "../util/lazyAsync";
import { SecretConfig } from "../util/secretsConfig";
import { SplitSql } from "../util/sql";
import { GeocodingService } from "../../src/services/geocodingService";
import * as Model from "audere-lib/snifflesProtocol";
import { GeocodingResponse } from "../../src/models/geocoding";

export class FeverValidateAddress {
  private readonly sql: SplitSql;
  private readonly geocoder: LazyAsync<GeocodingService>;

  constructor(sql: SplitSql) {
    this.sql = sql;
    this.geocoder = new LazyAsync(() => initializeGeocoder(sql));
  }

  async performRequest(req: any) {
    const formattedRequest = this.createRequest(req);
    const geocoder = await this.geocoder.get();
    const geocoded = await geocoder.geocodeAddresses(formattedRequest);
    return this.formatResults(geocoded);
  }

  createRequest({ query }) {
    const { address, address2, city, state, zipcode } = query;

    return new Map([
      [
        1,
        [
          {
            use: Model.AddressInfoUse.Home,
            line: [address, address2],
            city: city,
            state: state,
            postalCode: zipcode,
            country: "US"
          }
        ]
      ]
    ]);
  }

  formatResults(geocoded: GeocodingResponse[]) {
    return geocoded.map((response: GeocodingResponse) => {
      return {
        address: response.address.address1,
        address2:
          response.address.address2 === "Undefined"
            ? ""
            : response.address.address2,
        city: response.address.city,
        state: response.address.state,
        zipcode: response.address.postalCode
      };
    });
  }
}

async function initializeGeocoder(sql: SplitSql) {
  const secrets = new SecretConfig(sql);
  const geocoder = await createGeocoder(secrets, true);
  return geocoder;
}
