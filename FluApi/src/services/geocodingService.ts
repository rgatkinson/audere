// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { AddressInfo } from "audere-lib/snifflesProtocol";
import { GeocodingResponse } from "../models/geocoding";
import { CensusTractService, LatLng } from "./censusTractService";
import logger from "../util/logger";

export interface Geocoder {
  geocode(addresses: Map<number, AddressInfo[]>): Promise<GeocodingResponse[]>;
}

/**
 * Translates an address into geographic coordinates, specifically lat/lng and
 * census tract.
 */
export class GeocodingService {
  private readonly geocoder: Geocoder;
  private readonly censusTractService: CensusTractService;

  constructor(geocoder: Geocoder, censusTractService: CensusTractService) {
    this.geocoder = geocoder;
    this.censusTractService = censusTractService;
  }

  /**
   * Performs address canonicalization, lat/lng lookup, and census tract lookup
   * on a set of addresses.
   * @param addresses A set of addresses keyed by a stable identifier that will
   * be present in the output if data is found.
   */
  public async geocodeAddresses(
    addresses: Map<number, AddressInfo[]>
  ): Promise<GeocodingResponse[]> {
    const result = await this.geocoder.geocode(addresses);
    logger.info(`[Geocoder] Received ${result.length} responses from geocoder`);
    return result;
  }

  /**
   * Optionally adds census geo id if it can be found.
   * @param addresses Geocoded address data lacking census tract information.
   */
  public async appendCensusTract(
    addresses: GeocodingResponse[]
  ): Promise<GeocodingResponse[]> {
    const latlng: LatLng[] = addresses
      .filter(a => a.address != null)
      .map(a => ({
        latitude: a.address.latitude,
        longitude: a.address.longitude
      }));

    const unique = Array.from(new Set(latlng));

    if (unique.length > 0) {
      logger.info(`[Geocoder] Querying coordinates for census data`);
      const tracts = await this.censusTractService.lookupCensusTract(unique);
      const appended = addresses.map(a => {
        if (a.address != null) {
          const key = a.address.latitude + "|" + a.address.longitude;
          const tract = tracts.get(key);
          a.address.censusTract = tract;
        }

        return a;
      });

      return appended;
    } else {
      return addresses;
    }
  }
}
