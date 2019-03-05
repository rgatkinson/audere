// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { CensusTractService } from "../services/censusTractService";
import { GeocodingService } from "../services/geocodingService";
import { getGeocodingConfig } from "./geocodingConfig";
import { SecretConfig } from "./secretsConfig";
import { SmartyStreetsGeocoder } from "../external/smartyStreetsGeocoder";
import { SplitSql } from "./sql";
import * as SmartyStreetsSDK from "smartystreets-javascript-sdk";

export async function createGeocoder(sql: SplitSql): Promise<GeocodingService> {
  const secrets = new SecretConfig(sql);

  const geoConfig = await getGeocodingConfig(secrets);
  const geo = SmartyStreetsSDK.core;
  const credentials = new geo.StaticCredentials(
    geoConfig.authId,
    geoConfig.authToken
  );

  let geoClient;

  // Specifying base URL is leveraged in tests.
  if (
    geoConfig.baseUrl &&
    (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test")
  ) {
    geoClient = new geo.ClientBuilder(credentials)
      .withBaseUrl(geoConfig.baseUrl)
      .buildUsStreetApiClient();
  } else {
    geoClient = new geo.ClientBuilder(credentials).buildUsStreetApiClient();
  }

  const geocoder: GeocodingService = new GeocodingService(
    new SmartyStreetsGeocoder(geoClient),
    new CensusTractService(sql.nonPii)
  );

  return geocoder;
}
