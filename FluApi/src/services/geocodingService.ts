// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { AddressInfo } from "audere-lib/common";
import { CensusTractService, LatLng } from "./censusTractService";
import { GeocodingResponse } from "../models/geocoding";
import { AddressDetails } from "../models/encounterDetails";
import { Op } from "sequelize";
import {
  SmartyStreetsResponseModel,
  SmartyStreetsResponseAttributes
} from "../models/db/smartyStreetsResponses";
import logger from "../util/logger";
import moment from "moment";
import _ from "lodash";

export interface Geocoder {
  geocode(addresses: Map<string, AddressInfo[]>): Promise<GeocodingResponse[]>;
}

type GetCachedAddressesResult = {
  cachedResults: GeocodingResponse[];
  uncachedAddressesMap: Map<string, AddressInfo[]>;
};

/**
 * Translates an address into geographic coordinates, specifically lat/lng and
 * census tract.
 */
export class GeocodingService {
  private readonly geocoder: Geocoder;
  private readonly censusTractService: CensusTractService;
  private readonly smartyStreetResponses: SmartyStreetsResponseModel;

  constructor(
    geocoder: Geocoder,
    censusTractService: CensusTractService,
    smartyStreetResponses: SmartyStreetsResponseModel
  ) {
    this.geocoder = geocoder;
    this.censusTractService = censusTractService;
    this.smartyStreetResponses = smartyStreetResponses;
  }

  /**
   * Performs address canonicalization, lat/lng lookup, and census tract lookup
   * on a set of addresses.
   *
   * @param addresses A set of addresses keyed by a stable identifier that will
   * be present in the output if data is found.
   */
  public async geocodeAddresses(
    addresses: Map<string, AddressDetails[]>
  ): Promise<GeocodingResponse[]> {
    const {
      cachedResults,
      uncachedAddressesMap
    } = await this.getCachedAddresses(addresses);

    const uncachedAddressesCount = Array.from(
      uncachedAddressesMap.values()
    ).reduce((sum, values) => sum + values.length, 0);
    logger.info(
      `[Geocoder] Requesting ${uncachedAddressesCount} addresses from smartystreets`
    );

    const results = await this.geocoder.geocode(uncachedAddressesMap);
    logger.info(
      `[Geocoder] Received ${results.length} responses from smartystreets`
    );

    await this.updateAddressCache(uncachedAddressesMap, results);
    return results.concat(cachedResults);
  }

  private async getCachedAddresses(
    addresses: Map<string, AddressDetails[]>
  ): Promise<GetCachedAddressesResult> {
    const allAddressInfos = [];
    addresses.forEach((v, k) =>
      allAddressInfos.push(...v.map(a => canonicalizeAddressInfo(a.value)))
    );
    logger.info(`[Geocoder] Geocoding ${allAddressInfos.length} addresses`);

    const cachedResponses = await this.smartyStreetResponses.findAll({
      where: {
        inputAddress: {
          [Op.in]: allAddressInfos
        },
        createdAt: {
          [Op.gt]: moment()
            .subtract(2, "weeks")
            .toDate()
        }
      }
    });

    const uncachedAddressesMap: Map<string, AddressInfo[]> = new Map();
    const cachedResults: GeocodingResponse[] = [];
    let emptyCachedResponseCount = 0;

    addresses.forEach((v, k) => {
      v.forEach(addressInfo => {
        const a = canonicalizeAddressInfo(addressInfo.value);
        const c = cachedResponses.find(r =>
          addressInfosEqual(r.inputAddress, a)
        );

        if (c != null) {
          if (c.responseAddresses.length > 0) {
            cachedResults.push({
              id: k,
              use: addressInfo.use,
              addresses: c.responseAddresses
            });
          } else {
            emptyCachedResponseCount++;
          }
        } else {
          const uncached = uncachedAddressesMap.get(k) || [];
          uncached.push(a);
          uncachedAddressesMap.set(k, uncached);
        }
      });
    });

    logger.info(
      `[Geocoder] ${cachedResults.length} addresses were found in the cache, ` +
        `along with ${emptyCachedResponseCount} empty responses.`
    );

    return {
      cachedResults,
      uncachedAddressesMap
    };
  }

  private async updateAddressCache(
    uncachedAddressesMap: Map<string, AddressInfo[]>,
    results: GeocodingResponse[]
  ): Promise<void> {
    const newResponses: SmartyStreetsResponseAttributes[] = [];

    for (let [key, addresses] of uncachedAddressesMap.entries()) {
      addresses.forEach(address => {
        const result = results.find(result => result.id === key);

        newResponses.push({
          inputAddress: canonicalizeAddressInfo(address),
          responseAddresses: result == null ? [] : result.addresses
        });
      });
    }

    await this.smartyStreetResponses.bulkCreate(newResponses, {
      ignoreDuplicates: true
    });
  }

  /**
   * Optionally adds census geo id if it can be found.
   * @param addresses Geocoded address data lacking census tract information.
   */
  public async appendCensusTract(
    responses: GeocodingResponse[]
  ): Promise<GeocodingResponse[]> {
    const latlng: LatLng[] = [];

    responses
      .filter(r => r.addresses != null)
      .forEach(r => {
        const coordinates = r.addresses.map(a => ({
          latitude: a.latitude,
          longitude: a.longitude
        }));
        latlng.push(...coordinates);
      });

    const unique = Array.from(new Set(latlng));

    if (unique.length > 0) {
      logger.info(`[Geocoder] Querying coordinates for census data`);
      const tracts = await this.censusTractService.lookupCensusTract(unique);
      const appended = responses.map(r => {
        if (r.addresses != null) {
          r.addresses.forEach(a => {
            const key = a.latitude + "|" + a.longitude;
            const tract = tracts.get(key);
            a.censusTract = tract;
          });
        }

        return r;
      });

      return appended;
    } else {
      return responses;
    }
  }
}

const ADDRESS_EQUALITY_KEYS = [
  "line",
  "city",
  "state",
  "postalCode",
  "country"
];

export function addressInfosEqual(
  addr1: AddressInfo,
  addr2: AddressInfo
): boolean {
  return ADDRESS_EQUALITY_KEYS.every(keyToCheck => {
    if (!Array.isArray(addr1[keyToCheck])) {
      return addr1[keyToCheck] === addr2[keyToCheck];
    }

    if (addr1[keyToCheck].length !== addr2[keyToCheck].length) {
      return false;
    }
    return addr1[keyToCheck].every((value, index) => {
      const value2 = addr2[keyToCheck][index];
      return value == null ? value2 == null : value === value2;
    });
  });
}

export function cleanAddressString(str: string): string {
  if (!str || !str.toUpperCase) {
    return str;
  }

  return str.toUpperCase().replace(/[,.]/g, "");
}

export function canonicalizeAddressInfo(address: AddressInfo): AddressInfo {
  address = { ...address };

  // Removes known properties from types implementing the AddressInfo interface
  delete (<any>address).use;
  delete (<any>address).name;
  delete (<any>address).firstName;
  delete (<any>address).lastName;

  for (let part in address) {
    if (Array.isArray(address[part])) {
      address[part] = address[part].map(cleanAddressString);
    } else {
      address[part] = cleanAddressString(address[part]);
    }
  }

  return address;
}
