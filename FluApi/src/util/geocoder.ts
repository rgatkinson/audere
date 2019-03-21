// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { CensusTractService } from "../services/censusTractService";
import { GeocodingService } from "../services/geocodingService";
import { getGeocodingConfig } from "./geocodingConfig";
import { isAWS } from "./environment";
import { SecretConfig } from "./secretsConfig";
import { SmartyStreetsGeocoder } from "../external/smartyStreetsGeocoder";
import Sequelize from "sequelize";
import * as SmartyStreetsSDK from "smartystreets-javascript-sdk";

export async function createGeocoder(
  secrets: SecretConfig
): Promise<GeocodingService> {
  const geoConfig = await getGeocodingConfig(secrets);

  const geo = SmartyStreetsSDK.core;
  const credentials = new geo.StaticCredentials(
    geoConfig.authId,
    geoConfig.authToken
  );

  let geoClient;

  //Specifying base URL is leveraged in tests.
  if (geoConfig.baseUrl && !isAWS()) {
    geoClient = new geo.ClientBuilder(credentials)
      .withBaseUrl(geoConfig.baseUrl)
      .buildUsStreetApiClient();
  } else {
    geoClient = new geo.ClientBuilder(credentials).buildUsStreetApiClient();
  }

  const postgis = new Sequelize(geoConfig.postgisUrl, {
    // This globally enables search path options, if not enabled search path
    // options are deleted from config.
    dialectOptions: {
      prependSearchPath: true
    },
    logging: false,
    operatorsAliases: false
  });

  const geocoder: GeocodingService = new GeocodingService(
    new SmartyStreetsGeocoder(geoClient),
    new CensusTractService(postgis)
  );

  return geocoder;
}
